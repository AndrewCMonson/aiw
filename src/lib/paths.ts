/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import path from "node:path";

export type WorkspacePaths = {
    workspaceDir: string;
    promptsDir: string;
};

/**
 *
 * @param workspaceFlag
 */
export function resolveWorkspacePaths(workspaceFlag?: string): WorkspacePaths {
    const workspaceDir = path.resolve(process.cwd(), workspaceFlag ?? ".ai");
    const promptsDir = path.join(workspaceDir, "prompts");
    return { workspaceDir, promptsDir };
}

/**
 *
 * @param name
 */
export function normalizePromptNameToSlug(name: string): string {
    const trimmed = name.trim();
    const base = trimmed.toLowerCase().endsWith(".md") ? trimmed.slice(0, -3) : trimmed;
    return base;
}

/**
 *
 * @param workspaceFlag
 * @param slug
 */
export function promptFilePath(workspaceFlag: string | undefined, slug: string): string {
    const { promptsDir } = resolveWorkspacePaths(workspaceFlag);
    return path.join(promptsDir, `${slug}.md`);
}
