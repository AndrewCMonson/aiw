/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import { Command } from "commander";
import type { Dirent } from "node:fs";
import fs from "node:fs/promises";

import { resolveWorkspacePaths } from "../lib/paths.js";

/**
 *
 * @param opts
 * @param opts.workspace
 */
export async function listPrompts(opts: { workspace?: string }): Promise<string[]> {
    const { promptsDir } = resolveWorkspacePaths(opts.workspace);

    let entries: Dirent[];
    try {
        entries = await fs.readdir(promptsDir, { withFileTypes: true });
    } catch {
        return [];
    }

    const slugs: string[] = [];
    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        // Check if directory contains a matching .md file (e.g., pre_push_review/pre_push_review.md)
        const promptFile = `${entry.name}.md`;
        try {
            await fs.access(`${promptsDir}/${entry.name}/${promptFile}`);
            slugs.push(entry.name);
        } catch {
            // No matching prompt file in this directory
        }
    }

    return slugs.sort((a, b) => a.localeCompare(b));
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
