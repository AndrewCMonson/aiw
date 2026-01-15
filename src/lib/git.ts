/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import { execSync } from "node:child_process";
import path from "node:path";

export type CommitInfo = {
    hash: string;
    subject: string;
    hasSkipToken: boolean;
};

export type CommitWithFiles = {
    hash: string;
    subject: string;
    files: string[];
};

/**
 * Check if we're in a git repository.
 *
 * @param repoRoot - Root directory of the repository (defaults to process.cwd())
 * @returns True if git repository exists
 */
export function isGitRepo(repoRoot?: string): boolean {
    const root = repoRoot ?? process.cwd();
    try {
        execSync("git rev-parse --git-dir", {
            cwd: root,
            stdio: "ignore",
        });
        return true;
    } catch {
        return false;
    }
}

/**
 * Execute a git command and return stdout as string.
 *
 * @param args - Git command arguments
 * @param repoRoot - Root directory of the repository (defaults to process.cwd())
 * @returns Command output as string
 */
function execGit(args: string[], repoRoot?: string): string {
    const root = repoRoot ?? process.cwd();
    try {
        const output = execSync(`git ${args.join(" ")}`, {
            cwd: root,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
        });
        return output.trim();
    } catch (error) {
        const err = error as { status?: number; stderr?: Buffer | string };
        if (err.status === 128) {
            // Git error (e.g., invalid ref, not a git repo)
            throw new Error(`Git command failed: ${args.join(" ")}`);
        }
        throw error;
    }
}

/**
 * Get commits in a range with hash, subject, and skip token detection.
 *
 * @param range - Git range (e.g., "origin/main...HEAD" or "abc123..def456")
 * @param skipToken - Token to detect in commit messages (default: "[context-skip]")
 * @param repoRoot - Root directory of the repository (defaults to process.cwd())
 * @returns Array of commit info
 */
export function getCommitsInRange(range: string, skipToken: string = "[context-skip]", repoRoot?: string): CommitInfo[] {
    if (!isGitRepo(repoRoot)) {
        return [];
    }

    try {
        // Get list of commit hashes in range
        const hashOutput = execGit(["log", "--format=%H", range], repoRoot);

        if (!hashOutput) {
            return [];
        }

        const fullHashes = hashOutput.split("\n").filter((h) => h.trim().length > 0);
        const commits: CommitInfo[] = [];

        for (const fullHash of fullHashes) {
            // Get subject (first line of commit message)
            const subject = execGit(["log", "-1", "--format=%s", fullHash], repoRoot).trim();

            // Get full commit message (subject + body)
            const fullMessage = execGit(["log", "-1", "--format=%B", fullHash], repoRoot);
            const hasSkipToken = fullMessage.includes(skipToken);

            commits.push({
                hash: fullHash.substring(0, 7), // Short hash (7 chars)
                subject,
                hasSkipToken,
            });
        }

        return commits;
    } catch {
        // If range is invalid or no commits, return empty array
        return [];
    }
}

/**
 * Get changed files per commit in a range.
 *
 * @param range - Git range (e.g., "origin/main...HEAD")
 * @param repoRoot - Root directory of the repository (defaults to process.cwd())
 * @returns Array of commits with their changed files
 */
export function getChangedFilesPerCommit(range: string, repoRoot?: string): CommitWithFiles[] {
    if (!isGitRepo(repoRoot)) {
        return [];
    }

    try {
        // Get list of full commit hashes in range
        const hashOutput = execGit(["log", "--format=%H|%s", range], repoRoot);

        if (!hashOutput) {
            return [];
        }

        const result: CommitWithFiles[] = [];
        const lines = hashOutput.split("\n");

        for (const line of lines) {
            const [fullHash, ...subjectParts] = line.split("|");
            if (!fullHash) continue;

            const subject = subjectParts.join("|").trim(); // In case subject contains |

            // Get changed files for this commit
            const filesOutput = execGit(["diff-tree", "--no-commit-id", "--name-only", "-r", fullHash], repoRoot);

            const files = filesOutput ? filesOutput.split("\n").filter((f) => f.trim().length > 0) : [];

            result.push({
                hash: fullHash.substring(0, 7), // Short hash (7 chars)
                subject,
                files,
            });
        }

        return result;
    } catch {
        return [];
    }
}

/**
 * Get all changed files in a range (flat list).
 *
 * @param range - Git range (e.g., "origin/main...HEAD")
 * @param repoRoot - Root directory of the repository (defaults to process.cwd())
 * @returns Array of changed file paths
 */
export function getChangedFiles(range: string, repoRoot?: string): string[] {
    if (!isGitRepo(repoRoot)) {
        return [];
    }

    try {
        const output = execGit(["diff", "--name-only", range], repoRoot);

        if (!output) {
            return [];
        }

        return output.split("\n").filter((f) => f.trim().length > 0);
    } catch {
        return [];
    }
}

/**
 * Check if a file was modified in a git range.
 *
 * @param range - Git range (e.g., "origin/main...HEAD")
 * @param filePath - Path to file to check (relative to repo root)
 * @param repoRoot - Root directory of the repository (defaults to process.cwd())
 * @returns True if file was modified
 */
export function hasFileInRange(range: string, filePath: string, repoRoot?: string): boolean {
    if (!isGitRepo(repoRoot)) {
        return false;
    }

    try {
        // Normalize path separators for git
        const normalizedPath = filePath.split(path.sep).join("/");
        const output = execGit(["diff", "--name-only", range, "--", normalizedPath], repoRoot);

        return output.trim().length > 0;
    } catch {
        return false;
    }
}

/**
 * Get the current git branch name.
 *
 * @param repoRoot - Root directory of the repository (defaults to process.cwd())
 * @returns Branch name or empty string if not in a git repo
 */
export function getCurrentBranch(repoRoot?: string): string {
    if (!isGitRepo(repoRoot)) {
        return "";
    }

    try {
        return execGit(["rev-parse", "--abbrev-ref", "HEAD"], repoRoot).trim();
    } catch {
        return "";
    }
}

/**
 * Get the current HEAD commit SHA (full hash).
 *
 * @param repoRoot - Root directory of the repository (defaults to process.cwd())
 * @returns Full commit SHA or null if not in a git repo or command fails
 */
export function getHeadSha(repoRoot?: string): string | null {
    if (!isGitRepo(repoRoot)) {
        return null;
    }

    try {
        return execGit(["rev-parse", "HEAD"], repoRoot).trim();
    } catch {
        return null;
    }
}
