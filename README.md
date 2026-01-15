# `@andrewmonson/aiw` — repo-local prompt library CLI

This repo contains **`aiw`**, a small cross-platform CLI that manages a repo-local **prompt library** under **`.ai/`**.

Prompts can be **copied to clipboard** for manual pasting, or **executed directly** via Cursor Agent CLI.

## Install / run

**Prerequisites:** Cursor must be installed with the `cursor` CLI command available in PATH. To install the Cursor CLI:

1. Open Cursor
2. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux) to open the command palette
3. Run `Install cursor command`
4. Restart your terminal

- Global install:

```bash
npm i -g @andrewmonson/aiw
aiw --help
```

- Run via `npx` (no install):

```bash
npx @andrewmonson/aiw --help
```

## Quick start

Create the `.ai/` structure and default prompts:

```bash
aiw setup
```

List prompts:

```bash
aiw list
```

Print a prompt (copy/paste into Cursor chat):

```bash
aiw show repo_discover
```

Copy to clipboard (falls back to printing if clipboard tools aren’t available):

```bash
aiw copy repo_discover
```

Run directly via Cursor Agent (interactive mode):

```bash
aiw run repo_discover -i
```

## Commands

All commands support:

- **`--workspace <path>`**: the workspace folder (default: `.ai`)

### `aiw setup`

Creates the workspace structure and writes the default prompt set:

```
.ai/
  README.md
  prompts/
    repo_discover.md
    repo_refresh.md
    pre_push_review.md
    feature_plan.md
    debug_senior.md
  context/
    repo_context/
      REPO_CONTEXT.md
    pr_reviews/
      YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md
    feature_plans/
      YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md
    debug_notes/
      YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md
```

Idempotency:

- By default, **existing files are not overwritten**.
- Use **`--force`** to overwrite managed files (a timestamped backup is created next to the original).

**Note:** Context files (`pr_reviews/`, `feature_plans/`, `debug_notes/`) are versioned with timestamps, unique IDs, and descriptors (including git branch names for features/bugs). Each prompt execution creates a new file instead of overwriting previous ones.

`.gitignore` behavior:

- By default, `setup` **prompts** (only in an interactive TTY) to add the workspace folder to `.gitignore`.
- For non-interactive usage, pass **`--gitignore add`** or **`--gitignore skip`**.

Flags:

- `--force` - Overwrite managed files (creates backups)
- `--gitignore prompt|add|skip` - Control .gitignore behavior
- `--workspace <path>` - Workspace folder (default: `.ai`)
- `--with-agents` - Scaffold agent rule files (AGENTS.md, CLAUDE.md, .cursor/rules/)
- `--with-hooks` - Install git pre-push hook for context enforcement

### `aiw list`

Lists available prompt slugs based on `*.md` files in `<workspace>/prompts/`.

### `aiw show <prompt>`

Prints the prompt contents to stdout.

### `aiw copy <prompt>`

Copies the prompt contents to clipboard using OS tooling:

- macOS: `pbcopy`
- Windows: `clip`
- Linux: tries `wl-copy`, then `xclip`, then `xsel`

If no clipboard tool is available, it prints the prompt to stdout with a friendly message.

### `aiw open <prompt>`

Attempts to open the prompt file in the OS default editor/viewer:

- macOS: `open`
- Windows: `start`
- Linux: `xdg-open`

If open fails, it prints the absolute path.

### `aiw new <name>`

Creates a new prompt file at `<workspace>/prompts/<slug>.md`.

Flags:

- `--title "<human title>"`
- `--from blank|repo|review|feature|debug`
- `--open`
- `--force` (overwrite safely; backs up first)

### `aiw run <prompt>`

Runs a prompt via Cursor Agent CLI. The prompt is pasted into the agent's input field.

```bash
# Interactive mode (recommended) - allows back-and-forth with the agent
aiw run repo_discover -i

# With a specific model
aiw run repo_discover -i -m sonnet-4.5

# Non-interactive print mode (for scripting)
aiw run repo_discover -p
```

In interactive mode (`-i`), press **Enter** to submit the prompt, then continue interacting with the agent normally.

Flags:

- `-i, --interactive` - Interactive mode (allows typing responses, approving plans)
- `-m, --model <model>` - Model to use (see below for available models)
- `-p, --print` - Print mode (non-interactive, for scripting)
- `--output-format <format>` - Output format for print mode: `text` or `json`
- `--workspace <path>` - Workspace folder (default: `.ai`)

**Available models:**

- `auto` - Let Cursor pick the best model
- `opus-4.5-thinking` - Claude 4.5 Opus with thinking (default)
- `opus-4.5` - Claude 4.5 Opus
- `sonnet-4.5` - Claude 4.5 Sonnet
- `sonnet-4.5-thinking` - Claude 4.5 Sonnet with thinking
- `gpt-5.2` - GPT-5.2
- `gemini-3-pro` - Gemini 3 Pro
- `gemini-3-flash` - Gemini 3 Flash

Run `cursor agent --list-models` for the full list of available models.

**Model validation:** If you enter an incorrect model name, the CLI will suggest the closest match. For example, entering `opus4.5` (missing hyphen) will suggest `opus-4.5`.

**Requirements:**

- **Cursor CLI**: The `cursor` command must be available in your PATH. If you see an error when running `aiw`, install it by:
    1. Opening Cursor
    2. Pressing `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux) to open the command palette
    3. Running `Install cursor command`
    4. Restarting your terminal
- **Node.js >= 20**: Required for native module support

**Note:** This command uses `node-pty` for cross-platform pseudo-terminal support. On first install, native module compilation may occur, which requires standard build tools (these are typically pre-installed on most systems).

### `aiw context:verify`

Verifies that `docs/PROJECT_CONTEXT.md` is updated when impactful changes are made. Used by pre-push hooks and CI.

```bash
aiw context:verify --range origin/main...HEAD
```

Flags:

- `--range <ref>` - Git range to check (default: `origin/main...HEAD`)
- `--json` - Output results as JSON
- `--strict` - Fail even if no impactful changes (require explicit skip)

**Impactful changes** include modifications to:

- Build configuration (`package.json`, `tsconfig.json`, etc.)
- Environment setup (`.env.example`, `Dockerfile`, etc.)
- API contracts (`*.graphql`, OpenAPI specs, routes)
- Architecture (module boundaries, folder structure)

If impactful changes are detected without a `PROJECT_CONTEXT.md` update, the command fails. Add `[context-skip]` to a commit message to bypass this check.

**Example output:**

```
❌ PROJECT_CONTEXT.md not updated

Impactful changes detected in commits:
  • abc1234 Refactor auth middleware
  • def5678 Add new API endpoint

Changed files matching impact patterns:
  • package.json (build)
  • src/api/routes/users.ts (api)

To proceed, either:
 1. Update docs/PROJECT_CONTEXT.md in this branch
 2. Add [context-skip] to a commit message if no context update is needed
```

## Dual-Context Governance

`aiw` supports a dual-context model for scalable, team-safe AI usage:

### Project Context (Authoritative)

- **`docs/PROJECT_CONTEXT.md`** - Tracked in git, updated as part of PRs
- Source of truth for how the project is _meant_ to work
- Finalized by lead developers through PR review
- Scaffolded with `aiw setup --with-agents`

### Local Context (Operational)

- **`.ai/context/repo_context/REPO_CONTEXT.md`** - Gitignored, fast to update
- Working memory for current development session
- May be out of date; always defer to project context when in conflict

### Agent Rules

When you run `aiw setup --with-agents`, `aiw` scaffolds:

- **`AGENTS.md`** - Generic agent instructions (read order, update requirements)
- **`CLAUDE.md`** - Claude-specific instructions
- **`.cursor/rules/00-core.mdc`** - Always-apply core rules for Cursor
- **`.cursor/rules/10-frontend.mdc`** - Frontend-scoped rules
- **`.cursor/rules/20-backend.mdc`** - Backend-scoped rules

These files establish that agents must:

1. Read `docs/PROJECT_CONTEXT.md` **first**
2. Read `.ai/context/repo_context/REPO_CONTEXT.md` **second**
3. Update project context when changes affect setup, architecture, workflows, or APIs

### Context Enforcement

`aiw` provides git-native enforcement to keep `docs/PROJECT_CONTEXT.md` up to date.

#### What counts as "meaningful changes"?

A push/PR is considered "meaningful" if it changes anything **outside**:

- `docs/**`
- `**/*.md`
- `.ai/**`
- `.cursor/**`

This is intentionally conservative. Code changes require context updates; doc-only changes don't.

#### Pre-Push Hook

Run `aiw setup --with-hooks` to install a git pre-push hook that:

- Blocks pushes if meaningful changes are made without updating `docs/PROJECT_CONTEXT.md`
- Can be bypassed with `[context-skip]` in a commit message
- Pure bash, no Node.js dependency at runtime

You can also manually copy `scripts/pre-push-context-check.sh` to `.git/hooks/pre-push`.

#### CI Enforcement

Add `.github/workflows/project-context.yml` to enforce the same policy on PRs:

- Blocks PRs with meaningful changes unless `docs/PROJECT_CONTEXT.md` is updated
- Respects `[context-skip]` token in commit messages

#### Bypassing the Check

If a context update is truly unnecessary, add `[context-skip]` to any commit message in the range:

```bash
git commit -m "Fix typo in comments [context-skip]"
```

### Configuration

Create `.aiw.json` in your repo root to customize impact detection:

```json
{
    "impactPatterns": {
        "build": ["package.json", "tsconfig*.json"],
        "env": [".env.example", "Dockerfile*"],
        "api": ["*.graphql", "**/routes/**"],
        "architecture": ["src/**/index.ts", "cmd/**"]
    },
    "projectContextPath": "docs/PROJECT_CONTEXT.md",
    "skipToken": "[context-skip]"
}
```

## Prompt design

The included prompts are:

- Tech-stack agnostic
- Plan-first (Cursor must plan then stop for approval)
- Safe (no secrets / no env var values)
- Artifact-producing (instruct Cursor to write/update files under `.ai/` so context persists)

## Development

Install deps:

```bash
npm i
```

Run tests:

```bash
npm test
```

Build:

```bash
npm run build
```

The compiled CLI entrypoint is `dist/cli.js`.

### Local testing

Run the CLI directly from the repo (rebuilds first):

```bash
npm run dev -- <command>
# Examples:
npm run dev -- setup --gitignore skip
npm run dev -- list
npm run dev -- show repo_discover
```

Or create a global symlink for testing (run `aiw` from anywhere):

```bash
npm run link
# Now you can run:
aiw setup
aiw list
# etc.

# To remove the link:
npm run unlink
```
