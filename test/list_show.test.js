import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listPrompts } from "../src/commands/list.js";
import { getPromptContents } from "../src/commands/show.js";
import { runSetup } from "../src/commands/setup.js";
import { makeTempDir } from "./utils/tmpWorkspace.js";
describe("aiw list/show", () => {
    it("list returns the default prompt set after setup", async () => {
        const dir = await makeTempDir();
        const cwd = process.cwd();
        try {
            process.chdir(dir);
            await runSetup({ workspace: ".ai", force: false, gitignoreMode: "skip" });
            const slugs = await listPrompts({ workspace: ".ai" });
            expect(slugs).toEqual(["context_sync", "debug_senior", "feature_plan", "pre_push_review", "repo_discover", "repo_refresh"]);
        } finally {
            process.chdir(cwd);
        }
    });
    it("show prints prompt content (matches file)", async () => {
        const dir = await makeTempDir();
        const cwd = process.cwd();
        try {
            process.chdir(dir);
            await runSetup({ workspace: ".ai", force: false, gitignoreMode: "skip" });
            const { contents } = await getPromptContents({
                workspace: ".ai",
                promptName: "repo_discover",
            });
            const filePath = path.join(dir, ".ai", "prompts", "repo_discover.md");
            const fileContents = await fs.readFile(filePath, "utf8");
            expect(contents).toBe(fileContents);
        } finally {
            process.chdir(cwd);
        }
    });
});
