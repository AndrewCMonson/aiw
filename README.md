# `@andrewmonson/aiw` — repo-local prompt library CLI

This repo contains **`aiw`**, a small cross-platform CLI that manages a repo-local **prompt library** under **`.ai/`**.

The prompts are meant to be **pasted into Cursor chat manually** (the CLI does not execute prompts).

## Install / run

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

- `--force`
- `--gitignore prompt|add|skip`
- `--workspace <path>`

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
