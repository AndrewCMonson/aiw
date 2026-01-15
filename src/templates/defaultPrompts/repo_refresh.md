# Repo refresh → update .ai/context/repo_context/REPO_CONTEXT.md (with deltas)

**Goal:** Refresh `.ai/context/repo_context/REPO_CONTEXT.md` to match the current repo state, and clearly capture _what changed_ since the last update.

---

## Operating rules (critical)

- PLAN FIRST: produce a step-by-step plan before running commands or editing files.
- STOP AFTER PLAN: wait for my explicit approval before executing.
- Safety: do not request or expose secrets; never paste env var values; redact tokens/keys.
- Repo-local only: use only the repository contents; do not browse the web unless explicitly asked.
- Be explicit: prefer exact commands, file paths, and evidence-based claims (e.g. "based on `package.json`", "based on `.github/workflows/ci.yml`").

---

## Your task

1. Read the current `.ai/context/repo_context/REPO_CONTEXT.md` and note its **Last updated** date (or infer "last refresh" from the newest delta section if present).
2. Inspect the repo to determine what has changed since that date.
3. Update `.ai/context/repo_context/REPO_CONTEXT.md` so it is accurate **and** includes a concise delta section at the top.

---

## How to determine deltas (guidance)

When approved, prioritize changes that affect how engineers work in this repo:

- **Git history since last update**
    - `git log --since="<Last updated date>" --oneline`
    - Major merges, refactors, new subsystems, dependency upgrades

- **Dependency / toolchain changes**
    - `package.json`, lockfiles, `pyproject.toml`, `go.mod`, etc.

- **Entry points / runtime**
    - New/changed apps, services, CLIs, scripts, Docker compose

- **CI/CD and deployment**
    - Workflow changes in `.github/`, pipeline configs, infra code

- **Tests**
    - New test suites, runners, e2e additions, updated commands

- **Config surface**
    - `.env.example` changes, config files, new required variables (names only)

---

## Artifact output (required)

Update `.ai/context/repo_context/REPO_CONTEXT.md` and add/refresh a top section:

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

- Add or preserve: `Last updated: YYYY-MM-DD` at the top of the file.
- For key claims, include evidence tags like:
    - `Evidence: package.json`
    - `Evidence: .github/workflows/ci.yml`
    - `Evidence: git log <hash>`
- If something can't be verified quickly, record it under **Open questions / assumptions**.

---

## Plan-first response format

Respond with **only**:

1. Plan (what you will inspect, and how you will update the artifact)
2. STOP and ask for approval
