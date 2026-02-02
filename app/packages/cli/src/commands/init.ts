import * as p from "@clack/prompts";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";

interface InitOptions {
  yes?: boolean;
  name?: string;
  deployment?: string;
}

interface Config {
  projectName: string;
  deployment: "cloudflare" | "vercel" | "docker";
  database: "d1" | "supabase" | "planetscale";
  auth: "supabase" | "authjs";
  features: string[];
}

export async function init(options: InitOptions) {
  console.log();
  p.intro(chalk.bgBlue.white(" ShipQuest Setup "));

  const cwd = process.cwd();

  // Check if we're in a ShipQuest project
  const packageJsonPath = path.join(cwd, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    p.log.error("No package.json found. Please run this in the ShipQuest directory.");
    process.exit(1);
  }

  let config: Config;

  if (options.yes) {
    // Use defaults
    config = {
      projectName: options.name || "my-saas",
      deployment: (options.deployment as Config["deployment"]) || "cloudflare",
      database: "supabase",
      auth: "supabase",
      features: [],
    };
  } else {
    // Interactive prompts
    const answers = await p.group(
      {
        projectName: () =>
          p.text({
            message: "What's your project name?",
            placeholder: "my-saas",
            defaultValue: "my-saas",
            validate: (value) => {
              if (!value) return "Project name is required";
              if (!/^[a-z0-9-]+$/.test(value)) {
                return "Use lowercase letters, numbers, and hyphens only";
              }
            },
          }),

        deployment: () =>
          p.select<{ value: string; label: string; hint?: string }[], string>({
            message: "Where will you deploy?",
            options: [
              {
                value: "cloudflare",
                label: "Cloudflare Workers",
                hint: "Recommended - Edge deployment with D1",
              },
              {
                value: "vercel",
                label: "Vercel",
                hint: "Serverless with Postgres",
              },
              {
                value: "docker",
                label: "Docker",
                hint: "Railway, Fly.io, or self-hosted",
              },
            ],
          }),

        database: () =>
          p.select<{ value: string; label: string; hint?: string }[], string>({
            message: "Which database?",
            options: [
              {
                value: "supabase",
                label: "Supabase PostgreSQL",
                hint: "Recommended - Full Postgres with auth",
              },
              {
                value: "d1",
                label: "Cloudflare D1",
                hint: "SQLite at the edge",
              },
              {
                value: "planetscale",
                label: "PlanetScale",
                hint: "Serverless MySQL",
              },
            ],
          }),

        auth: () =>
          p.select<{ value: string; label: string; hint?: string }[], string>({
            message: "Authentication provider?",
            options: [
              {
                value: "supabase",
                label: "Supabase Auth",
                hint: "Recommended - Built-in auth",
              },
              {
                value: "authjs",
                label: "Auth.js (NextAuth)",
                hint: "Flexible auth for any DB",
              },
            ],
          }),

        features: () =>
          p.multiselect({
            message: "Enable premium features? (requires license)",
            options: [
              { value: "ai", label: "AI Suite", hint: "Multi-provider AI, RAG, agents" },
              { value: "multiTenancy", label: "Multi-Tenancy", hint: "Organizations & teams" },
              { value: "superAdmin", label: "Super Admin", hint: "Platform admin dashboard" },
              { value: "extension", label: "Chrome Extension", hint: "Extension boilerplate" },
              { value: "affiliates", label: "Affiliate System", hint: "Referral tracking" },
            ],
            required: false,
          }),
      },
      {
        onCancel: () => {
          p.cancel("Setup cancelled");
          process.exit(0);
        },
      }
    );

    config = answers as Config;
  }

  const s = p.spinner();
  s.start("Configuring your project...");

  try {
    // 1. Update site config
    await updateSiteConfig(cwd, config.projectName);

    // 2. Create/update .env.local
    await createEnvFile(cwd, config);

    // 3. Update deployment configs
    await updateDeploymentConfig(cwd, config);

    s.stop("Project configured!");

    // Summary
    console.log();
    p.log.success(chalk.green("✓ Project configured successfully!"));
    console.log();

    p.note(
      [
        `${chalk.bold("Next steps:")}`,
        "",
        `1. ${chalk.cyan("Set up your services:")}`,
        `   - Supabase: ${chalk.dim("https://supabase.com")}`,
        `   - Stripe: ${chalk.dim("https://stripe.com")}`,
        config.deployment === "cloudflare"
          ? `   - Cloudflare: ${chalk.dim("https://dash.cloudflare.com")}`
          : "",
        "",
        `2. ${chalk.cyan("Add your credentials to .env.local")}`,
        "",
        `3. ${chalk.cyan("Start development:")}`,
        `   ${chalk.bold("pnpm dev")}`,
        "",
        `4. ${chalk.cyan("Open in browser:")}`,
        `   ${chalk.dim("http://localhost:3000")}`,
      ]
        .filter(Boolean)
        .join("\n"),
      "Getting Started"
    );

    if (config.features.length > 0) {
      console.log();
      p.log.warning(
        `Premium features enabled: ${config.features.join(", ")}\n` +
          `Don't forget to set SHIPQUEST_LICENSE in .env.local`
      );
    }

    console.log();
    p.outro(chalk.bgGreen.black(" Happy shipping! 🚀 "));
  } catch (error) {
    s.stop("Configuration failed");
    p.log.error(`Error: ${error}`);
    process.exit(1);
  }
}

async function updateSiteConfig(cwd: string, projectName: string) {
  const siteConfigPath = path.join(cwd, "packages/config/src/site.ts");

  if (!fs.existsSync(siteConfigPath)) {
    return; // Skip if file doesn't exist
  }

  let content = await fs.readFile(siteConfigPath, "utf-8");

  // Update the site name
  content = content.replace(/name:\s*["'].*["']/, `name: "${projectName}"`);

  // Update tagline placeholder
  content = content.replace(/tagline:\s*["'].*["']/, `tagline: "Your awesome SaaS product"`);

  await fs.writeFile(siteConfigPath, content);
}

async function createEnvFile(cwd: string, config: Config) {
  const envPath = path.join(cwd, ".env.local");
  const envExamplePath = path.join(cwd, "env.example");

  // If .env.local doesn't exist, copy from example
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    let content = await fs.readFile(envExamplePath, "utf-8");

    // Update project name
    content = content.replace(
      /NEXT_PUBLIC_SITE_NAME=.*/,
      `NEXT_PUBLIC_SITE_NAME=${config.projectName}`
    );

    // Update deployment settings
    content = content.replace(/DB_PROVIDER=.*/, `DB_PROVIDER=${config.database}`);

    content = content.replace(/AUTH_PROVIDER=.*/, `AUTH_PROVIDER=${config.auth}`);

    // Set license if premium features enabled
    if (config.features.length > 0) {
      content = content.replace(
        /SHIPQUEST_LICENSE=.*/,
        "SHIPQUEST_LICENSE=personal # Update with your license type"
      );
    }

    await fs.writeFile(envPath, content);
  }
}

async function updateDeploymentConfig(cwd: string, config: Config) {
  // For Vercel, ensure vercel.json exists
  if (config.deployment === "vercel") {
    const vercelJsonPath = path.join(cwd, "vercel.json");
    if (!fs.existsSync(vercelJsonPath)) {
      await fs.writeJson(vercelJsonPath, {
        $schema: "https://openapi.vercel.sh/vercel.json",
        buildCommand: "pnpm turbo build --filter=@repo/web",
        installCommand: "pnpm install",
        framework: "nextjs",
        outputDirectory: "apps/web/.next",
      });
    }
  }

  // For Cloudflare, update wrangler.toml with project name
  if (config.deployment === "cloudflare") {
    const wranglerPath = path.join(cwd, "apps/api/wrangler.toml");
    if (fs.existsSync(wranglerPath)) {
      let content = await fs.readFile(wranglerPath, "utf-8");
      content = content.replace(/name\s*=\s*["'].*["']/, `name = "${config.projectName}-api"`);
      await fs.writeFile(wranglerPath, content);
    }

    const webWranglerPath = path.join(cwd, "apps/web/wrangler.toml");
    if (fs.existsSync(webWranglerPath)) {
      let content = await fs.readFile(webWranglerPath, "utf-8");
      content = content.replace(/name\s*=\s*["'].*["']/, `name = "${config.projectName}-web"`);
      await fs.writeFile(webWranglerPath, content);
    }
  }
}
