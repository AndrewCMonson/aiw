/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { makeTempDir } from "./utils/tmpWorkspace.js";
import { getDefaultConfig, loadConfig } from "../src/lib/config.js";

describe("config", () => {
    it("returns default config when .aiw.json doesn't exist", async () => {
        const dir = await makeTempDir();
        const config = await loadConfig(dir);
        const defaults = getDefaultConfig();

        expect(config.impactPatterns.build).toEqual(defaults.impactPatterns.build);
        expect(config.impactPatterns.env).toEqual(defaults.impactPatterns.env);
        expect(config.impactPatterns.api).toEqual(defaults.impactPatterns.api);
        expect(config.impactPatterns.architecture).toEqual(defaults.impactPatterns.architecture);
        expect(config.projectContextPath).toBe(defaults.projectContextPath);
        expect(config.skipToken).toBe(defaults.skipToken);
    });

    it("loads custom config from .aiw.json", async () => {
        const dir = await makeTempDir();
        const configPath = path.join(dir, ".aiw.json");
        const customConfig = {
            impactPatterns: {
                build: ["custom-build.json"],
                env: ["custom-env"],
                api: ["custom-api"],
                architecture: ["custom-arch"],
            },
            projectContextPath: "custom/PROJECT_CONTEXT.md",
            skipToken: "[custom-skip]",
        };

        await fs.writeFile(configPath, JSON.stringify(customConfig), "utf8");

        const config = await loadConfig(dir);

        expect(config.impactPatterns.build).toEqual(["custom-build.json"]);
        expect(config.impactPatterns.env).toEqual(["custom-env"]);
        expect(config.impactPatterns.api).toEqual(["custom-api"]);
        expect(config.impactPatterns.architecture).toEqual(["custom-arch"]);
        expect(config.projectContextPath).toBe("custom/PROJECT_CONTEXT.md");
        expect(config.skipToken).toBe("[custom-skip]");
    });

    it("merges partial config with defaults", async () => {
        const dir = await makeTempDir();
        const configPath = path.join(dir, ".aiw.json");
        const partialConfig = {
            projectContextPath: "docs/CUSTOM_CONTEXT.md",
        };

        await fs.writeFile(configPath, JSON.stringify(partialConfig), "utf8");

        const config = await loadConfig(dir);
        const defaults = getDefaultConfig();

        expect(config.projectContextPath).toBe("docs/CUSTOM_CONTEXT.md");
        expect(config.impactPatterns.build).toEqual(defaults.impactPatterns.build);
        expect(config.skipToken).toBe(defaults.skipToken);
    });

    it("handles invalid JSON gracefully", async () => {
        const dir = await makeTempDir();
        const configPath = path.join(dir, ".aiw.json");

        await fs.writeFile(configPath, "invalid json {", "utf8");

        // Suppress console.warn output during test
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        try {
            // Should not throw, should return defaults
            const config = await loadConfig(dir);
            const defaults = getDefaultConfig();

            expect(config.projectContextPath).toBe(defaults.projectContextPath);
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Warning: Invalid JSON"));
        } finally {
            warnSpy.mockRestore();
        }
    });
});
