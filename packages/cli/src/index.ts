#!/usr/bin/env node
/**
 * ShipQuest CLI
 *
 * Interactive setup wizard for ShipQuest projects.
 *
 * Usage:
 *   npx shipquest init
 *   pnpm dlx shipquest init
 */

import { Command } from "commander";
import { init } from "./commands/init.js";

const program = new Command();

program
  .name("shipquest")
  .description("ShipQuest CLI - Ship your SaaS in days, not months")
  .version("1.0.0");

program
  .command("init")
  .description("Initialize and configure your ShipQuest project")
  .option("-y, --yes", "Skip prompts and use defaults")
  .option("--name <name>", "Project name")
  .option("--deployment <target>", "Deployment target (cloudflare, vercel, docker)")
  .action(init);

program.command("setup").description("Alias for init").action(init);

program.parse();
