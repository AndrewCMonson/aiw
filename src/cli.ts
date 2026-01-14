#!/usr/bin/env node
/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import { Command } from "commander";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { contextVerifyCommand } from "./commands/contextVerify.js";
import { copyCommand } from "./commands/copy.js";
import { listCommand } from "./commands/list.js";
import { newCommand } from "./commands/new.js";
import { openCommand } from "./commands/open.js";
import { setupCommand } from "./commands/setup.js";
import { showCommand } from "./commands/show.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version: string };

const program = new Command();

program
    .name("aiw")
    .description("Repo-local prompt library CLI for Cursor workflows")
    .version(packageJson.version)
    .showHelpAfterError()
    .showSuggestionAfterError();

program.addCommand(setupCommand());
program.addCommand(listCommand());
program.addCommand(showCommand());
program.addCommand(copyCommand());
program.addCommand(openCommand());
program.addCommand(newCommand());
program.addCommand(contextVerifyCommand());

program.parseAsync(process.argv).catch((err) => {
    // Commander will already have printed user-facing help/errors for most cases.
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
});
