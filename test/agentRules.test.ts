/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import { describe, expect, it } from "vitest";

import {
    getAgentRuleFiles,
    getAgentsMdContent,
    getClaudeMdContent,
    getCursorBackendRulesContent,
    getCursorCoreRulesContent,
    getCursorFrontendRulesContent,
} from "../src/templates/agentRules.js";

describe("agentRules", () => {
    it("generates AGENTS.md content", () => {
        const content = getAgentsMdContent();
        expect(content).toContain("# Agent Instructions");
        expect(content).toContain("docs/PROJECT_CONTEXT.md");
        expect(content).toContain(".ai/context/repo_context/REPO_CONTEXT.md");
    });

    it("generates CLAUDE.md content", () => {
        const content = getClaudeMdContent();
        expect(content).toContain("# Claude Instructions");
        expect(content).toContain("docs/PROJECT_CONTEXT.md");
    });

    it("generates Cursor core rules content", () => {
        const content = getCursorCoreRulesContent();
        expect(content).toContain("# Core Rules (Always Apply)");
        expect(content).toContain("docs/PROJECT_CONTEXT.md");
    });

    it("generates Cursor frontend rules content", () => {
        const content = getCursorFrontendRulesContent();
        expect(content).toContain("# Frontend Rules");
        expect(content).toContain("UI components, pages, views");
    });

    it("generates Cursor backend rules content", () => {
        const content = getCursorBackendRulesContent();
        expect(content).toContain("# Backend Rules");
        expect(content).toContain("Server-side code, APIs, endpoints");
    });

    it("gets all agent rule files", () => {
        const files = getAgentRuleFiles();
        expect(files.length).toBe(5);
        expect(files.some((f) => f.path === "AGENTS.md")).toBe(true);
        expect(files.some((f) => f.path === "CLAUDE.md")).toBe(true);
        expect(files.some((f) => f.path === ".cursor/rules/00-core.mdc")).toBe(true);
        expect(files.some((f) => f.path === ".cursor/rules/10-frontend.mdc")).toBe(true);
        expect(files.some((f) => f.path === ".cursor/rules/20-backend.mdc")).toBe(true);
    });

    it("uses custom paths when provided", () => {
        const content = getAgentsMdContent("custom/PROJECT.md", "custom/REPO.md");
        expect(content).toContain("custom/PROJECT.md");
        expect(content).toContain("custom/REPO.md");
    });
});
