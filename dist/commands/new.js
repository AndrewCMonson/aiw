import path from "node:path";
import { Command } from "commander";
import { mkdirp, safeWriteFile } from "../lib/fs.js";
import { openPath } from "../lib/opener.js";
import { resolveWorkspacePaths } from "../lib/paths.js";
import { slugify, titleCaseFromSlug } from "../lib/slug.js";
import { scaffoldPromptMarkdown } from "../templates/scaffolds.js";
export async function createNewPrompt(opts) {
    const slug = slugify(opts.name);
    if (!slug)
        throw new Error("Invalid prompt name (slug resolved to empty).");
    const { workspaceDir, promptsDir } = resolveWorkspacePaths(opts.options.workspace);
    await mkdirp(promptsDir);
    const filePath = path.join(promptsDir, `${slug}.md`);
    const title = opts.options.title?.trim() || titleCaseFromSlug(slug);
    const md = scaffoldPromptMarkdown({
        slug,
        title,
        from: opts.options.from,
        workspaceDirRelative: path.basename(workspaceDir) === workspaceDir ? workspaceDir : path.relative(process.cwd(), workspaceDir)
    });
    await safeWriteFile(filePath, md, { force: Boolean(opts.options.force) });
    return { slug, filePath };
}
export function newCommand() {
    const cmd = new Command("new")
        .description("Create a new prompt file in .ai/prompts/")
        .argument("<name>", "Prompt name (will be slugified)")
        .option("--workspace <path>", "Workspace folder (default: .ai)")
        .option("--title <title>", "Human title for the prompt")
        .option("--from <template>", "Template: blank|repo|review|feature|debug", "blank")
        .option("--open", "Open the file after creating", false)
        .option("--force", "Overwrite existing file (creates backup)", false);
    cmd.action(async (name, options) => {
        const from = String(options.from ?? "blank");
        const allowed = ["blank", "repo", "review", "feature", "debug"];
        if (!allowed.includes(from)) {
            throw new Error(`Invalid --from value: ${from}. Expected one of: ${allowed.join(", ")}`);
        }
        const { slug, filePath } = await createNewPrompt({
            name,
            options: {
                workspace: options.workspace,
                title: options.title,
                from,
                open: Boolean(options.open),
                force: Boolean(options.force)
            }
        });
        process.stdout.write(`${filePath}\n`);
        if (options.open) {
            const res = openPath(filePath);
            if (!res.opened)
                process.stdout.write(`Could not open automatically (${res.reason}).\n`);
        }
    });
    return cmd;
}
