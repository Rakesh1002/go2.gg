import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, "..");
const skillsRoot = join(webRoot, "public", "skills");
const skillDir = join(skillsRoot, "go2");
const tarball = join(skillsRoot, "go2.tar.gz");
const hashOut = join(webRoot, "lib", "agentic", "skills-hash.json");

if (!existsSync(skillDir)) {
  console.error(`[build-skill-tarball] Skill source not found: ${skillDir}`);
  process.exit(0);
}

if (!existsSync(skillsRoot)) mkdirSync(skillsRoot, { recursive: true });

execFileSync("tar", ["-czf", tarball, "-C", skillsRoot, "go2"], { stdio: "inherit" });

const sizeBytes = statSync(tarball).size;
const inventory = walk(skillDir).map((p) => p.replace(`${skillDir}/`, "go2/"));
const sha256 = createHash("sha256").update(readFileSync(tarball)).digest("hex");

writeFileSync(
  hashOut,
  `${JSON.stringify({ go2: { sha256, sizeBytes } }, null, 2)}\n`,
);

console.log(`[build-skill-tarball] Wrote ${tarball} (${sizeBytes} bytes)`);
console.log(`[build-skill-tarball] sha256 ${sha256}`);
for (const file of inventory) console.log(`  ${file}`);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}
