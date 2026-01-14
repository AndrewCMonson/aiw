/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

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
    return `# Agent Instructions

This file establishes the behavior contract for AI agents working in this repository.

## Context Reading Order (Required)

Agents **must** read context files in this exact order:

1. **\`${projectContextPath}\`** (authoritative project context)
   - Source of truth for how the project is *meant* to work
   - Updated as part of PRs, finalized by lead developers
   - Tracked in git

2. **\`${repoContextPath}\`** (local operational context)
   - Working memory for current development session
   - Fast to update, gitignored
   - May be out of date; always defer to project context when in conflict

## When to Update Project Context

Update \`${projectContextPath}\` in the same PR when changes affect:

- **Setup**: Build configuration, dependencies, tooling changes
- **Architecture**: Module boundaries, major component changes, folder structure
- **Workflows**: Development processes, testing approaches, deployment
- **APIs / Contracts**: Endpoints, schemas, interfaces, breaking changes

## Context Update Workflow

1. Make your code changes
2. If changes are "impactful" (see above), update \`${projectContextPath}\` in the same branch
3. Commit both together
4. PR review includes context diffs alongside code diffs

**Note**: If you intentionally skip context updates, add \`[context-skip]\` to your commit message.

## Agent Behavior

- Read project context first to understand intended architecture
- Use local context for session-specific details
- When in doubt, prefer project context (it's the source of truth)
- Update project context proactively when making impactful changes
`;
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
    return `# Claude Instructions

Claude, when working in this repository, follow these instructions.

## Required Reading Order

1. Read \`${projectContextPath}\` first (authoritative project context)
2. Read \`${repoContextPath}\` second (local operational context)

If there's a conflict between these files, **always defer to the project context** (\`${projectContextPath}\`).

## Context Updates

When making changes that affect setup, architecture, workflows, or APIs:

- Update \`${projectContextPath}\` in the same PR as your code changes
- Keep context updates accurate and concise
- If context update is not needed, add \`[context-skip]\` to your commit message.

## Working Style

- Use project context to understand intended design
- Use local context for current session details
- Prefer project context when information conflicts
- Update project context proactively for impactful changes
`;
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
    return `# Core Rules (Always Apply)

These rules apply to all Cursor agent interactions in this repository.

## Context Reading (Required, No Exceptions)

**Before starting any task**, read context files in this exact order:

1. **\`${projectContextPath}\`** - Authoritative project context (read first)
2. **\`${repoContextPath}\`** - Local operational context (read second)

**If information conflicts between these files, defer to \`${projectContextPath}\`** (it's the source of truth).

## Context Updates

When your changes affect any of the following, **update \`${projectContextPath}\`** in the same branch:

- Build configuration, dependencies, tooling (\`package.json\`, \`tsconfig.json\`, etc.)
- Architecture, module boundaries, folder structure
- Development workflows, testing approaches
- APIs, schemas, contracts, interfaces

If you intentionally skip a context update, add \`[context-skip]\` to your commit message.

## Stop Conditions

- If \`${projectContextPath}\` doesn't exist, ask the user if it should be created
- If you cannot read required context files, stop and report the issue
- Never proceed without reading project context first

## Working Principles

- Project context = authoritative truth
- Local context = working memory (may be stale)
- Always prefer project context when in conflict
- Update project context proactively for impactful changes
`;
}

/**
 * Get the content for .cursor/rules/10-frontend.mdc (frontend-scoped rules).
 *
 * @returns 10-frontend.mdc content
 */
export function getCursorFrontendRulesContent(): string {
    return `# Frontend Rules

These rules apply when working on frontend code in this repository.

## Scope

This rule file applies to:
- UI components, pages, views
- Client-side state management
- Frontend routing and navigation
- Styling, themes, responsive design
- Browser APIs and client-side JavaScript/TypeScript
- Frontend build tools and bundlers

## Before Starting

1. Read core rules (\`.cursor/rules/00-core.mdc\`) - they always apply
2. Read project context (\`docs/PROJECT_CONTEXT.md\`)
3. Read local context (\`.ai/context/repo_context/REPO_CONTEXT.md\`)

## Frontend-Specific Context Updates

Update \`docs/PROJECT_CONTEXT.md\` when frontend changes affect:
- Component architecture or design system
- State management patterns
- Routing structure
- Build configuration (Vite, Webpack, etc.)
- Frontend dependencies
- API client interfaces

## Notes

- These rules complement (do not replace) core rules
- When working on full-stack features, also consider backend rules
`;
}

/**
 * Get the content for .cursor/rules/20-backend.mdc (backend-scoped rules).
 *
 * @returns 20-backend.mdc content
 */
export function getCursorBackendRulesContent(): string {
    return `# Backend Rules

These rules apply when working on backend code in this repository.

## Scope

This rule file applies to:
- Server-side code, APIs, endpoints
- Database schemas and migrations
- Business logic and services
- Authentication and authorization
- Background jobs, queues, workers
- Infrastructure and deployment configs

## Before Starting

1. Read core rules (\`.cursor/rules/00-core.mdc\`) - they always apply
2. Read project context (\`docs/PROJECT_CONTEXT.md\`)
3. Read local context (\`.ai/context/repo_context/REPO_CONTEXT.md\`)

## Backend-Specific Context Updates

Update \`docs/PROJECT_CONTEXT.md\` when backend changes affect:
- API contracts, endpoints, schemas
- Database schema or migration patterns
- Authentication/authorization flows
- Service architecture or boundaries
- Infrastructure or deployment configuration
- Environment variables or configuration

## Notes

- These rules complement (do not replace) core rules
- When working on full-stack features, also consider frontend rules
`;
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
