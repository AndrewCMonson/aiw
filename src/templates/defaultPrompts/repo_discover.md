# Repo discovery → write `.ai/context/repo_context/REPO_CONTEXT.md`

**Goal:** Perform repo discovery and write/update a durable context artifact at `.ai/context/repo_context/REPO_CONTEXT.md` that future AI work can rely on.

---

## Operating rules (non-negotiable)

- **PLAN FIRST:** Provide a step-by-step plan _before_ running commands or editing files.
- **STOP AFTER PLAN:** Do not execute anything until I explicitly approve.
- **No secrets:** Never request, reveal, or print secrets. Don't display env var values. Redact tokens/keys if encountered.
- **Repo-local only:** Use only the repository contents. Do not browse the web unless explicitly asked.
- **Be explicit:** Prefer exact commands, file paths, and evidence-based claims (e.g. "based on `package.json`", "based on `Makefile`").

---

## Task

1. Inspect the repository to understand:
    - What it is and who it serves
    - How it runs (local development)
    - How it's tested, built, and linted
    - Architecture and major boundaries
    - Deployment and release shape
    - Risk areas / footguns

2. Write or update a durable context artifact at: .ai/context/repo_context/REPO_CONTEXT.md

---

## Discovery checklist (scan in this order)

When approved, scan the repo in this order and capture notes:

1. **Root**
    - `README*`, `LICENSE`, `CONTRIBUTING`, `CODEOWNERS`
    - `Makefile`, `Taskfile`, `justfile`

2. **Package / build manifests** (as applicable)
    - `package.json`, `pyproject.toml`, `requirements.txt`
    - `go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle`, etc.

3. **Scripts & tooling**
    - `scripts/`, `bin/`, `tools/`
    - CI: `.github/`, `.gitlab-ci.yml`, etc.

4. **Configuration**
    - `.env.example`, `.env.sample`
    - `config/`, `.tool-versions`
    - `docker-compose*`, `helm/`, `terraform/`, `pulumi/`

5. **Entrypoints**
    - `src/main*`, `server.*`
    - `cmd/`, `apps/`, `services/`, `cli/`

6. **Tests**
    - `test/`, `tests/`, `__tests__/`, `e2e/`
    - Test runner config

7. **Database & migrations**
    - `prisma/`, `migrations/`, schema files

8. **Docs**
    - `docs/`, ADRs, architecture notes

---

## Output file format (required)

Write or update `.ai/context/repo_context/REPO_CONTEXT.md` using **exactly** the structure below.

> Include **evidence tags** for key claims where possible  
> (e.g. `Evidence: package.json`, `Evidence: docker-compose.yml`)

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
    - `path/` — purpose — notable files
        - Evidence: `<file or folder>`

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
