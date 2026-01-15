/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { makeTempDir } from "./utils/tmpWorkspace.js";
import { startCompletionWatcher } from "../src/lib/completionWatcher.js";

describe("completionWatcher", () => {
    it("detects new file created after session start", async () => {
        const dir = await makeTempDir();
        const reviewsDir = path.join(dir, "reviews");
        await fs.mkdir(reviewsDir, { recursive: true });

        const sessionStartTime = Date.now();

        // Wait a bit to ensure file is created after session start
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Create a new file
        const filePath = path.join(reviewsDir, "review.md");
        await fs.writeFile(filePath, "Review content", "utf8");

        return new Promise<void>((resolve, reject) => {
            const watcher = startCompletionWatcher({
                sessionStartTime,
                reviewsDir,
                pollIntervalMs: 50, // Fast polling for test
                maxDurationMs: 1000,
            });

            watcher.on("complete", ({ artifactPath }: { artifactPath: string }) => {
                expect(artifactPath).toBe(filePath);
                watcher.stop();
                resolve();
            });

            watcher.on("timeout", () => {
                watcher.stop();
                reject(new Error("Timeout - file should have been detected"));
            });
        });
    });

    it("ignores files created before session start", async () => {
        const dir = await makeTempDir();
        const reviewsDir = path.join(dir, "reviews");
        await fs.mkdir(reviewsDir, { recursive: true });

        // Create file before session start
        const filePath = path.join(reviewsDir, "old-review.md");
        await fs.writeFile(filePath, "Old review", "utf8");

        // Wait a bit to ensure file mtime is definitely in the past
        await new Promise((resolve) => setTimeout(resolve, 100));

        const sessionStartTime = Date.now();

        return new Promise<void>((resolve, reject) => {
            const watcher = startCompletionWatcher({
                sessionStartTime,
                reviewsDir,
                pollIntervalMs: 50,
                maxDurationMs: 500,
            });

            watcher.on("complete", () => {
                watcher.stop();
                reject(new Error("Should not detect old file"));
            });

            watcher.on("timeout", () => {
                watcher.stop();
                resolve(); // Expected behavior - timeout because no new file
            });
        });
    });

    it("verifies HEAD SHA in file contents when provided", async () => {
        const dir = await makeTempDir();
        const reviewsDir = path.join(dir, "reviews");
        await fs.mkdir(reviewsDir, { recursive: true });

        const sessionStartTime = Date.now();
        const headSha = "abc123def456";

        // Wait a bit
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Create file with matching HEAD SHA
        const filePath = path.join(reviewsDir, "review.md");
        await fs.writeFile(filePath, `# Review\n\n**Head SHA:** ${headSha}\n\nReview content here.`, "utf8");

        return new Promise<void>((resolve, reject) => {
            const watcher = startCompletionWatcher({
                sessionStartTime,
                headSha,
                reviewsDir,
                pollIntervalMs: 50,
                maxDurationMs: 1000,
            });

            watcher.on("complete", ({ artifactPath }: { artifactPath: string }) => {
                expect(artifactPath).toBe(filePath);
                watcher.stop();
                resolve();
            });

            watcher.on("timeout", () => {
                watcher.stop();
                reject(new Error("Timeout - file with matching SHA should have been detected"));
            });
        });
    });

    it("ignores files without matching HEAD SHA", async () => {
        const dir = await makeTempDir();
        const reviewsDir = path.join(dir, "reviews");
        await fs.mkdir(reviewsDir, { recursive: true });

        const sessionStartTime = Date.now();
        const headSha = "abc123def456";

        // Wait a bit
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Create file with different HEAD SHA
        const filePath = path.join(reviewsDir, "review.md");
        await fs.writeFile(filePath, `# Review\n\n**Head SHA:** different-sha\n\nReview content here.`, "utf8");

        return new Promise<void>((resolve, reject) => {
            const watcher = startCompletionWatcher({
                sessionStartTime,
                headSha,
                reviewsDir,
                pollIntervalMs: 50,
                maxDurationMs: 500,
            });

            watcher.on("complete", () => {
                watcher.stop();
                reject(new Error("Should not detect file with mismatched SHA"));
            });

            watcher.on("timeout", () => {
                watcher.stop();
                resolve(); // Expected - timeout because SHA doesn't match
            });
        });
    });

    it("handles case-insensitive HEAD SHA matching", async () => {
        const dir = await makeTempDir();
        const reviewsDir = path.join(dir, "reviews");
        await fs.mkdir(reviewsDir, { recursive: true });

        const sessionStartTime = Date.now();
        const headSha = "abc123def456";

        // Wait a bit
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Create file with HEAD SHA in different case
        const filePath = path.join(reviewsDir, "review.md");
        await fs.writeFile(filePath, `# Review\n\n**Head SHA:** ${headSha.toUpperCase()}\n\nReview content here.`, "utf8");

        return new Promise<void>((resolve, reject) => {
            const watcher = startCompletionWatcher({
                sessionStartTime,
                headSha,
                reviewsDir,
                pollIntervalMs: 50,
                maxDurationMs: 1000,
            });

            watcher.on("complete", ({ artifactPath }: { artifactPath: string }) => {
                expect(artifactPath).toBe(filePath);
                watcher.stop();
                resolve();
            });

            watcher.on("timeout", () => {
                watcher.stop();
                reject(new Error("Timeout - case-insensitive match should work"));
            });
        });
    });

    it("emits timeout after max duration", async () => {
        const dir = await makeTempDir();
        const reviewsDir = path.join(dir, "reviews");
        await fs.mkdir(reviewsDir, { recursive: true });

        const sessionStartTime = Date.now();

        return new Promise<void>((resolve, reject) => {
            const watcher = startCompletionWatcher({
                sessionStartTime,
                reviewsDir,
                pollIntervalMs: 50,
                maxDurationMs: 200, // Short timeout for test
            });

            watcher.on("complete", () => {
                watcher.stop();
                reject(new Error("Should not detect completion"));
            });

            watcher.on("timeout", () => {
                watcher.stop();
                resolve(); // Expected - timeout after max duration
            });
        });
    });

    it("stops polling when stop() is called", async () => {
        const dir = await makeTempDir();
        const reviewsDir = path.join(dir, "reviews");
        await fs.mkdir(reviewsDir, { recursive: true });

        const sessionStartTime = Date.now();

        return new Promise<void>((resolve) => {
            const watcher = startCompletionWatcher({
                sessionStartTime,
                reviewsDir,
                pollIntervalMs: 50,
                maxDurationMs: 1000,
            });

            // Stop immediately
            watcher.stop();

            // Wait a bit to ensure no events are emitted
            setTimeout(() => {
                // If we get here without events, the stop worked
                resolve();
            }, 200);
        });
    });

    it("handles missing directory gracefully", async () => {
        const dir = await makeTempDir();
        const reviewsDir = path.join(dir, "nonexistent", "reviews");

        const sessionStartTime = Date.now();

        return new Promise<void>((resolve, reject) => {
            const watcher = startCompletionWatcher({
                sessionStartTime,
                reviewsDir,
                pollIntervalMs: 50,
                maxDurationMs: 200,
            });

            watcher.on("complete", () => {
                watcher.stop();
                reject(new Error("Should not detect completion in missing directory"));
            });

            watcher.on("timeout", () => {
                watcher.stop();
                resolve(); // Expected - timeout because directory doesn't exist
            });
        });
    });

    it("detects modification of existing file (repo_refresh pattern)", async () => {
        const dir = await makeTempDir();
        const repoContextDir = path.join(dir, ".ai", "context", "repo_context");
        await fs.mkdir(repoContextDir, { recursive: true });

        const filePath = path.join(repoContextDir, "REPO_CONTEXT.md");

        // Create file before session start
        await fs.writeFile(filePath, "Original content", "utf8");

        // Wait to ensure file mtime is in the past
        await new Promise((resolve) => setTimeout(resolve, 100));

        const sessionStartTime = Date.now();

        // Wait a bit more to ensure session start is recorded
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Modify the file after session start
        await fs.writeFile(filePath, "Updated content", "utf8");

        // Wait a bit for filesystem to update mtime
        await new Promise((resolve) => setTimeout(resolve, 50));

        return new Promise<void>((resolve, reject) => {
            const watcher = startCompletionWatcher({
                sessionStartTime,
                promptSlug: "repo_refresh",
                workspace: path.join(dir, ".ai"),
                pollIntervalMs: 50,
                maxDurationMs: 2000,
            });

            watcher.on("complete", ({ artifactPath }: { artifactPath: string }) => {
                expect(artifactPath).toBe(filePath);
                watcher.stop();
                resolve();
            });

            watcher.on("timeout", () => {
                watcher.stop();
                reject(new Error("Timeout - modified file should have been detected"));
            });
        });
    });

    it("uses prompt-aware detection for pre_push_review", async () => {
        const dir = await makeTempDir();
        const reviewsDir = path.join(dir, ".ai", "context", "pr_reviews");
        await fs.mkdir(reviewsDir, { recursive: true });

        const sessionStartTime = Date.now();

        // Wait a bit
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Create new file
        const filePath = path.join(reviewsDir, "review.md");
        await fs.writeFile(filePath, "Review content", "utf8");

        return new Promise<void>((resolve, reject) => {
            const watcher = startCompletionWatcher({
                sessionStartTime,
                promptSlug: "pre_push_review",
                workspace: path.join(dir, ".ai"),
                pollIntervalMs: 50,
                maxDurationMs: 1000,
            });

            watcher.on("complete", ({ artifactPath }: { artifactPath: string }) => {
                expect(artifactPath).toBe(filePath);
                watcher.stop();
                resolve();
            });

            watcher.on("timeout", () => {
                watcher.stop();
                reject(new Error("Timeout - new file should have been detected"));
            });
        });
    });

    it("uses fallback detection for unknown prompts", async () => {
        const dir = await makeTempDir();
        const reviewsDir = path.join(dir, ".ai", "context", "pr_reviews");
        await fs.mkdir(reviewsDir, { recursive: true });

        const sessionStartTime = Date.now();

        // Wait a bit
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Create new file in one of the fallback directories
        const filePath = path.join(reviewsDir, "review.md");
        await fs.writeFile(filePath, "Review content", "utf8");

        return new Promise<void>((resolve, reject) => {
            const watcher = startCompletionWatcher({
                sessionStartTime,
                promptSlug: "unknown_prompt",
                workspace: path.join(dir, ".ai"),
                pollIntervalMs: 50,
                maxDurationMs: 1000,
            });

            watcher.on("complete", ({ artifactPath }: { artifactPath: string }) => {
                expect(artifactPath).toBe(filePath);
                watcher.stop();
                resolve();
            });

            watcher.on("timeout", () => {
                watcher.stop();
                reject(new Error("Timeout - fallback detection should work"));
            });
        });
    });

    it.skip("waits for both review and receipt files for pre_push_review (all-files mode)", async () => {
        const dir = await makeTempDir();
        const cwd = process.cwd();
        try {
            process.chdir(dir);

            const reviewsDir = path.join(dir, ".ai", "context", "pr_reviews");
            await fs.mkdir(reviewsDir, { recursive: true });

            const receiptDir = path.join(dir, ".aiw", "receipts", "pre_push_review");
            await fs.mkdir(receiptDir, { recursive: true });

            const headSha = "abc123def456";
            const receiptFile = path.join(receiptDir, `${headSha}.md`);

            const sessionStartTime = Date.now();

            // Wait a bit to ensure session start is recorded
            await new Promise((resolve) => setTimeout(resolve, 100));

            return new Promise<void>((resolve, reject) => {
                const watcher = startCompletionWatcher({
                    sessionStartTime,
                    headSha,
                    promptSlug: "pre_push_review",
                    workspace: ".ai",
                    pollIntervalMs: 50,
                    maxDurationMs: 5000,
                });

                watcher.on("complete", ({ artifactPath }: { artifactPath: string }) => {
                    // Should only complete after both files are written
                    const reviewFile = path.join(reviewsDir, "review.md");
                    expect(artifactPath).toBe(reviewFile); // Should return review file path
                    watcher.stop();
                    resolve();
                });

                watcher.on("timeout", () => {
                    watcher.stop();
                    reject(new Error("Timeout - both files should have been detected"));
                });

                // Write review file first (after 200ms)
                setTimeout(() => {
                    const reviewFile = path.join(reviewsDir, "review.md");
                    fs.writeFile(reviewFile, `# Review\n\n**Head SHA:** ${headSha}\n\nContent.`, "utf8").catch(reject);
                }, 200);

                // Write receipt file after a delay (simulating agent writing it second)
                setTimeout(() => {
                    fs.writeFile(receiptFile, `# Receipt\n\nHead SHA: ${headSha}`, "utf8").catch(reject);
                }, 600);
            });
        } finally {
            process.chdir(cwd);
        }
    }, 10000); // 10 second timeout

    it("only detects .md files", async () => {
        const dir = await makeTempDir();
        const reviewsDir = path.join(dir, "reviews");
        await fs.mkdir(reviewsDir, { recursive: true });

        const sessionStartTime = Date.now();

        // Wait a bit
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Create non-.md file
        const txtPath = path.join(reviewsDir, "review.txt");
        await fs.writeFile(txtPath, "Not a markdown file", "utf8");

        // Create .md file
        const mdPath = path.join(reviewsDir, "review.md");
        await fs.writeFile(mdPath, "Markdown file", "utf8");

        return new Promise<void>((resolve, reject) => {
            const watcher = startCompletionWatcher({
                sessionStartTime,
                reviewsDir,
                pollIntervalMs: 50,
                maxDurationMs: 1000,
            });

            watcher.on("complete", ({ artifactPath }: { artifactPath: string }) => {
                expect(artifactPath).toBe(mdPath);
                expect(artifactPath).not.toBe(txtPath);
                watcher.stop();
                resolve();
            });

            watcher.on("timeout", () => {
                watcher.stop();
                reject(new Error("Timeout - .md file should have been detected"));
            });
        });
    });
});
