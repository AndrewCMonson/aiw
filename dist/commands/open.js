import path from "node:path";
import { Command } from "commander";
import { normalizePromptNameToSlug, promptFilePath } from "../lib/paths.js";
import { openPath } from "../lib/opener.js";
export function openCommand() {
    const cmd = new Command("open")
        .description("Open a prompt file for editing (or print its path)")
        .argument("<prompt>", "Prompt name/slug")
        .option("--workspace <path>", "Workspace folder (default: .ai)");
    cmd.action(async (prompt, options) => {
        const slug = normalizePromptNameToSlug(prompt);
        const filePath = promptFilePath(options.workspace, slug);
        const res = openPath(filePath);
        if (res.opened)
            return;
        process.stdout.write(`${path.resolve(filePath)}\n`);
    });
    return cmd;
}
