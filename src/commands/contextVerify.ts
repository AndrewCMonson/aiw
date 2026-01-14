/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import { Command } from "commander";
import path from "node:path";

import { loadConfig, type ImpactPatterns } from "../lib/config.js";
import { getCommitsInRange, getChangedFiles, getChangedFilesPerCommit, hasFileInRange, isGitRepo, type CommitInfo } from "../lib/git.js";

/**
 * Simple glob pattern matcher.
 * Handles basic patterns: *, **, ?, character classes.
 *
 * @param pattern - Glob pattern
 * @param filePath - File path to match
 * @returns True if pattern matches
 */
function matchesPattern(pattern: string, filePath: string): boolean {
    // Normalize paths
    const normalizedPath = filePath.split(path.sep).join("/");
    const normalizedPattern = pattern.split(path.sep).join("/");

    // Convert glob pattern to regex
    let regexStr = normalizedPattern
        .replace(/\./g, "\\.")
        .replace(/\*\*/g, "___DOUBLE_STAR___")
        .replace(/\*/g, "[^/]*")
        .replace(/___DOUBLE_STAR___/g, ".*")
        .replace(/\?/g, "[^/]");

    // Handle character classes like {js,ts,mjs}
    regexStr = regexStr.replace(/\{([^}]+)\}/g, (_: string, chars: string) => {
        const options = chars.split(",").map((c: string) => c.trim());
        return `(${options.map((c: string) => c.replace(/\./g, "\\.")).join("|")})`;
    });

    const regex = new RegExp(`^${regexStr}$`);
    return regex.test(normalizedPath);
}

/**
 * Check if a file matches any pattern in a category.
 *
 * @param filePath - File path to check
 * @param patterns - Array of glob patterns
 * @returns True if file matches any pattern
 */
function matchesAnyPattern(filePath: string, patterns: string[]): boolean {
    return patterns.some((pattern) => matchesPattern(pattern, filePath));
}

/**
 * Find which impact category a file belongs to.
 *
 * @param filePath - File path to check
 * @param impactPatterns - Impact patterns by category
 * @returns Category name if matched, null otherwise
 */
function findImpactCategory(filePath: string, impactPatterns: ImpactPatterns): string | null {
    if (matchesAnyPattern(filePath, impactPatterns.build)) return "build";
    if (matchesAnyPattern(filePath, impactPatterns.env)) return "env";
    if (matchesAnyPattern(filePath, impactPatterns.api)) return "api";
    if (matchesAnyPattern(filePath, impactPatterns.architecture)) return "architecture";
    return null;
}

/**
 * Find impactful files in a list of changed files.
 *
 * @param changedFiles - Array of changed file paths
 * @param impactPatterns - Impact patterns by category
 * @returns Map of category to array of matching files
 */
function findImpactfulFiles(changedFiles: string[], impactPatterns: ImpactPatterns): Map<string, string[]> {
    const impactful = new Map<string, string[]>();

    for (const file of changedFiles) {
        const category = findImpactCategory(file, impactPatterns);
        if (category) {
            const existing = impactful.get(category) || [];
            existing.push(file);
            impactful.set(category, existing);
        }
    }

    return impactful;
}

/**
 * Format verification result as human-readable message.
 *
 * @param result - Verification result
 * @returns Formatted message
 */
function formatResult(result: VerificationResult): string {
    if (result.status === "success_no_changes") {
        return "✓ Context check passed (no impactful changes detected)\n";
    }

    if (result.status === "success_skip_token") {
        const commit = result.skipCommit;
        return `✓ Context check passed (skip token found)\n\nSkip token ${result.skipToken} found in commit:\n  • ${commit.hash} ${commit.subject}\n`;
    }

    if (result.status === "success_context_updated") {
        const commit = result.contextCommit;
        return `✓ Context check passed\n\n${result.projectContextPath} was updated in commit:\n  • ${commit.hash} ${commit.subject}\n`;
    }

    // Failure case
    const lines: string[] = [];
    lines.push("❌ PROJECT_CONTEXT.md not updated\n");

    if (result.impactfulCommits && result.impactfulCommits.length > 0) {
        lines.push("Impactful changes detected in commits:");
        for (const commit of result.impactfulCommits) {
            lines.push(`  • ${commit.hash} ${commit.subject}`);
        }
        lines.push("");
    }

    if (result.impactfulFiles && result.impactfulFiles.size > 0) {
        lines.push("Changed files matching impact patterns:");
        for (const [category, files] of result.impactfulFiles.entries()) {
            for (const file of files) {
                lines.push(`  • ${file} (${category})`);
            }
        }
        lines.push("");
    }

    lines.push("To proceed, either:");
    lines.push(` 1. Update ${result.projectContextPath} in this branch`);
    lines.push(` 2. Add ${result.skipToken} to a commit message if no context update is needed`);

    return lines.join("\n") + "\n";
}

/**
 * Verification result.
 */
export type VerificationResult =
    | { status: "success_no_changes" }
    | { status: "success_skip_token"; skipCommit: CommitInfo; skipToken: string }
    | { status: "success_context_updated"; contextCommit: CommitInfo; projectContextPath: string }
    | {
          status: "failure";
          impactfulCommits: CommitInfo[];
          impactfulFiles: Map<string, string[]>;
          projectContextPath: string;
          skipToken: string;
      };

/**
 * Verify context updates for a git range.
 *
 * @param range - Git range to check (e.g., "origin/main...HEAD")
 * @param repoRoot - Root directory of the repository (defaults to process.cwd())
 * @returns Verification result
 */
export async function verifyContext(range: string, repoRoot?: string): Promise<VerificationResult> {
    const root = repoRoot ?? process.cwd();

    // Check if we're in a git repo
    if (!isGitRepo(root)) {
        // Not a git repo - return success (can't verify)
        return { status: "success_no_changes" };
    }

    // Load config
    const config = await loadConfig(root);

    // Get commits in range
    const commits = getCommitsInRange(range, config.skipToken, root);
    if (commits.length === 0) {
        // No commits - nothing to verify
        return { status: "success_no_changes" };
    }

    // Check for skip token
    const skipCommit = commits.find((c) => c.hasSkipToken);
    if (skipCommit) {
        return {
            status: "success_skip_token",
            skipCommit,
            skipToken: config.skipToken,
        };
    }

    // Get changed files
    const changedFiles = getChangedFiles(range, root);
    if (changedFiles.length === 0) {
        return { status: "success_no_changes" };
    }

    // Check if PROJECT_CONTEXT.md was updated
    const contextUpdated = hasFileInRange(range, config.projectContextPath, root);
    if (contextUpdated) {
        // Find the commit that actually updated it
        const commitsWithFiles = getChangedFilesPerCommit(range, root);
        const contextCommitInfo = commitsWithFiles.find((c) =>
            c.files.some((f) => f === config.projectContextPath || f.endsWith(config.projectContextPath)),
        );

        if (contextCommitInfo) {
            // Find the matching commit info for the message
            const contextCommit = commits.find((c) => c.hash === contextCommitInfo.hash);
            if (contextCommit) {
                return {
                    status: "success_context_updated",
                    contextCommit,
                    projectContextPath: config.projectContextPath,
                };
            }
        }
    }

    // Find impactful files
    const impactfulFiles = findImpactfulFiles(changedFiles, config.impactPatterns);
    if (impactfulFiles.size === 0) {
        // No impactful changes
        return { status: "success_no_changes" };
    }

    // Find commits that have impactful changes
    // For simplicity, we'll include all commits if any impactful files exist
    const impactfulCommits = commits;

    return {
        status: "failure",
        impactfulCommits,
        impactfulFiles,
        projectContextPath: config.projectContextPath,
        skipToken: config.skipToken,
    };
}

/**
 * Create the context:verify command.
 *
 * @returns Command instance
 */
export function contextVerifyCommand(): Command {
    const cmd = new Command("context:verify")
        .description("Verify that PROJECT_CONTEXT.md is updated when impactful changes are made")
        .option("--range <ref>", "Git range to check (default: origin/main...HEAD)", "origin/main...HEAD")
        .option("--json", "Output results as JSON", false)
        .option("--strict", "Fail even if no impactful changes (require explicit skip)", false);

    cmd.action(async (options: { range?: string; json?: boolean; strict?: boolean }) => {
        const range = options.range ?? "origin/main...HEAD";
        const outputJson = Boolean(options.json);
        const strict = Boolean(options.strict);

        try {
            const result = await verifyContext(range);

            if (outputJson) {
                // JSON output
                const json: Record<string, unknown> = {
                    status: result.status,
                };

                if (result.status === "failure") {
                    json.impactfulCommits = result.impactfulCommits.map((c) => ({
                        hash: c.hash,
                        subject: c.subject,
                    }));
                    json.impactfulFiles = Array.from(result.impactfulFiles.entries()).map(([category, files]) => ({
                        category,
                        files,
                    }));
                    json.projectContextPath = result.projectContextPath;
                    json.skipToken = result.skipToken;
                } else if (result.status === "success_skip_token") {
                    json.skipCommit = {
                        hash: result.skipCommit.hash,
                        subject: result.skipCommit.subject,
                    };
                    json.skipToken = result.skipToken;
                } else if (result.status === "success_context_updated") {
                    json.contextCommit = {
                        hash: result.contextCommit.hash,
                        subject: result.contextCommit.subject,
                    };
                    json.projectContextPath = result.projectContextPath;
                }

                process.stdout.write(JSON.stringify(json, null, 2) + "\n");
            } else {
                // Human-readable output
                process.stdout.write(formatResult(result));
            }

            // Exit with appropriate code
            if (result.status === "failure") {
                process.exitCode = 1;
            } else if (strict && result.status === "success_no_changes") {
                // In strict mode, require explicit skip even if no impactful changes
                process.stdout.write("Error: No impactful changes detected. Use --json for details.\n");
                process.exitCode = 1;
            } else {
                process.exitCode = 0;
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            process.stderr.write(`Error: ${message}\n`);
            process.exitCode = 1;
        }
    });

    return cmd;
}
