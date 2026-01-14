/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import { Command } from "commander";

import { getPromptContents } from "./show.js";
import { copyToClipboard } from "../lib/clipboard.js";

/**
 *
 */
export function copyCommand(): Command {
    const cmd = new Command("copy")
        .description("Copy a prompt to your clipboard (falls back to printing)")
        .argument("<prompt>", "Prompt name/slug")
        .option("--workspace <path>", "Workspace folder (default: .ai)");

    cmd.action(async (prompt: string, options: { workspace?: string }) => {
        const { slug, contents } = await getPromptContents({
            workspace: options.workspace,
            promptName: prompt,
        });

        const result = copyToClipboard(contents);
        if (result.copied) {
            process.stdout.write(`Copied "${slug}" to clipboard via ${result.method}.\n`);
            return;
        }

        process.stdout.write(`Clipboard unavailable (${result.reason}). Printing prompt to stdout instead:\n\n`);
        process.stdout.write(contents);
        if (!contents.endsWith("\n")) process.stdout.write("\n");
    });

    return cmd;
}
