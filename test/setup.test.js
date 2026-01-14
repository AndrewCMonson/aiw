import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSetup } from "../src/commands/setup.js";
import { makeTempDir } from "./utils/tmpWorkspace.js";
async function exists(p) {
    try {
        await fs.access(p);
        return true;
    }
    catch {
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
            expect(await exists(path.join(dir, ".ai", "REPO_CONTEXT.md"))).toBe(true);
            expect(await exists(path.join(dir, ".ai", "PR_REVIEW.md"))).toBe(true);
            expect(await exists(path.join(dir, ".ai", "FEATURE_PLAN.md"))).toBe(true);
            expect(await exists(path.join(dir, ".ai", "DEBUG_NOTES.md"))).toBe(true);
        }
        finally {
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
        }
        finally {
            process.chdir(cwd);
        }
    });
});
