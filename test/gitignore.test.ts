import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runSetup } from "../src/commands/setup.js";
import { makeTempDir } from "./utils/tmpWorkspace.js";

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
});

