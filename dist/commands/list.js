import fs from "node:fs/promises";
import { Command } from "commander";
import { resolveWorkspacePaths } from "../lib/paths.js";
export async function listPrompts(opts) {
    const { promptsDir } = resolveWorkspacePaths(opts.workspace);
    let entries;
    try {
        entries = await fs.readdir(promptsDir);
    }
    catch {
        return [];
    }
    return entries
        .filter((f) => f.toLowerCase().endsWith(".md"))
        .map((f) => f.replace(/\.md$/i, ""))
        .sort((a, b) => a.localeCompare(b));
}
export function listCommand() {
    const cmd = new Command("list")
        .description("List available prompts (based on files in .ai/prompts/)")
        .option("--workspace <path>", "Workspace folder (default: .ai)");
    cmd.action(async (options) => {
        const slugs = await listPrompts({ workspace: options.workspace });
        for (const slug of slugs)
            process.stdout.write(`${slug}\n`);
    });
    return cmd;
}
