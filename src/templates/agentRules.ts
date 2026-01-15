/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load markdown templates at module initialization
const AGENTS_MD = readFileSync(path.join(__dirname, "agentRules", "agents.md"), "utf8");
const CLAUDE_MD = readFileSync(path.join(__dirname, "agentRules", "claude.md"), "utf8");
const CURSOR_CORE_MDC = readFileSync(path.join(__dirname, "agentRules", "cursor-core.mdc"), "utf8");
const CURSOR_FRONTEND_MDC = readFileSync(path.join(__dirname, "agentRules", "cursor-frontend.mdc"), "utf8");
const CURSOR_BACKEND_MDC = readFileSync(path.join(__dirname, "agentRules", "cursor-backend.mdc"), "utf8");

/**
 * Simple template replacement function.
 * @param template
 * @param vars
 */
function replaceTemplateVars(template: string, vars: Record<string, string>): string {
    return template.replace(/\$\{(\w+)\}/g, (_, key) => vars[key] ?? `\${${key}}`);
}

/**
 * Get the content for AGENTS.md (generic agent instructions).
 *
 * @param projectContextPath - Path to PROJECT_CONTEXT.md (default: "docs/PROJECT_CONTEXT.md")
 * @param repoContextPath - Path to REPO_CONTEXT.md (default: ".ai/context/repo_context/REPO_CONTEXT.md")
 * @returns AGENTS.md content
 */
export function getAgentsMdContent(
    projectContextPath: string = "docs/PROJECT_CONTEXT.md",
    repoContextPath: string = ".ai/context/repo_context/REPO_CONTEXT.md",
): string {
    return replaceTemplateVars(AGENTS_MD, { projectContextPath, repoContextPath });
}

/**
 * Get the content for CLAUDE.md (Claude-specific instructions).
 *
 * @param projectContextPath - Path to PROJECT_CONTEXT.md (default: "docs/PROJECT_CONTEXT.md")
 * @param repoContextPath - Path to REPO_CONTEXT.md (default: ".ai/context/repo_context/REPO_CONTEXT.md")
 * @returns CLAUDE.md content
 */
export function getClaudeMdContent(
    projectContextPath: string = "docs/PROJECT_CONTEXT.md",
    repoContextPath: string = ".ai/context/repo_context/REPO_CONTEXT.md",
): string {
    return replaceTemplateVars(CLAUDE_MD, { projectContextPath, repoContextPath });
}

/**
 * Get the content for .cursor/rules/00-core.mdc (always-apply core rules).
 *
 * @param projectContextPath - Path to PROJECT_CONTEXT.md (default: "docs/PROJECT_CONTEXT.md")
 * @param repoContextPath - Path to REPO_CONTEXT.md (default: ".ai/context/repo_context/REPO_CONTEXT.md")
 * @returns 00-core.mdc content
 */
export function getCursorCoreRulesContent(
    projectContextPath: string = "docs/PROJECT_CONTEXT.md",
    repoContextPath: string = ".ai/context/repo_context/REPO_CONTEXT.md",
): string {
    return replaceTemplateVars(CURSOR_CORE_MDC, { projectContextPath, repoContextPath });
}

/**
 * Get the content for .cursor/rules/10-frontend.mdc (frontend-scoped rules).
 *
 * @returns 10-frontend.mdc content
 */
export function getCursorFrontendRulesContent(): string {
    return CURSOR_FRONTEND_MDC;
}

/**
 * Get the content for .cursor/rules/20-backend.mdc (backend-scoped rules).
 *
 * @returns 20-backend.mdc content
 */
export function getCursorBackendRulesContent(): string {
    return CURSOR_BACKEND_MDC;
}

/**
 * Agent rule file definitions for scaffolding.
 */
export type AgentRuleFile = {
    path: string; // Relative to repo root
    content: string;
};

/**
 * Get all agent rule files to scaffold.
 *
 * @param projectContextPath - Path to PROJECT_CONTEXT.md (default: "docs/PROJECT_CONTEXT.md")
 * @param repoContextPath - Path to REPO_CONTEXT.md (default: ".ai/context/repo_context/REPO_CONTEXT.md")
 * @returns Array of rule file definitions
 */
export function getAgentRuleFiles(
    projectContextPath: string = "docs/PROJECT_CONTEXT.md",
    repoContextPath: string = ".ai/context/repo_context/REPO_CONTEXT.md",
): AgentRuleFile[] {
    return [
        {
            path: "AGENTS.md",
            content: getAgentsMdContent(projectContextPath, repoContextPath),
        },
        {
            path: "CLAUDE.md",
            content: getClaudeMdContent(projectContextPath, repoContextPath),
        },
        {
            path: ".cursor/rules/00-core.mdc",
            content: getCursorCoreRulesContent(projectContextPath, repoContextPath),
        },
        {
            path: ".cursor/rules/10-frontend.mdc",
            content: getCursorFrontendRulesContent(),
        },
        {
            path: ".cursor/rules/20-backend.mdc",
            content: getCursorBackendRulesContent(),
        },
    ];
}
