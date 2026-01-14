#!/usr/bin/env node

import { Command } from "commander";
import { setupCommand } from "./commands/setup.js";
import { listCommand } from "./commands/list.js";
import { showCommand } from "./commands/show.js";
import { copyCommand } from "./commands/copy.js";
import { openCommand } from "./commands/open.js";
import { newCommand } from "./commands/new.js";

const program = new Command();

program
  .name("aiw")
  .description("Repo-local prompt library CLI for Cursor workflows")
  .version("0.1.0")
  .showHelpAfterError()
  .showSuggestionAfterError();

program.addCommand(setupCommand());
program.addCommand(listCommand());
program.addCommand(showCommand());
program.addCommand(copyCommand());
program.addCommand(openCommand());
program.addCommand(newCommand());

program.parseAsync(process.argv).catch((err) => {
  // Commander will already have printed user-facing help/errors for most cases.
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});

