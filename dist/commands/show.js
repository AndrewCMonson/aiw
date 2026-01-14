import { Command } from "commander";
import { readTextFile } from "../lib/fs.js";
import { normalizePromptNameToSlug, promptFilePath } from "../lib/paths.js";
export async function getPromptContents(opts) {
    const slug = normalizePromptNameToSlug(opts.promptName);
    const filePath = promptFilePath(opts.workspace, slug);
    const contents = await readTextFile(filePath);
    return { slug, contents };
}
export function showCommand() {
    const cmd = new Command("show")
        .description("Print a prompt to stdout")
        .argument("<prompt>", "Prompt name/slug (file in prompts/ without .md)")
        .option("--workspace <path>", "Workspace folder (default: .ai)");
    cmd.action(async (prompt, options) => {
        const { contents } = await getPromptContents({
            workspace: options.workspace,
            promptName: prompt
        });
        process.stdout.write(contents);
        if (!contents.endsWith("\n"))
            process.stdout.write("\n");
    });
    return cmd;
}
