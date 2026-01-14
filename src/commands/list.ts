/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import { Command } from "commander";
import fs from "node:fs/promises";

import { resolveWorkspacePaths } from "../lib/paths.js";

/**
 *
 * @param opts
 * @param opts.workspace
 */
export async function listPrompts(opts: { workspace?: string }): Promise<string[]> {
    const { promptsDir } = resolveWorkspacePaths(opts.workspace);

    let entries: string[];
    try {
        entries = await fs.readdir(promptsDir);
    } catch {
        return [];
    }

    return entries
        .filter((f) => f.toLowerCase().endsWith(".md"))
        .map((f) => f.replace(/\.md$/i, ""))
        .sort((a, b) => a.localeCompare(b));
}

/**
 *
 */
export function listCommand(): Command {
    const cmd = new Command("list")
        .description("List available prompts (based on files in .ai/prompts/)")
        .option("--workspace <path>", "Workspace folder (default: .ai)");

    cmd.action(async (options: { workspace?: string }) => {
        const slugs = await listPrompts({ workspace: options.workspace });
        for (const slug of slugs) process.stdout.write(`${slug}\n`);
    });

    return cmd;
}
