/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { mkdirp } from "./fs.js";
import { isGitRepo } from "./git.js";

const AIW_HOOK_MARKER = "# aiw context:verify hook";
const AIW_HOOK_END_MARKER = "# end aiw context:verify hook";

/**
 * Get the path to the git hooks directory.
 *
 * @param repoRoot - Root directory of the repository (defaults to process.cwd())
 * @returns Path to .git/hooks directory
 */
function getHooksDir(repoRoot?: string): string {
    const root = repoRoot ?? process.cwd();
    try {
        const gitDir = execSync("git rev-parse --git-dir", {
            cwd: root,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
        }).trim();
        return path.resolve(root, gitDir, "hooks");
    } catch {
        throw new Error("Not a git repository");
    }
}

/**
 * Generate the pre-push hook script content.
 * This is a git-native bash script that enforces docs/PROJECT_CONTEXT.md updates.
 *
 * @returns Hook script content
 */
function generateHookScript(): string {
    return `#!/usr/bin/env bash
${AIW_HOOK_MARKER}
# Git-native context enforcement hook
# Installed by: aiw setup --with-hooks
# This hook enforces that docs/PROJECT_CONTEXT.md is updated when meaningful changes are made

set -euo pipefail

TEAM_DOC="docs/PROJECT_CONTEXT.md"

# pre-push receives: <local_ref> <local_sha> <remote_ref> <remote_sha>
while read -r local_ref local_sha remote_ref remote_sha; do
  # allow delete pushes
  if [[ "$local_sha" == "0000000000000000000000000000000000000000" ]]; then
    exit 0
  fi

  # new branch push -> compare against merge-base with main if possible
  if [[ "$remote_sha" == "0000000000000000000000000000000000000000" ]]; then
    base="$(git merge-base "$local_sha" origin/main 2>/dev/null || git merge-base "$local_sha" main 2>/dev/null || true)"
    range="\${base:-$local_sha^}..$local_sha"
  else
    range="$remote_sha..$local_sha"
  fi

  # Skip if any commit message in range contains [context-skip]
  if git log --format=%B "$range" | grep -q "\\[context-skip\\]"; then
    echo "[context] skip token found; allowing push without $TEAM_DOC"
    continue
  fi

  files="$(git diff --name-only "$range")"

  # If no files, allow
  if [[ -z "\${files// }" ]]; then
    continue
  fi

  # Meaningful = anything outside docs/ and markdown and .ai/.cursor
  meaningful="$(echo "$files" | grep -vE '^(docs/|.*\\.md$|\\.ai/|\\.cursor/)' || true)"
  teamdoc_changed="$(echo "$files" | grep -F "$TEAM_DOC" || true)"

  if [[ -n "\${meaningful// }" && -z "\${teamdoc_changed// }" ]]; then
    echo "❌ Push blocked: meaningful changes detected but $TEAM_DOC was not updated."
    echo ""
    echo "Fix:"
    echo "  1) Update $TEAM_DOC to reflect your changes"
    echo "  2) Commit the doc update"
    echo ""
    echo "If truly unnecessary, add [context-skip] to a commit message."
    exit 1
  fi
done
${AIW_HOOK_END_MARKER}
`;
}

/**
 * Check if the hook script already contains the aiw hook.
 *
 * @param content - Current hook file content
 * @returns True if aiw hook is already present
 */
function hasAiwHook(content: string): boolean {
    return content.includes(AIW_HOOK_MARKER) && content.includes(AIW_HOOK_END_MARKER);
}

/**
 * Install the pre-push hook.
 *
 * @param repoRoot - Root directory of the repository (defaults to process.cwd())
 * @returns Result of installation
 */
export async function installPrePushHook(repoRoot?: string): Promise<{ installed: boolean; path: string; message?: string }> {
    if (!isGitRepo(repoRoot)) {
        return {
            installed: false,
            path: "",
            message: "Not a git repository",
        };
    }

    try {
        const hooksDir = getHooksDir(repoRoot);
        await mkdirp(hooksDir);
        const hookPath = path.join(hooksDir, "pre-push");

        let existingContent = "";
        let hasExisting = false;

        try {
            existingContent = await fs.readFile(hookPath, "utf8");
            hasExisting = true;
        } catch {
            // File doesn't exist, that's fine
        }

        // Check if our hook is already installed
        if (hasAiwHook(existingContent)) {
            return {
                installed: true,
                path: hookPath,
                message: "Hook already installed",
            };
        }

        // Prepare new content
        const newHookScript = generateHookScript();
        let finalContent = "";

        if (hasExisting) {
            // Append our hook to existing content
            finalContent = existingContent.trimEnd() + "\n\n" + newHookScript;
        } else {
            // Create new hook file
            finalContent = newHookScript;
        }

        // Write the hook
        await fs.writeFile(hookPath, finalContent, "utf8");

        // Make it executable
        await fs.chmod(hookPath, 0o755);

        return {
            installed: true,
            path: hookPath,
            message: hasExisting ? "Hook appended to existing pre-push hook" : "Hook installed",
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            installed: false,
            path: "",
            message: `Failed to install hook: ${message}`,
        };
    }
}

/**
 * Uninstall the pre-push hook (remove only the aiw portion).
 *
 * @param repoRoot - Root directory of the repository (defaults to process.cwd())
 * @returns Result of uninstallation
 */
export async function uninstallPrePushHook(repoRoot?: string): Promise<{ uninstalled: boolean; path: string; message?: string }> {
    if (!isGitRepo(repoRoot)) {
        return {
            uninstalled: false,
            path: "",
            message: "Not a git repository",
        };
    }

    try {
        const hooksDir = getHooksDir(repoRoot);
        const hookPath = path.join(hooksDir, "pre-push");

        let existingContent = "";
        try {
            existingContent = await fs.readFile(hookPath, "utf8");
        } catch {
            // File doesn't exist, nothing to uninstall
            return {
                uninstalled: true,
                path: hookPath,
                message: "Hook file does not exist",
            };
        }

        // Check if our hook is present
        if (!hasAiwHook(existingContent)) {
            return {
                uninstalled: true,
                path: hookPath,
                message: "aiw hook not found in pre-push file",
            };
        }

        // Remove our hook section
        const lines = existingContent.split("\n");
        const newLines: string[] = [];
        let inAiwHook = false;

        for (const line of lines) {
            if (line.includes(AIW_HOOK_MARKER)) {
                inAiwHook = true;
                continue;
            }
            if (inAiwHook && line.includes(AIW_HOOK_END_MARKER)) {
                inAiwHook = false;
                continue;
            }
            if (!inAiwHook) {
                newLines.push(line);
            }
        }

        const newContent = newLines.join("\n").trimEnd() + "\n";

        // If there's no content left (or only whitespace), remove the file
        if (newContent.trim().length === 0) {
            await fs.unlink(hookPath);
            return {
                uninstalled: true,
                path: hookPath,
                message: "Hook removed (file deleted as it was empty)",
            };
        }

        // Otherwise, write back the cleaned content
        await fs.writeFile(hookPath, newContent, "utf8");
        return {
            uninstalled: true,
            path: hookPath,
            message: "aiw hook removed from pre-push file",
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            uninstalled: false,
            path: "",
            message: `Failed to uninstall hook: ${message}`,
        };
    }
}
