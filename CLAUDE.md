# Claude Instructions

Claude, when working in this repository, follow these instructions.

## Required Reading Order

1. Read `docs/PROJECT_CONTEXT.md` first (authoritative project context)
2. Read `.ai/context/repo_context/REPO_CONTEXT.md` second (local operational context)

If there's a conflict between these files, **always defer to the project context** (`docs/PROJECT_CONTEXT.md`).

## Context Updates

When making changes that affect setup, architecture, workflows, or APIs:

- Update `docs/PROJECT_CONTEXT.md` in the same PR as your code changes
- Keep context updates accurate and concise
- If context update is not needed, add `[context-skip]` to your commit message.

## Working Style

- Use project context to understand intended design
- Use local context for current session details
- Prefer project context when information conflicts
- Update project context proactively for impactful changes
