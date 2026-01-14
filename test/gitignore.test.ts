/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { makeTempDir } from "./utils/tmpWorkspace.js";
import { runSetup } from "../src/commands/setup.js";

async function readIfExists(p: string): Promise<string | null> {
    try {
        return await fs.readFile(p, "utf8");
    } catch {
        return null;
    }
}

describe("aiw setup gitignore behavior", () => {
    it("does not update .gitignore when --gitignore skip", async () => {
        const dir = await makeTempDir();
        const cwd = process.cwd();
        try {
            process.chdir(dir);
            await runSetup({ workspace: ".ai", force: false, gitignoreMode: "skip" });

            const gi = await readIfExists(path.join(dir, ".gitignore"));
            expect(gi).toBeNull();
        } finally {
            process.chdir(cwd);
        }
    });

    it("updates .gitignore only when opted in via --gitignore add", async () => {
        const dir = await makeTempDir();
        const cwd = process.cwd();
        try {
            process.chdir(dir);
            await runSetup({ workspace: ".ai", force: false, gitignoreMode: "add" });

            const gi = await readIfExists(path.join(dir, ".gitignore"));
            expect(gi).not.toBeNull();
            expect(gi!).toContain(".ai/");
        } finally {
            process.chdir(cwd);
        }
    });

    it("uses the workspace path (not basename) when updating .gitignore", async () => {
        const dir = await makeTempDir();
        const cwd = process.cwd();
        try {
            process.chdir(dir);
            await runSetup({ workspace: ".ai_custom/work", force: false, gitignoreMode: "add" });

            const gi = await readIfExists(path.join(dir, ".gitignore"));
            expect(gi).not.toBeNull();
            expect(gi!).toContain(".ai_custom/work/");
        } finally {
            process.chdir(cwd);
        }
    });

    it("creates '# AI' section header when adding entry", async () => {
        const dir = await makeTempDir();
        const cwd = process.cwd();
        try {
            process.chdir(dir);
            await runSetup({ workspace: ".ai", force: false, gitignoreMode: "add" });

            const gi = await readIfExists(path.join(dir, ".gitignore"));
            expect(gi).not.toBeNull();
            expect(gi!).toContain("# AI");
            expect(gi!).toContain(".ai/");

            // Verify the entry is under the "# AI" section
            const lines = gi!.split(/\r?\n/);
            const aiSectionIndex = lines.findIndex((l) => l.trim() === "# AI");
            expect(aiSectionIndex).not.toBe(-1);
            const entryIndex = lines.findIndex((l) => l.trim() === ".ai/");
            expect(entryIndex).not.toBe(-1);
            expect(entryIndex).toBeGreaterThan(aiSectionIndex);
        } finally {
            process.chdir(cwd);
        }
    });

    it("adds entry to existing '# AI' section if section already exists", async () => {
        const dir = await makeTempDir();
        const cwd = process.cwd();
        try {
            process.chdir(dir);
            // Create .gitignore with "# AI" section but without .ai/ entry
            await fs.writeFile(path.join(dir, ".gitignore"), "# Dependencies\nnode_modules/\n\n# AI\n# Some other entry\n", "utf8");

            await runSetup({ workspace: ".ai", force: false, gitignoreMode: "add" });

            const gi = await readIfExists(path.join(dir, ".gitignore"));
            expect(gi).not.toBeNull();
            expect(gi!).toContain("# AI");
            expect(gi!).toContain(".ai/");

            // Verify .ai/ is in the "# AI" section
            const lines = gi!.split(/\r?\n/);
            const aiSectionIndex = lines.findIndex((l) => l.trim() === "# AI");
            const entryIndex = lines.findIndex((l) => l.trim() === ".ai/");
            expect(entryIndex).toBeGreaterThan(aiSectionIndex);
        } finally {
            process.chdir(cwd);
        }
    });

    it("moves entry to '# AI' section if entry exists elsewhere", async () => {
        const dir = await makeTempDir();
        const cwd = process.cwd();
        try {
            process.chdir(dir);
            // Create .gitignore with .ai/ in a different section
            await fs.writeFile(path.join(dir, ".gitignore"), "# Dependencies\nnode_modules/\n.ai/\n\n# AI\n", "utf8");

            await runSetup({ workspace: ".ai", force: false, gitignoreMode: "add" });

            const gi = await readIfExists(path.join(dir, ".gitignore"));
            expect(gi).not.toBeNull();

            // Verify .ai/ is now in the "# AI" section and not in Dependencies
            const lines = gi!.split(/\r?\n/);
            const aiSectionIndex = lines.findIndex((l) => l.trim() === "# AI");
            const entryIndex = lines.findIndex((l) => l.trim() === ".ai/");
            expect(entryIndex).toBeGreaterThan(aiSectionIndex);

            // Verify it's not in the Dependencies section
            const depsSectionIndex = lines.findIndex((l) => l.trim() === "# Dependencies");
            expect(entryIndex).toBeGreaterThan(depsSectionIndex + 2); // Should be after Dependencies section
        } finally {
            process.chdir(cwd);
        }
    });

    it("does not duplicate entry if already in '# AI' section", async () => {
        const dir = await makeTempDir();
        const cwd = process.cwd();
        try {
            process.chdir(dir);
            // Create .gitignore with .ai/ already in "# AI" section
            await fs.writeFile(path.join(dir, ".gitignore"), "# Dependencies\nnode_modules/\n\n# AI\n.ai/\n", "utf8");

            await runSetup({ workspace: ".ai", force: false, gitignoreMode: "add" });

            const gi = await readIfExists(path.join(dir, ".gitignore"));
            expect(gi).not.toBeNull();

            // Verify .ai/ appears only once
            const lines = gi!.split(/\r?\n/);
            const entryMatches = lines.filter((l) => l.trim() === ".ai/");
            expect(entryMatches.length).toBe(1);
        } finally {
            process.chdir(cwd);
        }
    });
});
