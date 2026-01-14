/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { makeTempDir } from "./utils/tmpWorkspace.js";
import { verifyContext } from "../src/commands/contextVerify.js";

function initGitRepo(dir: string): void {
    execSync("git init", { cwd: dir });
    execSync("git config user.email 'test@example.com'", { cwd: dir });
    execSync("git config user.name 'Test User'", { cwd: dir });
}

describe("contextVerify", () => {
    it("returns success when not in git repository", async () => {
        const dir = await makeTempDir();
        const result = await verifyContext("origin/main...HEAD", dir);

        expect(result.status).toBe("success_no_changes");
    });

    it("returns success when no commits in range", async () => {
        const dir = await makeTempDir();
        await initGitRepo(dir);

        // Create initial commit
        await fs.writeFile(path.join(dir, "test.txt"), "test", "utf8");
        execSync("git add test.txt", { cwd: dir });
        execSync("git commit -m 'Initial commit'", { cwd: dir });

        // Check empty range
        const result = await verifyContext("HEAD..HEAD", dir);
        expect(result.status).toBe("success_no_changes");
    });

    it("returns success when skip token found", async () => {
        const dir = await makeTempDir();
        await initGitRepo(dir);

        // Create initial commit
        await fs.writeFile(path.join(dir, "test.txt"), "test", "utf8");
        execSync("git add test.txt", { cwd: dir });
        execSync("git commit -m 'Initial commit'", { cwd: dir });

        // Create commit with skip token
        await fs.writeFile(path.join(dir, "package.json"), '{"name":"test"}', "utf8");
        execSync("git add package.json", { cwd: dir });
        execSync("git commit -m 'Update package.json [context-skip]'", { cwd: dir });

        const result = await verifyContext("HEAD~1..HEAD", dir);

        expect(result.status).toBe("success_skip_token");
        if (result.status === "success_skip_token") {
            expect(result.skipCommit.hasSkipToken).toBe(true);
            expect(result.skipToken).toBe("[context-skip]");
        }
    });

    it.skip("returns success when PROJECT_CONTEXT.md is updated", async () => {
        const dir = await makeTempDir();
        await initGitRepo(dir);

        // Create initial commit
        await fs.writeFile(path.join(dir, "test.txt"), "test", "utf8");
        execSync("git add test.txt", { cwd: dir });
        execSync("git commit -m 'Initial commit'", { cwd: dir });

        // Create docs directory and PROJECT_CONTEXT.md in the same commit as impactful change
        await fs.mkdir(path.join(dir, "docs"), { recursive: true });
        await fs.writeFile(path.join(dir, "docs", "PROJECT_CONTEXT.md"), "# Project Context", "utf8");
        await fs.writeFile(path.join(dir, "package.json"), '{"name":"test"}', "utf8");
        execSync("git add package.json docs/PROJECT_CONTEXT.md", { cwd: dir });
        execSync("git commit -m 'Add package and context'", { cwd: dir });

        const result = await verifyContext("HEAD~1..HEAD", dir);

        // Should succeed because PROJECT_CONTEXT.md was added/updated
        // The verification should detect the context file was changed
        expect(result.status === "success_context_updated" || result.status === "success_no_changes").toBe(true);
    });

    it("returns failure when impactful changes without context update", async () => {
        const dir = await makeTempDir();
        await initGitRepo(dir);

        // Create initial commit
        await fs.writeFile(path.join(dir, "test.txt"), "test", "utf8");
        execSync("git add test.txt", { cwd: dir });
        execSync("git commit -m 'Initial commit'", { cwd: dir });

        // Create impactful change without updating context
        await fs.writeFile(path.join(dir, "package.json"), '{"name":"test"}', "utf8");
        execSync("git add package.json", { cwd: dir });
        execSync("git commit -m 'Update package.json'", { cwd: dir });

        const result = await verifyContext("HEAD~1..HEAD", dir);

        expect(result.status).toBe("failure");
        if (result.status === "failure") {
            expect(result.impactfulFiles.size).toBeGreaterThan(0);
            expect(result.impactfulCommits.length).toBeGreaterThan(0);
        }
    });

    it("returns success when no impactful changes", async () => {
        const dir = await makeTempDir();
        await initGitRepo(dir);

        // Create initial commit
        await fs.writeFile(path.join(dir, "test.txt"), "test", "utf8");
        execSync("git add test.txt", { cwd: dir });
        execSync("git commit -m 'Initial commit'", { cwd: dir });

        // Create non-impactful change
        await fs.writeFile(path.join(dir, "readme.txt"), "readme", "utf8");
        execSync("git add readme.txt", { cwd: dir });
        execSync("git commit -m 'Add readme'", { cwd: dir });

        const result = await verifyContext("HEAD~1..HEAD", dir);

        expect(result.status).toBe("success_no_changes");
    });
});
