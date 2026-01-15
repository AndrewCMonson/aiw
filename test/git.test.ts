/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { makeTempDir } from "./utils/tmpWorkspace.js";
import {
    getChangedFiles,
    getChangedFilesPerCommit,
    getCommitsInRange,
    getCurrentBranch,
    getHeadSha,
    hasFileInRange,
    isGitRepo,
} from "../src/lib/git.js";

function initGitRepo(dir: string): void {
    execSync("git init", { cwd: dir });
    execSync("git config user.email 'test@example.com'", { cwd: dir });
    execSync("git config user.name 'Test User'", { cwd: dir });
}

describe("git utilities", () => {
    it("detects git repository", async () => {
        const dir = await makeTempDir();
        expect(isGitRepo(dir)).toBe(false);

        await initGitRepo(dir);
        expect(isGitRepo(dir)).toBe(true);
    });

    it("gets current branch name", async () => {
        const dir = await makeTempDir();
        await initGitRepo(dir);

        // Create initial commit
        await fs.writeFile(path.join(dir, "test.txt"), "test", "utf8");
        execSync("git add test.txt", { cwd: dir });
        execSync("git commit -m 'Initial commit'", { cwd: dir });

        const branch = getCurrentBranch(dir);
        expect(branch).toBe("main");
    });

    it("gets HEAD SHA", async () => {
        const dir = await makeTempDir();
        await initGitRepo(dir);

        // Create initial commit
        await fs.writeFile(path.join(dir, "test.txt"), "test", "utf8");
        execSync("git add test.txt", { cwd: dir });
        execSync("git commit -m 'Initial commit'", { cwd: dir });

        const headSha = getHeadSha(dir);
        expect(headSha).toBeTruthy();
        expect(headSha?.length).toBe(40); // Full SHA is 40 characters

        // Verify it matches git rev-parse HEAD
        const expectedSha = execSync("git rev-parse HEAD", { cwd: dir, encoding: "utf8" }).trim();
        expect(headSha).toBe(expectedSha);
    });

    it("returns null for HEAD SHA when not in git repo", () => {
        const dir = "/nonexistent/directory";
        const headSha = getHeadSha(dir);
        expect(headSha).toBeNull();
    });

    it("gets commits in range with skip token detection", async () => {
        const dir = await makeTempDir();
        await initGitRepo(dir);

        // Create initial commit
        await fs.writeFile(path.join(dir, "test.txt"), "test", "utf8");
        execSync("git add test.txt", { cwd: dir });
        execSync("git commit -m 'Initial commit'", { cwd: dir });

        // Create commit with skip token
        await fs.writeFile(path.join(dir, "test2.txt"), "test2", "utf8");
        execSync("git add test2.txt", { cwd: dir });
        execSync("git commit -m 'Update [context-skip]'", { cwd: dir });

        // Create commit without skip token
        await fs.writeFile(path.join(dir, "test3.txt"), "test3", "utf8");
        execSync("git add test3.txt", { cwd: dir });
        execSync("git commit -m 'Another update'", { cwd: dir });

        const commits = getCommitsInRange("HEAD~2..HEAD", "[context-skip]", dir);

        expect(commits.length).toBeGreaterThan(0);
        const skipCommit = commits.find((c) => c.hasSkipToken);
        expect(skipCommit).toBeDefined();
        expect(skipCommit?.subject).toContain("Update");
    });

    it("gets changed files in range", async () => {
        const dir = await makeTempDir();
        await initGitRepo(dir);

        // Create initial commit
        await fs.writeFile(path.join(dir, "test.txt"), "test", "utf8");
        execSync("git add test.txt", { cwd: dir });
        execSync("git commit -m 'Initial commit'", { cwd: dir });

        // Create new file
        await fs.writeFile(path.join(dir, "new.txt"), "new", "utf8");
        execSync("git add new.txt", { cwd: dir });
        execSync("git commit -m 'Add new file'", { cwd: dir });

        const files = getChangedFiles("HEAD~1..HEAD", dir);
        expect(files).toContain("new.txt");
    });

    it("checks if file was modified in range", async () => {
        const dir = await makeTempDir();
        await initGitRepo(dir);

        // Create initial commit
        await fs.writeFile(path.join(dir, "test.txt"), "test", "utf8");
        execSync("git add test.txt", { cwd: dir });
        execSync("git commit -m 'Initial commit'", { cwd: dir });

        // Modify file
        await fs.writeFile(path.join(dir, "test.txt"), "modified", "utf8");
        execSync("git add test.txt", { cwd: dir });
        execSync("git commit -m 'Modify test'", { cwd: dir });

        expect(hasFileInRange("HEAD~1..HEAD", "test.txt", dir)).toBe(true);
        expect(hasFileInRange("HEAD~1..HEAD", "nonexistent.txt", dir)).toBe(false);
    });

    it.skip("gets changed files per commit", async () => {
        const dir = await makeTempDir();
        await initGitRepo(dir);

        // Create initial commit
        await fs.writeFile(path.join(dir, "test.txt"), "test", "utf8");
        execSync("git add test.txt", { cwd: dir });
        execSync("git commit -m 'Initial commit'", { cwd: dir });
        const initialHash = execSync("git rev-parse HEAD", { cwd: dir, encoding: "utf8" }).trim();

        // Create commit with multiple files
        await fs.writeFile(path.join(dir, "file1.txt"), "file1", "utf8");
        await fs.writeFile(path.join(dir, "file2.txt"), "file2", "utf8");
        execSync("git add file1.txt file2.txt", { cwd: dir });
        execSync("git commit -m 'Add multiple files'", { cwd: dir });

        // Get commits from initial to HEAD
        const commitsWithFiles = getChangedFilesPerCommit(`${initialHash}^..HEAD`, dir);
        // Should have commits
        expect(commitsWithFiles.length).toBeGreaterThan(0);
        // At least one commit should have files
        const commitWithFiles = commitsWithFiles.find((c) => c.files.length > 0);
        expect(commitWithFiles).toBeDefined();
    });
});
