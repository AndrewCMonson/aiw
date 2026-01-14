/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { makeTempDir } from "./utils/tmpWorkspace.js";
import { installPrePushHook, uninstallPrePushHook } from "../src/lib/hooks.js";

function initGitRepo(dir: string): void {
    execSync("git init", { cwd: dir });
    execSync("git config user.email 'test@example.com'", { cwd: dir });
    execSync("git config user.name 'Test User'", { cwd: dir });
}

describe("hooks", () => {
    it("installs pre-push hook in git repository", async () => {
        const dir = await makeTempDir();
        await initGitRepo(dir);

        const result = await installPrePushHook(dir);

        expect(result.installed).toBe(true);
        expect(result.path).toContain(".git/hooks/pre-push");

        // Check that hook file exists and is executable
        const hookPath = result.path;
        const exists = await fs
            .access(hookPath)
            .then(() => true)
            .catch(() => false);
        expect(exists).toBe(true);

        // Check hook content
        const content = await fs.readFile(hookPath, "utf8");
        expect(content).toContain("aiw context:verify");
        expect(content).toContain("# aiw context:verify hook");
    });

    it("returns error when not in git repository", async () => {
        const dir = await makeTempDir();

        const result = await installPrePushHook(dir);

        expect(result.installed).toBe(false);
        expect(result.message).toContain("Not a git repository");
    });

    it("appends to existing pre-push hook", async () => {
        const dir = await makeTempDir();
        await initGitRepo(dir);

        const hooksDir = path.join(dir, ".git", "hooks");
        const hookPath = path.join(hooksDir, "pre-push");
        const existingContent = "#!/bin/sh\necho 'existing hook'\n";

        await fs.mkdir(hooksDir, { recursive: true });
        await fs.writeFile(hookPath, existingContent, "utf8");
        await fs.chmod(hookPath, 0o755);

        const result = await installPrePushHook(dir);

        expect(result.installed).toBe(true);
        const content = await fs.readFile(hookPath, "utf8");
        expect(content).toContain("existing hook");
        expect(content).toContain("aiw context:verify");
    });

    it("uninstalls pre-push hook", async () => {
        const dir = await makeTempDir();
        await initGitRepo(dir);

        // Install hook first
        await installPrePushHook(dir);

        // Uninstall
        const result = await uninstallPrePushHook(dir);

        expect(result.uninstalled).toBe(true);

        // Check that aiw hook is removed
        const hookPath = result.path;
        const content = await fs.readFile(hookPath, "utf8");
        expect(content).not.toContain("aiw context:verify");
    });

    it("handles uninstall when hook doesn't exist", async () => {
        const dir = await makeTempDir();
        await initGitRepo(dir);

        const result = await uninstallPrePushHook(dir);

        expect(result.uninstalled).toBe(true);
        expect(result.message).toContain("does not exist");
    });
});
