import path from "node:path";

export type WorkspacePaths = {
  workspaceDir: string;
  promptsDir: string;
};

export function resolveWorkspacePaths(workspaceFlag?: string): WorkspacePaths {
  const workspaceDir = path.resolve(process.cwd(), workspaceFlag ?? ".ai");
  const promptsDir = path.join(workspaceDir, "prompts");
  return { workspaceDir, promptsDir };
}

export function normalizePromptNameToSlug(name: string): string {
  const trimmed = name.trim();
  const base = trimmed.toLowerCase().endsWith(".md")
    ? trimmed.slice(0, -3)
    : trimmed;
  return base;
}

export function promptFilePath(workspaceFlag: string | undefined, slug: string): string {
  const { promptsDir } = resolveWorkspacePaths(workspaceFlag);
  return path.join(promptsDir, `${slug}.md`);
}

