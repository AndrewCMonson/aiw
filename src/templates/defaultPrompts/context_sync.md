# Context sync → update `docs/PROJECT_CONTEXT.md` from `REPO_CONTEXT.md`

**Goal:** Sync the authoritative project context (`docs/PROJECT_CONTEXT.md`) with meaningful updates from the local working context (`.ai/context/repo_context/REPO_CONTEXT.md`).

---

## Operating rules (critical)

- PLAN FIRST: produce a step-by-step plan before running commands or editing files.
- STOP AFTER PLAN: wait for my explicit approval before executing.
- Safety: do not request or expose secrets; never paste env var values; redact tokens/keys.
- Preserve authority: `docs/PROJECT_CONTEXT.md` is the source of truth—update it carefully.

---

## Context hierarchy (understand this first)

| File                                       | Purpose                                                                                                          | Tracked in git? |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | --------------- |
| `docs/PROJECT_CONTEXT.md`                  | Authoritative project context. How the project is _meant_ to work. Updated via PRs, reviewed by lead developers. | Yes             |
| `.ai/context/repo_context/REPO_CONTEXT.md` | Local working context. Fast to update, may contain session-specific details.                                     | No (gitignored) |

**Rule:** When in conflict, `PROJECT_CONTEXT.md` wins. Only promote changes from `REPO_CONTEXT.md` that are stable, accurate, and impactful.

---

## Your task

1. Read both context files:
    - `docs/PROJECT_CONTEXT.md` (authoritative)
    - `.ai/context/repo_context/REPO_CONTEXT.md` (local working context)
2. Identify meaningful differences—changes that affect how engineers work in this repo.
3. Update `docs/PROJECT_CONTEXT.md` with relevant changes, preserving its authoritative tone.

---

## What to sync (promote these changes)

Sync changes that affect:

- **Setup / build**: Build configuration, dependencies, tooling changes
- **Architecture**: Module boundaries, major component changes, folder structure
- **Workflows**: Development processes, testing approaches, deployment
- **APIs / contracts**: Endpoints, schemas, interfaces, breaking changes
- **Commands**: New or changed dev/test/build commands
- **Risk areas**: New footguns, deprecations, migration notes

---

## What NOT to sync (skip these)

Do NOT promote:

- Session-specific notes or temporary observations
- Unverified assumptions or open questions (keep those in REPO_CONTEXT)
- Verbose details that belong in code comments or separate docs
- Redundant information already captured elsewhere
- Personal preferences or style opinions

---

## Output requirements

Update `docs/PROJECT_CONTEXT.md`:

1. Update the `Last Updated: YYYY-MM-DD` line at the top
2. Integrate changes into the appropriate sections (don't just append)
3. Maintain concise, authoritative tone
4. Include evidence tags where helpful (e.g., `Evidence: package.json`)
5. Remove outdated information that REPO_CONTEXT has corrected

---

## Plan-first response format

Respond with **only**:

1. **Plan**
    - What you found in each file
    - What differences are meaningful
    - What you will update in PROJECT_CONTEXT.md
2. **STOP** and ask for approval
