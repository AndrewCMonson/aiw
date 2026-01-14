import path from "node:path";
export function resolveWorkspacePaths(workspaceFlag) {
    const workspaceDir = path.resolve(process.cwd(), workspaceFlag ?? ".ai");
    const promptsDir = path.join(workspaceDir, "prompts");
    return { workspaceDir, promptsDir };
}
export function normalizePromptNameToSlug(name) {
    const trimmed = name.trim();
    const base = trimmed.toLowerCase().endsWith(".md")
        ? trimmed.slice(0, -3)
        : trimmed;
    return base;
}
export function promptFilePath(workspaceFlag, slug) {
    const { promptsDir } = resolveWorkspacePaths(workspaceFlag);
    return path.join(promptsDir, `${slug}.md`);
}
