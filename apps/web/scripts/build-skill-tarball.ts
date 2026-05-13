import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, "..");
const skillsRoot = join(webRoot, "public", "skills");
const skillDir = join(skillsRoot, "go2");
const tarball = join(skillsRoot, "go2.tar.gz");

if (!existsSync(skillDir)) {
  console.error(`Skill source not found: ${skillDir}`);
  process.exit(1);
}

if (!existsSync(skillsRoot)) {
  mkdirSync(skillsRoot, { recursive: true });
}

execFileSync("tar", ["-czf", tarball, "-C", skillsRoot, "go2"], { stdio: "inherit" });

const sizeBytes = statSync(tarball).size;
const inventory = walk(skillDir).map((p) => p.replace(`${skillDir}/`, "go2/"));
console.log(`Wrote ${tarball} (${sizeBytes} bytes)`);
console.log(`Contents:`);
for (const file of inventory) console.log(`  ${file}`);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}
