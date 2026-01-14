/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import { Command } from "commander";
import path from "node:path";

import { openPath } from "../lib/opener.js";
import { normalizePromptNameToSlug, promptFilePath } from "../lib/paths.js";

/**
 *
 */
export function openCommand(): Command {
    const cmd = new Command("open")
        .description("Open a prompt file for editing (or print its path)")
        .argument("<prompt>", "Prompt name/slug")
        .option("--workspace <path>", "Workspace folder (default: .ai)");

    cmd.action((prompt: string, options: { workspace?: string }) => {
        const slug = normalizePromptNameToSlug(prompt);
        const filePath = promptFilePath(options.workspace, slug);

        const res = openPath(filePath);
        if (res.opened) return;

        process.stdout.write(`${path.resolve(filePath)}\n`);
    });

    return cmd;
}
