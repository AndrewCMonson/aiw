/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { makeTempDir } from "./utils/tmpWorkspace.js";
import { runSetup } from "../src/commands/setup.js";

async function exists(p: string): Promise<boolean> {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
}

describe("aiw setup", () => {
    it("creates folders/files", async () => {
        const dir = await makeTempDir();
        const cwd = process.cwd();
        try {
            process.chdir(dir);
            await runSetup({ workspace: ".ai", force: false, gitignoreMode: "skip" });

            expect(await exists(path.join(dir, ".ai"))).toBe(true);
            expect(await exists(path.join(dir, ".ai", "README.md"))).toBe(true);
            expect(await exists(path.join(dir, ".ai", "prompts"))).toBe(true);
            expect(await exists(path.join(dir, ".ai", "prompts", "repo_discover.md"))).toBe(true);
            expect(await exists(path.join(dir, ".ai", "context"))).toBe(true);
            expect(await exists(path.join(dir, ".ai", "context", "repo_context"))).toBe(true);
            expect(await exists(path.join(dir, ".ai", "context", "repo_context", "REPO_CONTEXT.md"))).toBe(true);
            expect(await exists(path.join(dir, ".ai", "context", "repo_context", "README.md"))).toBe(true);
            expect(await exists(path.join(dir, ".ai", "context", "pr_reviews"))).toBe(true);
            expect(await exists(path.join(dir, ".ai", "context", "feature_plans"))).toBe(true);
            expect(await exists(path.join(dir, ".ai", "context", "debug_notes"))).toBe(true);
            expect(await exists(path.join(dir, ".ai", "context", "pr_reviews", "README.md"))).toBe(true);
            expect(await exists(path.join(dir, ".ai", "context", "feature_plans", "README.md"))).toBe(true);
            expect(await exists(path.join(dir, ".ai", "context", "debug_notes", "README.md"))).toBe(true);
            expect(await exists(path.join(dir, ".ai", "context", "pr_reviews", "_example.md"))).toBe(true);
            expect(await exists(path.join(dir, ".ai", "context", "feature_plans", "_example.md"))).toBe(true);
            expect(await exists(path.join(dir, ".ai", "context", "debug_notes", "_example.md"))).toBe(true);

            // docs/PROJECT_CONTEXT.md should be created by default
            expect(await exists(path.join(dir, "docs", "PROJECT_CONTEXT.md"))).toBe(true);
        } finally {
            process.chdir(cwd);
        }
    });

    it("scaffolds agent rules with --with-agents", async () => {
        const dir = await makeTempDir();
        const cwd = process.cwd();
        try {
            process.chdir(dir);
            await runSetup({ workspace: ".ai", force: false, gitignoreMode: "skip", withAgents: true });

            expect(await exists(path.join(dir, "AGENTS.md"))).toBe(true);
            expect(await exists(path.join(dir, "CLAUDE.md"))).toBe(true);
            expect(await exists(path.join(dir, ".cursor", "rules", "00-core.mdc"))).toBe(true);
            expect(await exists(path.join(dir, ".cursor", "rules", "10-frontend.mdc"))).toBe(true);
            expect(await exists(path.join(dir, ".cursor", "rules", "20-backend.mdc"))).toBe(true);
            expect(await exists(path.join(dir, "docs", "PROJECT_CONTEXT.md"))).toBe(true);
        } finally {
            process.chdir(cwd);
        }
    });

    it("installs pre-push hook with --with-hooks", async () => {
        const dir = await makeTempDir();
        const cwd = process.cwd();
        try {
            process.chdir(dir);
            // Initialize git repo
            const { execSync } = await import("node:child_process");
            execSync("git init", { cwd: dir });
            execSync("git config user.email 'test@example.com'", { cwd: dir });
            execSync("git config user.name 'Test User'", { cwd: dir });

            await runSetup({ workspace: ".ai", force: false, gitignoreMode: "skip", withHooks: true });

            const hookPath = path.join(dir, ".git", "hooks", "pre-push");
            expect(await exists(hookPath)).toBe(true);

            // Check hook content
            const content = await fs.readFile(hookPath, "utf8");
            expect(content).toContain("aiw context:verify");
        } finally {
            process.chdir(cwd);
        }
    });

    it("does not overwrite existing prompt file without --force", async () => {
        const dir = await makeTempDir();
        const cwd = process.cwd();
        try {
            process.chdir(dir);
            await runSetup({ workspace: ".ai", force: false, gitignoreMode: "skip" });

            const promptPath = path.join(dir, ".ai", "prompts", "repo_discover.md");
            await fs.writeFile(promptPath, "SENTINEL\n", "utf8");

            await runSetup({ workspace: ".ai", force: false, gitignoreMode: "skip" });
            const after = await fs.readFile(promptPath, "utf8");
            expect(after).toBe("SENTINEL\n");
        } finally {
            process.chdir(cwd);
        }
    });

    it("does not overwrite existing docs/PROJECT_CONTEXT.md without --force", async () => {
        const dir = await makeTempDir();
        const cwd = process.cwd();
        try {
            process.chdir(dir);

            // Create docs folder with existing PROJECT_CONTEXT.md
            const docsDir = path.join(dir, "docs");
            await fs.mkdir(docsDir, { recursive: true });
            const projectContextPath = path.join(docsDir, "PROJECT_CONTEXT.md");
            await fs.writeFile(projectContextPath, "EXISTING CONTENT\n", "utf8");

            // Run setup
            await runSetup({ workspace: ".ai", force: false, gitignoreMode: "skip" });

            // Verify it was not overwritten
            const after = await fs.readFile(projectContextPath, "utf8");
            expect(after).toBe("EXISTING CONTENT\n");
        } finally {
            process.chdir(cwd);
        }
    });
});
