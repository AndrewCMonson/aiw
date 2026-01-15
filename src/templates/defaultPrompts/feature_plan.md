# Feature planning (senior) → write .ai/context/feature*plans/YYYY-MM-DD_HHMMSS*<id>\_<descriptor>.md

## Operating rules (critical)

- PLAN FIRST: produce a step-by-step plan before running commands or editing files.
- STOP AFTER PLAN: wait for my explicit approval before executing.
- Safety: do not request or expose secrets; never paste env var values; redact tokens/keys.

## What I will provide after pasting this

- Feature description + goals
- Non-goals
- Constraints (time/tech/compat)
- Acceptance criteria

## Your task

Act as a senior engineer and produce a clear implementation plan. If anything is ambiguous, ask focused clarifying questions first.

## Working style (adds clarity)

- Be outcome-driven: tie decisions directly to goals + acceptance criteria.
- Minimize risk: prefer smallest viable change that still meets requirements.
- Be explicit: list exact file paths and concrete edits (what + why).
- Keep options grounded: alternatives must be plausible in this repo's likely architecture.
- Make unknowns visible: if something can't be confirmed quickly, surface it as an assumption.

## Plan output requirements

Your plan must include:

- Recommended approach (and 1–2 alternatives if relevant)
- File-by-file change list (paths, what changes, why)
- Data/API changes (schemas, contracts, migrations)
- UX/behavior notes (if applicable)
- Risk list + mitigations
- Test plan (unit/integration/e2e as applicable)
- Rollout plan (flags, migration sequencing, monitoring)

## File naming (required)

Before writing the artifact, you MUST:

1. Extract the current git branch: run `git rev-parse --abbrev-ref HEAD`
2. Sanitize the branch name:
    - Replace slashes with hyphens (keep underscores as-is)
    - Keep original case (do not convert to lowercase)
    - Keep all prefixes (feature/, bugfix/, fix/, bug/, hotfix/, etc.)
3. Generate a descriptor:
    - Extract key words from feature description (e.g., "user authentication", "oauth integration")
    - Combine sanitized branch name with feature description keywords
    - Format: `branch-name_key-descriptor` (or just `branch-name` if sufficient)
    - Limit to ~50 characters total
    - Use only alphanumeric, hyphens, and underscores
    - Replace spaces with hyphens
    - Remove special characters except hyphens and underscores
    - Examples:
        - Branch: `feature/user-auth` + Feature: "OAuth integration" → `feature-user-auth_oauth-integration`
        - Branch: `feature/PaymentFlow` → `feature-PaymentFlow` (if branch name is sufficient, preserves case)
4. Generate a unique ID: 6-8 character lowercase alphanumeric hash
    - Method: Run `date +%s%N | sha256sum | head -c 8` (Unix/Linux/macOS) or equivalent
    - Or: Use first 8 characters of SHA-256 hash of `$(date +%s%N)_${descriptor}_${RANDOM}`
    - Or: Generate using `uuidgen | tr -d '-' | head -c 8` (if available)
    - Fallback: Use first 8 alphanumeric characters from `openssl rand -hex 4`
5. Get current timestamp: `YYYY-MM-DD_HHMMSS` format (24-hour format)
    - Example: `2024-01-15_143022` (2:30:22 PM on Jan 15, 2024)
6. Construct filename: `YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md`
7. If branch extraction fails (no git repo, detached HEAD, empty or "HEAD" branch name):
    - Use descriptor from conversation context only
    - Still generate unique ID and timestamp
    - Filename format: `YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md` (without branch prefix)
    - Log a note in the artifact file if branch extraction was skipped

## Artifact output (required)

Write to `.ai/context/feature_plans/YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md` with a structured plan and checklist.

## Artifact template (use this structure verbatim)

### 1. Summary

- **Feature:** (one sentence)
- **Goals:** (bullets)
- **Non-goals:** (bullets)
- **Constraints:** (bullets)
- **Acceptance criteria:** (bullets)

### 2. Recommended approach

- High-level approach (how we'll implement)
- Key design choices and rationale
- Assumptions (explicit)

### 3. Alternatives considered (1–2)

1. Alternative — pros/cons — why not chosen
2. Alternative — pros/cons — why not chosen

### 4. File-by-file change list

> Each entry must include: **path → change → why**

- `path/to/file.ext`
    - Change:
    - Why:
    - Notes (optional):
- ...

### 5. Data / API changes

- **Data model / schema:** (what changes)
- **Migrations:** (steps + sequencing)
- **API / contracts:** (endpoints/events/types, backwards compatibility)
- **Compatibility notes:** (clients, versions, fallbacks)

### 6. UX / behavior notes (if applicable)

- User-facing flows
- Edge cases + empty states
- Error handling and messages
- Accessibility / performance notes (if relevant)

### 7. Risks & mitigations

- Risk:
    - Impact:
    - Mitigation:

### 8. Test plan

- **Unit tests:** what + where
- **Integration tests:** what + where
- **E2E tests:** what + where
- **Manual QA checklist:** steps to verify
- **Test commands:** (exact commands)

### 9. Rollout plan

- Feature flags (if any)
- Migration sequencing (if any)
- Backward compatibility strategy
- Monitoring/alerting signals to watch
- Rollback plan

### 10. Implementation checklist

- [ ] Clarify open questions / confirm assumptions
- [ ] Update types/schemas/contracts
- [ ] Implement core logic
- [ ] Wire up UI/handlers (if applicable)
- [ ] Add/adjust tests
- [ ] Update docs/README (if needed)
- [ ] Verify acceptance criteria
- [ ] Roll out safely

## Plan-first response format

1. Clarifying questions (if needed)
2. Plan (steps and file-by-file)
3. STOP and ask for approval
