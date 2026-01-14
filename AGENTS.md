# Agent Instructions

This file establishes the behavior contract for AI agents working in this repository.

## Context Reading Order (Required)

Agents **must** read context files in this exact order:

1. **`docs/PROJECT_CONTEXT.md`** (authoritative project context)
    - Source of truth for how the project is _meant_ to work
    - Updated as part of PRs, finalized by lead developers
    - Tracked in git

2. **`.ai/context/repo_context/REPO_CONTEXT.md`** (local operational context)
    - Working memory for current development session
    - Fast to update, gitignored
    - May be out of date; always defer to project context when in conflict

## When to Update Project Context

Update `docs/PROJECT_CONTEXT.md` in the same PR when changes affect:

- **Setup**: Build configuration, dependencies, tooling changes
- **Architecture**: Module boundaries, major component changes, folder structure
- **Workflows**: Development processes, testing approaches, deployment
- **APIs / Contracts**: Endpoints, schemas, interfaces, breaking changes

## Context Update Workflow

1. Make your code changes
2. If changes are "impactful" (see above), update `docs/PROJECT_CONTEXT.md` in the same branch
3. Commit both together
4. PR review includes context diffs alongside code diffs

**Note**: If you intentionally skip context updates, add `[context-skip]` to your commit message.

## Agent Behavior

- Read project context first to understand intended architecture
- Use local context for session-specific details
- When in doubt, prefer project context (it's the source of truth)
- Update project context proactively when making impactful changes
