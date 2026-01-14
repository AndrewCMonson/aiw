/**
 * @copyright Copyright © 2025 Andrew Monson. All rights reserved.
 * @author    Andrew Monson <andrew.monson@elevate-digital.com>
 */

export type DefaultPrompt = {
    slug: string;
    filename: string;
    contents: string;
};

export const DEFAULT_PROMPTS: DefaultPrompt[] = [
    {
        slug: "repo_discover",
        filename: "repo_discover.md",
        contents: `# Repo discovery → write \`.ai/context/REPO_CONTEXT.md\`

**Goal:** Perform repo discovery and write/update a durable context artifact at \`.ai/context/REPO_CONTEXT.md\` that future AI work can rely on.

---

## Operating rules (non-negotiable)
- **PLAN FIRST:** Provide a step-by-step plan *before* running commands or editing files.
- **STOP AFTER PLAN:** Do not execute anything until I explicitly approve.
- **No secrets:** Never request, reveal, or print secrets. Don't display env var values. Redact tokens/keys if encountered.
- **Repo-local only:** Use only the repository contents. Do not browse the web unless explicitly asked.
- **Be explicit:** Prefer exact commands, file paths, and evidence-based claims (e.g. "based on \`package.json\`", "based on \`Makefile\`").

---

## Task
1. Inspect the repository to understand:
   - What it is and who it serves
   - How it runs (local development)
   - How it's tested, built, and linted
   - Architecture and major boundaries
   - Deployment and release shape
   - Risk areas / footguns

2. Write or update a durable context artifact at: .ai/context/REPO_CONTEXT.md

---

## Discovery checklist (scan in this order)
When approved, scan the repo in this order and capture notes:

1. **Root**
   - \`README*\`, \`LICENSE\`, \`CONTRIBUTING\`, \`CODEOWNERS\`
   - \`Makefile\`, \`Taskfile\`, \`justfile\`

2. **Package / build manifests** (as applicable)
   - \`package.json\`, \`pyproject.toml\`, \`requirements.txt\`
   - \`go.mod\`, \`Cargo.toml\`, \`pom.xml\`, \`build.gradle\`, etc.

3. **Scripts & tooling**
   - \`scripts/\`, \`bin/\`, \`tools/\`
   - CI: \`.github/\`, \`.gitlab-ci.yml\`, etc.

4. **Configuration**
   - \`.env.example\`, \`.env.sample\`
   - \`config/\`, \`.tool-versions\`
   - \`docker-compose*\`, \`helm/\`, \`terraform/\`, \`pulumi/\`

5. **Entrypoints**
   - \`src/main*\`, \`server.*\`
   - \`cmd/\`, \`apps/\`, \`services/\`, \`cli/\`

6. **Tests**
   - \`test/\`, \`tests/\`, \`__tests__/\`, \`e2e/\`
   - Test runner config

7. **Database & migrations**
   - \`prisma/\`, \`migrations/\`, schema files

8. **Docs**
   - \`docs/\`, ADRs, architecture notes

---

## Output file format (required)

Write or update \`.ai/context/REPO_CONTEXT.md\` using **exactly** the structure below.

> Include **evidence tags** for key claims where possible  
> (e.g. \`Evidence: package.json\`, \`Evidence: docker-compose.yml\`)

Add a line at the top: Last Updated: YYYY-MM-DD

### 1. Repo overview
- What this repo is
- Primary use-case(s)
- Key users or stakeholders (if discoverable)

### 2. Quickstart (local dev)
- Prerequisites (tool names only)
- Setup steps
- Run commands
- Basic smoke check ("it works when…")

### 3. Commands cheat sheet
- Development
- Testing
- Linting / formatting
- Build / typecheck (as applicable)

### 4. Key directories & ownership
- Bullet list in the form:
  - \`path/\` — purpose — notable files  
    - Evidence: \`<file or folder>\`

### 5. Architecture
- Major components / services
- Boundaries and responsibilities
- Data flow
- Include a simple diagram if helpful (Mermaid preferred)

### 6. Configuration
- Expected environment variables (names only)
- Where configuration is loaded from
- Key config files and their roles

### 7. Testing
- Test types present (unit / integration / e2e)
- How tests run locally
- How tests run in CI
- Known slow, flaky, or risky areas (if visible)

### 8. Build & release
- Build outputs and artifacts
- Versioning approach (if present)
- Release or deployment flow (high level)

### 9. Risk register
- Footguns
- Sharp edges
- Migration or refactor risks
- "Don't do X because Y"

### 10. Open questions / assumptions
- Unknowns
- Assumptions made during discovery
- Items needing confirmation

---

## Plan-first response format (required)

Respond with **only**:

1. **Plan**
   - Commands you intend to run
   - Files and directories you'll inspect
   - How you'll populate each section of the context file

2. **STOP**
   - Ask for explicit approval to execute
`,
    },
    {
        slug: "repo_refresh",
        filename: "repo_refresh.md",
        contents: `# Repo refresh → update .ai/context/REPO_CONTEXT.md (with deltas)

**Goal:** Refresh \`.ai/context/REPO_CONTEXT.md\` to match the current repo state, and clearly capture *what changed* since the last update.

---

## Operating rules (critical)
- PLAN FIRST: produce a step-by-step plan before running commands or editing files.
- STOP AFTER PLAN: wait for my explicit approval before executing.
- Safety: do not request or expose secrets; never paste env var values; redact tokens/keys.
- Repo-local only: use only the repository contents; do not browse the web unless explicitly asked.
- Be explicit: prefer exact commands, file paths, and evidence-based claims (e.g. "based on \`package.json\`", "based on \`.github/workflows/ci.yml\`").

---

## Your task
1. Read the current \`.ai/context/REPO_CONTEXT.md\` and note its **Last updated** date (or infer "last refresh" from the newest delta section if present).
2. Inspect the repo to determine what has changed since that date.
3. Update \`.ai/context/REPO_CONTEXT.md\` so it is accurate **and** includes a concise delta section at the top.

---

## How to determine deltas (guidance)
When approved, prioritize changes that affect how engineers work in this repo:

- **Git history since last update**
  - \`git log --since="<Last updated date>" --oneline\`
  - Major merges, refactors, new subsystems, dependency upgrades

- **Dependency / toolchain changes**
  - \`package.json\`, lockfiles, \`pyproject.toml\`, \`go.mod\`, etc.

- **Entry points / runtime**
  - New/changed apps, services, CLIs, scripts, Docker compose

- **CI/CD and deployment**
  - Workflow changes in \`.github/\`, pipeline configs, infra code

- **Tests**
  - New test suites, runners, e2e additions, updated commands

- **Config surface**
  - \`.env.example\` changes, config files, new required variables (names only)

---

## Artifact output (required)

Update \`.ai/context/REPO_CONTEXT.md\` and add/refresh a top section:

### What changed since last refresh (YYYY-MM-DD → YYYY-MM-DD)
- Change 1 (with evidence)
- Change 2 (with evidence)

**Rules for this section:**
- The first date is the prior **Last updated** date (or the prior refresh date you can infer).
- The second date is **today**.
- Each bullet must be:
  - **User-impactful** (new commands, new components, new risks), not noisy churn
  - Backed by an **evidence tag** (file path, directory, or git commit)

Then update the rest of the document as needed to stay accurate.

---

## Evidence + freshness requirements
- Add or preserve: \`Last updated: YYYY-MM-DD\` at the top of the file.
- For key claims, include evidence tags like:
  - \`Evidence: package.json\`
  - \`Evidence: .github/workflows/ci.yml\`
  - \`Evidence: git log <hash>\`
- If something can't be verified quickly, record it under **Open questions / assumptions**.

---

## Plan-first response format
Respond with **only**:
1. Plan (what you will inspect, and how you will update the artifact)
2. STOP and ask for approval
`,
    },
    {
        slug: "pre_push_review",
        filename: "pre_push_review.md",
        contents: `# Pre-push review → write .ai/context/pr_reviews/YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md

## Operating rules (critical)
- PLAN FIRST: produce a step-by-step plan before running commands or editing files.
- STOP AFTER PLAN: wait for my explicit approval before executing.
- Safety: do not request or expose secrets; never paste env var values; redact tokens/keys.

## What I will provide after pasting this
- Branch name
- What I changed / intent
- Any areas I'm worried about

## Your task
Review my local changes for correctness, code quality, redundancy, and production readiness. Provide actionable feedback and a short checklist of what to do before pushing.

## Review checklist (use as structure)
- Summary: what changed, why, and risk level (low/med/high)
- Correctness: edge cases, error handling, invariants
- API/contracts: backwards compatibility, schema changes, versioning impact
- Security & privacy: injection risks, authz/authn, sensitive logging
- Performance: hot paths, N+1, unnecessary work
- Maintainability: duplication, naming, comments, readability
- Tests: gaps, flaky risks, missing cases
- Release readiness: migrations, feature flags, rollback plan, observability

## File naming (required)
Before writing the artifact, you MUST:
1. Extract branch name (if not provided by user):
   - Optionally run \`git rev-parse --abbrev-ref HEAD\` to get current branch
   - Use user-provided branch name if available (prioritize this)
2. Sanitize the branch name:
   - Replace slashes with hyphens (keep underscores as-is)
   - Keep original case (do not convert to lowercase)
   - Keep all prefixes (feature/, bugfix/, fix/, bug/, hotfix/, etc.)
3. Generate a descriptor:
   - Use branch name if provided, or extract from conversation context (change summary)
   - Format: \`branch-name\` or \`change-summary\` or \`branch-name_change-summary\`
   - Limit to ~50 characters total
   - Use only alphanumeric, hyphens, and underscores
   - Replace spaces with hyphens
   - Remove special characters except hyphens and underscores
4. Generate a unique ID: 6-8 character lowercase alphanumeric hash
   - Method: Run \`date +%s%N | sha256sum | head -c 8\` (Unix/Linux/macOS) or equivalent
   - Or: Use first 8 characters of SHA-256 hash of \`$(date +%s%N)_\${descriptor}_\${RANDOM}\`
   - Or: Generate using \`uuidgen | tr -d '-' | head -c 8\` (if available)
   - Fallback: Use first 8 alphanumeric characters from \`openssl rand -hex 4\`
5. Get current timestamp: \`YYYY-MM-DD_HHMMSS\` format (24-hour format)
   - Example: \`2024-01-15_143022\` (2:30:22 PM on Jan 15, 2024)
6. Construct filename: \`YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md\`
7. If branch extraction fails (no git repo, detached HEAD, etc.):
   - Use descriptor from conversation context only
   - Still generate unique ID and timestamp
   - Filename format: \`YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md\` (without branch prefix)
   - Log a note in the artifact file if branch extraction was skipped

## Artifact output (required)
Write to \`.ai/context/pr_reviews/YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md\` with:
1. Summary + risk
2. Findings (bullets, prioritized)
3. Suggested diffs/changes (only if necessary)
4. Pre-push checklist (tickable)
5. Follow-ups (nice-to-haves)

## Plan-first response format
1. Plan (how you will inspect changes and what you will write)
2. STOP and ask for approval
`,
    },
    {
        slug: "feature_plan",
        filename: "feature_plan.md",
        contents: `# Feature planning (senior) → write .ai/context/feature_plans/YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md

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
1. Extract the current git branch: run \`git rev-parse --abbrev-ref HEAD\`
2. Sanitize the branch name:
   - Replace slashes with hyphens (keep underscores as-is)
   - Keep original case (do not convert to lowercase)
   - Keep all prefixes (feature/, bugfix/, fix/, bug/, hotfix/, etc.)
3. Generate a descriptor:
   - Extract key words from feature description (e.g., "user authentication", "oauth integration")
   - Combine sanitized branch name with feature description keywords
   - Format: \`branch-name_key-descriptor\` (or just \`branch-name\` if sufficient)
   - Limit to ~50 characters total
   - Use only alphanumeric, hyphens, and underscores
   - Replace spaces with hyphens
   - Remove special characters except hyphens and underscores
   - Examples:
     - Branch: \`feature/user-auth\` + Feature: "OAuth integration" → \`feature-user-auth_oauth-integration\`
     - Branch: \`feature/PaymentFlow\` → \`feature-PaymentFlow\` (if branch name is sufficient, preserves case)
4. Generate a unique ID: 6-8 character lowercase alphanumeric hash
   - Method: Run \`date +%s%N | sha256sum | head -c 8\` (Unix/Linux/macOS) or equivalent
   - Or: Use first 8 characters of SHA-256 hash of \`$(date +%s%N)_\${descriptor}_\${RANDOM}\`
   - Or: Generate using \`uuidgen | tr -d '-' | head -c 8\` (if available)
   - Fallback: Use first 8 alphanumeric characters from \`openssl rand -hex 4\`
5. Get current timestamp: \`YYYY-MM-DD_HHMMSS\` format (24-hour format)
   - Example: \`2024-01-15_143022\` (2:30:22 PM on Jan 15, 2024)
6. Construct filename: \`YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md\`
7. If branch extraction fails (no git repo, detached HEAD, empty or "HEAD" branch name):
   - Use descriptor from conversation context only
   - Still generate unique ID and timestamp
   - Filename format: \`YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md\` (without branch prefix)
   - Log a note in the artifact file if branch extraction was skipped

## Artifact output (required)
Write to \`.ai/context/feature_plans/YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md\` with a structured plan and checklist.

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

- \`path/to/file.ext\`
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
`,
    },
    {
        slug: "debug_senior",
        filename: "debug_senior.md",
        contents: `# Debugging assistant (senior) → write .ai/context/debug_notes/YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md

## Operating rules (critical)
- PLAN FIRST: produce a step-by-step plan before running commands or editing files.
- STOP AFTER PLAN: wait for my explicit approval before executing.
- Safety: do not request or expose secrets; never paste env var values; redact tokens/keys.

## What I will provide after pasting this
- Repro steps (or "cannot reproduce")
- Expected vs actual behavior
- Logs/stack traces (redacted)
- Environment notes (versions, OS) (no secret values)

## Your task
Act as a senior debugging partner:
- Form hypotheses (ranked)
- Propose experiments/observations to confirm/deny
- Identify likely root cause
- Provide a fix plan + regression tests

## Working style (adds clarity)
- Be evidence-driven: tie each hypothesis to a concrete signal from the repro/logs/code.
- Minimize guesswork: if something is unknown, propose the fastest check to learn it.
- Prefer smallest viable change: aim for a fix that is narrow, safe, and testable.
- Keep a short feedback loop: propose experiments that take minutes before ones that take hours.
- No rabbit holes: timebox investigative branches; stop when evidence points elsewhere.

## File naming (required)
Before writing the artifact, you MUST:
1. Extract the current git branch: run \`git rev-parse --abbrev-ref HEAD\`
2. Sanitize the branch name:
   - Replace slashes with hyphens (keep underscores as-is)
   - Keep original case (do not convert to lowercase)
   - Keep all prefixes (feature/, bugfix/, fix/, bug/, hotfix/, etc.)
3. Generate a descriptor:
   - Extract brief bug summary from conversation context (e.g., "login error", "null pointer")
   - Combine sanitized branch name with bug summary keywords
   - Format: \`branch-name_key-descriptor\` (or just \`branch-name\` if sufficient)
   - Limit to ~50 characters total
   - Use only alphanumeric, hyphens, and underscores
   - Replace spaces with hyphens
   - Remove special characters except hyphens and underscores
   - Examples:
     - Branch: \`bugfix/login-error\` + Bug: "Null pointer exception" → \`bugfix-login-error_null-pointer\`
     - Branch: \`fix/PaymentBug\` → \`fix-PaymentBug\` (if branch name is sufficient, preserves case)
4. Generate a unique ID: 6-8 character lowercase alphanumeric hash
   - Method: Run \`date +%s%N | sha256sum | head -c 8\` (Unix/Linux/macOS) or equivalent
   - Or: Use first 8 characters of SHA-256 hash of \`$(date +%s%N)_\${descriptor}_\${RANDOM}\`
   - Or: Generate using \`uuidgen | tr -d '-' | head -c 8\` (if available)
   - Fallback: Use first 8 alphanumeric characters from \`openssl rand -hex 4\`
5. Get current timestamp: \`YYYY-MM-DD_HHMMSS\` format (24-hour format)
   - Example: \`2024-01-15_143022\` (2:30:22 PM on Jan 15, 2024)
6. Construct filename: \`YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md\`
7. If branch extraction fails (no git repo, detached HEAD, empty or "HEAD" branch name):
   - Use descriptor from conversation context only
   - Still generate unique ID and timestamp
   - Filename format: \`YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md\` (without branch prefix)
   - Log a note in the artifact file if branch extraction was skipped

## Debugging workflow (how we'll proceed)
1. **Restate the problem** in one sentence (symptom + scope + impact).
2. **Lock repro**: confirm the shortest deterministic repro (or explicitly "cannot reproduce").
3. **Triage signals**: classify logs/trace by layer (client, server, DB, network, build/test).
4. **Generate ranked hypotheses**: 3–7 items, each with:
   - Why it's plausible
   - What would confirm/deny it quickly
5. **Run the smallest experiments first** (minutes, not hours).
6. **Converge on root cause**: declare confidence level (high/medium/low).
7. **Fix plan**: minimal patch + follow-on hardening if needed.
8. **Regression tests**: add/adjust tests to prevent recurrence.
9. **Post-fix verification**: rerun repro + relevant test suite(s).

## Artifact output (required)
Write to \`.ai/context/debug_notes/YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md\` with:
1. Symptom summary
2. Repro notes
3. Hypotheses (ranked)
4. Evidence/experiments
5. Root cause (if known)
6. Fix plan
7. Regression tests

## Artifact template (use this structure verbatim)
> Keep this concise and actionable. Include evidence tags like \`Evidence: <file path>\` or \`Evidence: <log line>\`.

1. **Symptom summary**
   - What is failing, where, and impact

2. **Repro notes**
   - Steps (or "cannot reproduce")
   - Expected vs actual
   - Environment (versions/OS)

3. **Hypotheses (ranked)**
   1. Hypothesis — why — fast check
   2. Hypothesis — why — fast check
   3. ...

4. **Evidence / experiments**
   - Observations collected
   - Experiments run + outcomes
   - Links to relevant files/lines (paths only)

5. **Root cause**
   - Statement of root cause (or "unknown")
   - Confidence: high / medium / low
   - Evidence: ...

6. **Fix plan**
   - Minimal fix (steps + files)
   - Safety checks / rollout considerations (if applicable)

7. **Regression tests**
   - What to add/change (test type + location)
   - Commands to run

## Plan-first response format
1. Plan (what info you'll need and what you'll check)
2. STOP and ask for approval
`,
    },
];
