/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import { EventEmitter } from "node:events";
import fs from "node:fs/promises";
import path from "node:path";

export interface PromptArtifactConfig {
    /** Watch paths: directories for new files, or specific file paths for modifications */
    watchPaths: string[];
    /** Detection mode: 'new-files' watches for new files, 'modify-existing' watches specific files, 'both' does both */
    detectionMode: "new-files" | "modify-existing" | "both";
}

/**
 * Maps prompt slugs to their artifact output locations and detection modes.
 */
const PROMPT_ARTIFACT_MAP: Record<string, PromptArtifactConfig> = {
    pre_push_review: {
        watchPaths: [".ai/context/pr_reviews"],
        detectionMode: "new-files",
    },
    repo_refresh: {
        watchPaths: [".ai/context/repo_context/REPO_CONTEXT.md"],
        detectionMode: "modify-existing",
    },
    repo_discover: {
        watchPaths: [".ai/context/repo_context/REPO_CONTEXT.md"],
        detectionMode: "both", // Can create new or modify existing
    },
    feature_plan: {
        watchPaths: [".ai/context/feature_plans"],
        detectionMode: "new-files",
    },
    debug_senior: {
        watchPaths: [".ai/context/debug_notes"],
        detectionMode: "new-files",
    },
    context_sync: {
        watchPaths: ["docs/PROJECT_CONTEXT.md"],
        detectionMode: "modify-existing",
    },
};

export interface CompletionWatcherOptions {
    /** Session start time in milliseconds (Date.now()) */
    sessionStartTime: number;
    /** Optional HEAD SHA to match in artifact file contents */
    headSha?: string;
    /** Prompt slug to determine artifact location (if not provided, uses fallback) */
    promptSlug?: string;
    /** Workspace directory (default: ".ai") */
    workspace?: string;
    /** Directory to watch for review artifacts (deprecated, use promptSlug instead) */
    reviewsDir?: string;
    /** Polling interval in milliseconds (default: 300) */
    pollIntervalMs?: number;
    /** Maximum watch duration in milliseconds (default: 600000 = 10 minutes) */
    maxDurationMs?: number;
}

export interface CompletionWatcher extends EventEmitter {
    /** Stop the watcher and clean up resources */
    stop(): void;
}

/**
 * Resolves watch paths for a prompt slug, with fallback to all context directories.
 *
 * @param promptSlug - Prompt slug to look up
 * @param workspace - Workspace directory (default: ".ai")
 * @returns Artifact configuration for the prompt
 */
function getPromptArtifactConfig(promptSlug: string | undefined, workspace: string): PromptArtifactConfig {
    // Resolve workspace path - handle both relative and absolute paths
    const workspacePath = path.isAbsolute(workspace) ? workspace : path.resolve(process.cwd(), workspace);

    if (promptSlug && PROMPT_ARTIFACT_MAP[promptSlug]) {
        const config = PROMPT_ARTIFACT_MAP[promptSlug];
        // Resolve paths relative to workspace or process.cwd()
        return {
            watchPaths: config.watchPaths.map((p) => {
                if (p.startsWith(".ai/")) {
                    // Remove ".ai/" prefix and join with workspace path
                    const relativePath = p.slice(4); // "context/repo_context/REPO_CONTEXT.md"
                    const resolvedPath = path.join(workspacePath, relativePath);
                    if (process.env.DEBUG) {
                        process.stderr.write(`[DEBUG] Resolved path: ${p} -> ${resolvedPath}\n`);
                    }
                    return resolvedPath;
                }
                // Paths like "docs/PROJECT_CONTEXT.md" are relative to process.cwd()
                const resolvedPath = path.resolve(process.cwd(), p);
                if (process.env.DEBUG) {
                    process.stderr.write(`[DEBUG] Resolved path: ${p} -> ${resolvedPath}\n`);
                }
                return resolvedPath;
            }),
            detectionMode: config.detectionMode,
        };
    }

    // Fallback: watch all context directories for new files
    return {
        watchPaths: [
            path.join(workspacePath, "context", "pr_reviews"),
            path.join(workspacePath, "context", "feature_plans"),
            path.join(workspacePath, "context", "debug_notes"),
            path.join(workspacePath, "context", "repo_context"),
        ],
        detectionMode: "new-files",
    };
}

/**
 * Starts a completion watcher that polls for review artifacts.
 * Emits "complete" event when a matching artifact is found, or "timeout" after max duration.
 *
 * @param options - Configuration options for the watcher
 * @returns EventEmitter that emits "complete" or "timeout" events
 */
export function startCompletionWatcher(options: CompletionWatcherOptions): CompletionWatcher {
    const {
        sessionStartTime,
        headSha,
        promptSlug,
        workspace = ".ai",
        reviewsDir, // Deprecated, kept for backward compatibility
        pollIntervalMs = 300,
        maxDurationMs = 600000,
    } = options;

    // Use promptSlug-based config, or fallback to reviewsDir for backward compatibility
    const artifactConfig = reviewsDir
        ? {
              watchPaths: [reviewsDir],
              detectionMode: "new-files" as const,
          }
        : getPromptArtifactConfig(promptSlug, workspace);

    if (process.env.DEBUG) {
        process.stderr.write(`[DEBUG] Completion watcher started:\n`);
        process.stderr.write(`  promptSlug: ${promptSlug ?? "none"}\n`);
        process.stderr.write(`  workspace: ${workspace}\n`);
        process.stderr.write(`  sessionStartTime: ${sessionStartTime}\n`);
        process.stderr.write(`  watchPaths: ${artifactConfig.watchPaths.join(", ")}\n`);
        process.stderr.write(`  detectionMode: ${artifactConfig.detectionMode}\n`);
        process.stderr.write(`  headSha: ${headSha ?? "none"}\n`);
    }

    const emitter = new EventEmitter() as CompletionWatcher;
    let pollInterval: NodeJS.Timeout | null = null;
    let timeoutTimer: NodeJS.Timeout | null = null;
    let isStopped = false;

    const stop = (): void => {
        if (isStopped) {
            return;
        }
        isStopped = true;

        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }

        if (timeoutTimer) {
            clearTimeout(timeoutTimer);
            timeoutTimer = null;
        }
    };

    emitter.stop = stop;

    /**
     * Checks if a file matches the completion criteria.
     * Returns the file path if it matches, null otherwise.
     * @param filePath
     */
    const checkFile = async (filePath: string): Promise<string | null> => {
        try {
            const stats = await fs.stat(filePath);
            const fileMtime = stats.mtimeMs;

            // Add small buffer (50ms) to account for filesystem timing delays
            const timingBuffer = 50;
            const adjustedStartTime = sessionStartTime - timingBuffer;

            // File must be created/modified after session start (with buffer)
            // Use strict > comparison to ensure file was modified after session started
            if (fileMtime <= adjustedStartTime) {
                if (process.env.DEBUG) {
                    process.stderr.write(
                        `[DEBUG] File ${filePath} mtime ${fileMtime} <= sessionStart ${sessionStartTime} (adjusted: ${adjustedStartTime})\n`,
                    );
                }
                return null;
            }

            if (process.env.DEBUG) {
                process.stderr.write(
                    `[DEBUG] File ${filePath} mtime ${fileMtime} > sessionStart ${sessionStartTime} (adjusted: ${adjustedStartTime}) - MATCH\n`,
                );
            }

            // If HEAD SHA is provided, verify it's in the file contents
            if (headSha) {
                try {
                    const contents = await fs.readFile(filePath, "utf8");
                    // Look for pattern: **Head SHA:** <sha> or similar variations
                    const shaPattern = new RegExp(`\\*\\*Head SHA:\\*\\*\\s*${headSha}`, "i");
                    if (!shaPattern.test(contents)) {
                        return null;
                    }
                } catch {
                    // If we can't read the file, skip it
                    return null;
                }
            }

            return filePath;
        } catch {
            // If we can't stat the file, skip it
            return null;
        }
    };

    /**
     * Checks a specific file path (for modify-existing mode).
     * @param filePath
     */
    const checkSpecificFile = async (filePath: string): Promise<string | null> => {
        try {
            return await checkFile(filePath);
        } catch {
            return null;
        }
    };

    /**
     * Checks a directory for new files (for new-files mode).
     * @param dirPath
     */
    const checkDirectory = async (dirPath: string): Promise<string | null> => {
        try {
            // Check if directory exists
            try {
                await fs.access(dirPath);
            } catch {
                // Directory doesn't exist yet, continue polling
                return null;
            }

            // Read directory contents
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            // Check each .md file
            for (const entry of entries) {
                if (isStopped) {
                    return null;
                }

                if (entry.isFile() && entry.name.endsWith(".md")) {
                    const filePath = path.join(dirPath, entry.name);
                    const match = await checkFile(filePath);

                    if (match) {
                        return match;
                    }
                }
            }
        } catch {
            // Ignore errors during polling
        }

        return null;
    };

    /**
     * Polls watch paths for matching artifacts.
     */
    const poll = async (): Promise<void> => {
        if (isStopped) {
            return;
        }

        try {
            for (const watchPath of artifactConfig.watchPaths) {
                if (isStopped) {
                    return;
                }

                let match: string | null = null;

                // Check if watchPath is a file or directory
                try {
                    const stats = await fs.stat(watchPath);
                    if (stats.isFile()) {
                        // Specific file to watch (modify-existing mode)
                        if (artifactConfig.detectionMode === "modify-existing" || artifactConfig.detectionMode === "both") {
                            if (process.env.DEBUG) {
                                process.stderr.write(`[DEBUG] Polling file: ${watchPath}\n`);
                            }
                            match = await checkSpecificFile(watchPath);
                        }
                    } else if (stats.isDirectory()) {
                        // Directory to watch (new-files mode)
                        if (artifactConfig.detectionMode === "new-files" || artifactConfig.detectionMode === "both") {
                            if (process.env.DEBUG) {
                                process.stderr.write(`[DEBUG] Polling directory: ${watchPath}\n`);
                            }
                            match = await checkDirectory(watchPath);
                        }
                    }
                } catch (err) {
                    // Path doesn't exist yet, continue to next path
                    if (process.env.DEBUG) {
                        const error = err as NodeJS.ErrnoException;
                        process.stderr.write(`[DEBUG] Path ${watchPath} not accessible: ${error.message}\n`);
                    }
                    continue;
                }

                if (match) {
                    if (process.env.DEBUG) {
                        process.stderr.write(`[DEBUG] Match found: ${match}\n`);
                    }
                    stop();
                    emitter.emit("complete", { artifactPath: match });
                    return;
                }
            }
        } catch (error) {
            // Ignore errors during polling (directory might not exist, permissions, etc.)
            // Continue polling until timeout
            if (process.env.DEBUG) {
                const err = error as Error;
                process.stderr.write(`[DEBUG] Poll error: ${err.message}\n`);
            }
        }
    };

    // Start polling
    pollInterval = setInterval(() => {
        void poll();
    }, pollIntervalMs);

    // Set timeout
    timeoutTimer = setTimeout(() => {
        if (!isStopped) {
            stop();
            emitter.emit("timeout", {});
        }
    }, maxDurationMs);

    // Initial poll (don't wait for first interval)
    poll().catch(() => {
        // Ignore initial poll errors
    });

    return emitter;
}
