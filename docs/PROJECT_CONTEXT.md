Last Updated: 2026-01-14

# PROJECT_CONTEXT

> **This is the authoritative project context.** This file is tracked in git and updated as part of PRs. It represents how the project is _meant_ to work, as approved by lead developers.
>
> For local operational context (working memory), see `.ai/context/repo_context/REPO_CONTEXT.md`.

---

## 1. Repo overview

**What it is:** `@andrewmonson/aiw` — a small cross-platform CLI that manages a repo-local **prompt library** under `.ai/`. The prompts are meant to be **pasted into Cursor chat manually**; the CLI does not execute prompts itself (except via the experimental `run` command).

**Primary use cases:**

- Scaffold a `.ai/` prompt library in any repository
- List, show, copy, and open prompts
- Create new prompts from templates (blank, repo, review, feature, debug)
- Enforce dual-context governance (`docs/PROJECT_CONTEXT.md` + `.ai/context/repo_context/REPO_CONTEXT.md`)
- Verify that project context is updated when meaningful changes are made

**Key users/stakeholders:**

- Developers using Cursor AI for coding assistance
- Teams wanting structured, repeatable AI prompts for repo discovery, feature planning, debugging, and pre-push reviews

**Evidence:** `package.json`, `README.md`

---

## 2. Quickstart (local dev)

### Prerequisites

- Node.js >= 20 (`engines.node` in package.json)
- npm (package manager)
- Git (for hooks and context verification)

### Setup steps

```bash
# Clone the repo
git clone <repo-url>
cd ai-workflow

# Install dependencies
npm install

# Build the CLI
npm run build

# Run tests to verify setup
npm test
```

### Run commands

```bash
# Run CLI directly (rebuilds first)
npm run dev -- <command>
# Examples:
npm run dev -- setup --gitignore skip
npm run dev -- list
npm run dev -- show repo_discover

# Or link globally for testing
npm run link
aiw setup
aiw list
```

### Smoke check

It works when:

- `npm run dev -- list` outputs prompt slugs
- `npm run dev -- show repo_discover` prints the repo_discover prompt
- `npm test` passes all tests

---

## 3. Commands cheat sheet

### Development

| Command                    | Description                       |
| -------------------------- | --------------------------------- |
| `npm install`              | Install dependencies              |
| `npm run dev -- <command>` | Build and run CLI with arguments  |
| `npm run link`             | Create global symlink for testing |
| `npm run unlink`           | Remove global symlink             |

### Testing

| Command    | Description                |
| ---------- | -------------------------- |
| `npm test` | Run all tests (vitest run) |

### Linting / formatting

| Command            | Description              |
| ------------------ | ------------------------ |
| `npm run lint`     | Run ESLint               |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format`   | Run Prettier             |

### Build / typecheck

| Command             | Description                                                    |
| ------------------- | -------------------------------------------------------------- |
| `npm run build`     | TypeScript compilation (`tsc`)                                 |
| `npm run postbuild` | Add shebang + make executable (runs automatically after build) |

### CLI commands (when installed)

| Command              | Description                                                      |
| -------------------- | ---------------------------------------------------------------- |
| `aiw setup`          | Create `.ai/` structure and default prompts                      |
| `aiw list`           | List available prompts                                           |
| `aiw show <prompt>`  | Print prompt to stdout                                           |
| `aiw copy <prompt>`  | Copy prompt to clipboard                                         |
| `aiw open <prompt>`  | Open prompt in default editor                                    |
| `aiw new <name>`     | Create new prompt from template                                  |
| `aiw run <prompt>`   | Run prompt via Cursor Agent CLI (interactive or non-interactive) |
| `aiw context:verify` | Verify PROJECT_CONTEXT.md is updated                             |

---

## 4. Key directories & ownership

- `src/` — Main source code (TypeScript)
    - `src/cli.ts` — CLI entrypoint (Commander.js program setup)
    - `src/commands/` — CLI command implementations
        - `setup.ts` — Creates workspace structure, scaffolds prompts and agent rules
        - `list.ts` — Lists available prompts
        - `show.ts` — Prints prompt contents
        - `copy.ts` — Copies prompt to clipboard
        - `open.ts` — Opens prompt in editor
        - `new.ts` — Creates new prompt from template
        - `run.ts` — Runs prompt via Cursor Agent CLI
        - `contextVerify.ts` — Verifies PROJECT_CONTEXT.md is updated
    - `src/lib/` — Shared utilities
        - `clipboard.ts` — Cross-platform clipboard support (pbcopy/clip/xclip/xsel/wl-copy)
        - `config.ts` — Load `.aiw.json` config, merge with defaults
        - `cursorAgent.ts` — Cursor Agent CLI wrapper using `node-pty` for cross-platform PTY support, with model validation
        - `cursorCheck.ts` — Checks if Cursor CLI command is available in PATH
        - `fs.ts` — File system helpers (mkdirp, safeWriteFile, readTextFile)
        - `git.ts` — Git operations (isGitRepo, getCommitsInRange, getChangedFiles, etc.)
        - `hooks.ts` — Git hook installation/uninstallation
        - `opener.ts` — Cross-platform file opener (open/start/xdg-open)
        - `paths.ts` — Workspace path resolution
        - `slug.ts` — Slugify and title-case utilities
    - `src/templates/` — Default prompts and scaffolding
        - `agentRules.ts` — AGENTS.md, CLAUDE.md, .cursor/rules/ content generators
        - `defaultPrompts.ts` — Default prompt templates (repo_discover, repo_refresh, pre_push_review, feature_plan, debug_senior, context_sync)
        - `projectContext.ts` — PROJECT_CONTEXT.md content generator
        - `scaffolds.ts` — Prompt scaffold templates by type
    - Evidence: `src/` directory listing

- `test/` — Test files (Vitest)
    - Unit tests for commands, lib modules
    - `test/utils/tmpWorkspace.ts` — Test helper for temp directories
    - Evidence: `test/` directory listing

- `scripts/` — Build and utility scripts
    - `postbuild.mjs` — Adds shebang to dist/cli.js, sets executable
    - `fix-pty-permissions.mjs` — Postinstall script to fix node-pty spawn-helper permissions on macOS
    - `pre-push-context-check.sh` — Bash script for context enforcement (used by hook)
    - Evidence: `scripts/` directory listing

- `.github/workflows/` — CI configuration
    - `project-context.yaml` — GitHub Actions workflow for PR context enforcement
    - Evidence: `.github/workflows/project-context.yaml`

- `.husky/` — Git hooks (managed by Husky)
    - `pre-commit` — Runs lint-staged
    - `commit-msg` — Validates commit message format
    - `pre-push` — Branch naming, linting, context verification
    - Evidence: `.husky/` directory listing

- `docs/` — Documentation
    - `PROJECT_CONTEXT.md` — Authoritative project context (tracked in git)
    - Evidence: `docs/` directory listing

- `dist/` — Build output (gitignored)
    - `cli.js` — Compiled CLI entrypoint
    - Evidence: `package.json` ("outDir": "dist")

---

## 5. Architecture

### Major components

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLI (src/cli.ts)                       │
│                     Commander.js program setup                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Commands    │   │     Lib       │   │   Templates   │
│  (src/cmd/)   │   │  (src/lib/)   │   │(src/templates)│
├───────────────┤   ├───────────────┤   ├───────────────┤
│ setup         │   │ clipboard     │   │ agentRules    │
│ list          │   │ config        │   │ defaultPrompts│
│ show          │   │ cursorAgent   │   │ projectContext│
│ copy          │   │ cursorCheck   │   │ scaffolds     │
│ open          │   │ fs            │   └───────────────┘
│ new           │   │ git           │
│ run           │   │ hooks         │
│ context:verify│   │ opener        │
└───────────────┘   │ paths         │
                    │ slug          │
                    └───────────────┘
```

### Data flow

1. **User invokes CLI** → Commander.js parses args → routes to command handler
2. **Commands read/write** `.ai/` workspace (prompts, context artifacts)
3. **Templates provide** default prompt content and agent rule scaffolds
4. **Lib modules provide** cross-platform utilities (clipboard, file ops, git)
5. **Context enforcement** via git hooks and CI workflow

### Dual-context model

| File                                       | Purpose                                         | Tracked         |
| ------------------------------------------ | ----------------------------------------------- | --------------- |
| `docs/PROJECT_CONTEXT.md`                  | Authoritative project context (source of truth) | Yes             |
| `.ai/context/repo_context/REPO_CONTEXT.md` | Local working context (session memory)          | No (gitignored) |

**Rule:** When in conflict, `PROJECT_CONTEXT.md` wins.

---

## 6. Configuration

### Environment variables

- `DEBUG` — When set, enables debug logging (e.g., prompt length in `run` command)
- No other environment variables are required

### Config files

| File                   | Role                                                              |
| ---------------------- | ----------------------------------------------------------------- |
| `.aiw.json` (optional) | Customize impact patterns, project context path, skip token       |
| `tsconfig.json`        | TypeScript compiler options (ES2022, NodeNext modules)            |
| `tsconfig.eslint.json` | TypeScript config for ESLint                                      |
| `eslint.config.mjs`    | ESLint flat config (TypeScript, Prettier, JSDoc, import ordering) |
| `vitest.config.ts`     | Vitest test runner config (Node environment)                      |
| `.lintstagedrc.json`   | lint-staged config for pre-commit                                 |
| `.husky/`              | Git hooks configuration                                           |

### Default impact patterns (from `src/lib/config.ts`)

```javascript
{
  build: ["package.json", "package-lock.json", "tsconfig*.json", "*.config.{js,ts,mjs}"],
  env: [".env.example", "docker-compose*.yml", "Dockerfile*", "infra/**"],
  api: ["*.graphql", "openapi*.{json,yaml}", "**/routes/**", "**/api/**"],
  architecture: ["src/**/index.ts", "src/**/mod.ts", "cmd/**", "apps/**"]
}
```

---

## 7. Testing

### Test types present

- **Unit tests** — Commands, lib modules, templates
- No integration or e2e tests currently visible

### How tests run locally

```bash
npm test          # Runs vitest run
```

### How tests run in CI

- Tests are run via `npm test` in the `prepublishOnly` script
- GitHub Actions workflow (`project-context.yaml`) focuses on context enforcement, not test execution

### Test structure

- `test/*.test.ts` — Test files
- `test/utils/tmpWorkspace.ts` — Helper for creating temp directories
- Tests use Vitest's `describe`, `it`, `expect`

### Known areas

- Tests use temp directories and change `process.cwd()` — ensure cleanup in `finally` blocks
- Evidence: `test/setup.test.ts`

---

## 8. Build & release

### Build outputs

- `dist/` — Compiled JavaScript (ESM modules)
- `dist/cli.js` — Main CLI entrypoint (with shebang, executable)

### Build process

1. `npm run build` → `tsc -p tsconfig.json` → outputs to `dist/`
2. `postbuild` script → adds `#!/usr/bin/env node` shebang, sets chmod 755

### Versioning

- Semantic versioning in `package.json` (currently `0.2.0`)
- Version commits (e.g., `0.1.1`) bypass commit message validation

### Release flow

1. Make changes, commit (following commit message format)
2. Run `npm version <patch|minor|major>`
3. Push (pre-push hook validates branch naming, runs lint, checks context)
4. `npm publish` (runs `prepublishOnly` → build + test)
5. Published to `registry.npmjs.org` as `@andrewmonson/aiw`

### npm package config

- `"files": ["dist", "scripts/fix-pty-permissions.mjs"]` — Dist folder and PTY permission fixer are published
- `"bin": {"aiw": "dist/cli.js"}` — CLI binary name
- `"publishConfig": {"access": "public"}` — Public npm package

---

## 9. Risk register

### Footguns

1. **Branch naming enforcement**
    - Pre-push hook rejects branches not matching `feature/ABC-123` or `feature/ABC-123-Description`
    - Protected branches (main, master, develop) bypass this
    - **Mitigation:** Follow naming convention or push to protected branch

2. **Commit message format enforcement**
    - Requires Jira format (`ABC-123 - Description`) or Conventional Commits (`feat: description`)
    - Version commits (`0.1.1`) are exempt
    - **Mitigation:** Follow format; version commits bypass automatically

3. **Context enforcement may block pushes**
    - If meaningful changes are made without updating `docs/PROJECT_CONTEXT.md`, push is blocked
    - **Mitigation:** Add `[context-skip]` to commit message or update PROJECT_CONTEXT.md

4. **`run` command requires `node-pty` native module**
    - Uses `node-pty` for pseudo-TTY to interact with Cursor Agent CLI
    - Native module may require compilation on some platforms
    - macOS: postinstall script fixes spawn-helper permissions automatically
    - **Mitigation:** Ensure Node.js build tools are available; check postinstall logs if issues occur
    - Evidence: `package.json`, `scripts/fix-pty-permissions.mjs`

### Sharp edges

1. **Tests change process.cwd()**
    - Test files change working directory; must restore in `finally` blocks
    - Failure to restore may affect subsequent tests

2. **Copyright header requirement**
    - ESLint enforces copyright notice at top of all `.ts` files
    - Missing header will cause lint errors

### Migration/refactor risks

- None currently identified
