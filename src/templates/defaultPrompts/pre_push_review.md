# Pre-push review → write .ai/context/pr*reviews/YYYY-MM-DD_HHMMSS*<id>\_<descriptor>.md

## Operating rules (critical)

- PLAN FIRST: produce a step-by-step plan before running commands or editing files.
- STOP AFTER PLAN: wait for my explicit approval before executing.
- Safety: do not request or expose secrets; never paste env var values; redact tokens/keys.

## What I will provide after pasting this

- Branch name
- What I changed / intent
- Any areas I'm worried about

## Your task

Review my local changes as if preparing them for **human PR review**, focusing on correctness, design decisions, and production risk.  
Your goal is to surface issues, tradeoffs, and questions a senior engineer would raise before approving a push.

## Artifact header (required, verbatim)

The generated file MUST begin with the following header, exactly as written,
with placeholders filled in. Do not modify wording.

# Pre-Push Review (Self-Review Declaration)

**Branch:** <branch-name or unknown>  
**Generated:** <YYYY-MM-DD HH:MM:SS local>
**Head SHA:** <git rev-parse HEAD>
**Purpose:** Self-review of changes before pushing for external review.  
**Scope:** Only changes included in this branch/diff.  
**Not scope:** Full repo audit, speculative refactors, dependency research.  
**Declaration:** I have reviewed these changes for correctness, maintainability, and risk before pushing.

Populate `Head SHA` by running `git rev-parse HEAD` (or equivalent) and writing the exact commit SHA.

## Review checklist (use as structure and intent)

Use the following sections exactly. Each section must reflect **senior-level judgment**, not generic feedback.

### Summary

- What **decision** this change makes (not just what changed)
- Why this approach was chosen over obvious alternatives
- Overall risk level (low / medium / high) with a one-sentence justification

### Correctness & Failure Modes

- How this could fail at runtime (inputs, state, partial failure, concurrency)
- Whether failures are detectable, recoverable, and clearly surfaced
- Any invariants or assumptions that must hold for this to be safe

### API / Contract Impact

- Who depends on this behavior (internal callers, external clients, jobs, infra)
- Whether changes are backward compatible and why
- Any versioning, migration, or rollout concerns

### Security & Privacy

- New trust boundaries or privilege assumptions introduced
- User-controlled inputs and how they are validated or constrained
- Risk of sensitive data exposure (logs, errors, metrics)

### Performance & Scalability

- Whether this runs on a hot path or user-facing flow
- Worst-case behavior and whether it is bounded
- New work introduced that could grow with usage or data size

### Maintainability & Clarity

- Whether the intent of this change will be obvious to a future reader
- Complexity that lacks explanation or justification
- Opportunities to reduce coupling or duplication (only if material)

### Tests & Validation

- What behaviors are actually validated by tests
- Important cases that remain untested and why
- Risk of flakiness or false confidence

### Release Readiness

- Required migrations, flags, or sequencing concerns
- Rollback or mitigation strategy if issues appear
- Whether observability exists for expected failure modes

### Reviewer Questions

- Questions a senior reviewer is likely to ask about this change
- Areas where the author should be prepared to justify decisions

## File naming (required)

Before writing the artifact, you MUST:

1. Extract branch name (if not provided by user):
    - Optionally run `git rev-parse --abbrev-ref HEAD` to get current branch
    - Use user-provided branch name if available (prioritize this)
2. Sanitize the branch name:
    - Replace slashes with hyphens (keep underscores as-is)
    - Keep original case (do not convert to lowercase)
    - Keep all prefixes (feature/, bugfix/, fix/, bug/, hotfix/, etc.)
3. Generate a descriptor:
    - Use branch name if provided, or extract from conversation context (change summary)
    - Format: `branch-name` or `change-summary` or `branch-name_change-summary`
    - Limit to ~50 characters total
    - Use only alphanumeric, hyphens, and underscores
    - Replace spaces with hyphens
    - Remove special characters except hyphens and underscores
4. Generate a unique ID: 6–8 character lowercase alphanumeric hash
    - Method: Run `date +%s%N | sha256sum | head -c 8` or equivalent
    - Or: Use first 8 characters of SHA-256 hash of `$(date +%s%N)_${descriptor}_${RANDOM}`
    - Or: Use `uuidgen | tr -d '-' | head -c 8`
    - Fallback: Use first 8 alphanumeric characters from `openssl rand -hex 4`
5. Get current timestamp: `YYYY-MM-DD_HHMMSS` format (24-hour)
6. Construct filename: `YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md`
7. If branch extraction fails:
    - Use descriptor from conversation context only
    - Still generate unique ID and timestamp
    - Log a note in the artifact file if branch extraction was skipped

## Artifact output (required)

Write to `.ai/context/pr_reviews/YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md` with:

0. Artifact header (verbatim, required)
1. Summary
2. Findings (bullets, prioritized by risk)
3. Suggested diffs/changes (only if necessary)
4. Pre-push checklist (tickable)
5. Follow-ups (nice-to-haves)

## Receipt file (required)

After writing the review artifact, you MUST also create a receipt file at `.aiw/receipts/pre_push_review/<HEAD_SHA>.md`.

1. Get the HEAD SHA by running `git rev-parse HEAD`
2. Create the directory `.aiw/receipts/pre_push_review/` if it doesn't exist
3. Write the receipt file with the following format:

```markdown
# AIW Pre-Push Review Receipt

- Head SHA: <HEAD_SHA>
- Branch: <branch-name or unknown>
- Generated: <YYYY-MM-DD HH:MM:SS>
- Local artifact: .ai/context/pr*reviews/YYYY-MM-DD_HHMMSS*<id>\_<descriptor>.md
- Risk: <low|medium|high|(not found)>
```

Where:

- `Head SHA`: The exact output of `git rev-parse HEAD`
- `Branch`: The current branch name (from `git rev-parse --abbrev-ref HEAD` or user-provided)
- `Generated`: Current timestamp in `YYYY-MM-DD HH:MM:SS` format
- `Local artifact`: The relative path to the review file you just created
- `Risk`: Extract from the review artifact's Summary section (look for "risk level" or similar), or "(not found)" if not found

**Important**: Both files (review artifact and receipt) must be created for the session to auto-exit.

## Plan-first response format

1. Plan (how you will inspect changes and what you will write)
2. STOP and ask for approval
