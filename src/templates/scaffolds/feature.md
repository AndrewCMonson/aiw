## Operating rules (critical)

- PLAN FIRST: produce a step-by-step plan before running commands or editing files.
- STOP AFTER PLAN: wait for explicit approval before executing.
- Safety: do not request or expose secrets; never paste env var values; redact tokens.
- Persist context: write/update durable notes under \`${ws}/\` as instructed below.

## Goal

- Create a senior-level feature plan based on details I provide.

## Inputs I will provide after you paste this

- Feature description
- Constraints
- Acceptance criteria

## What to do

- Ask clarifying questions if needed.
- Propose approach options and recommend one.
- Provide file-by-file implementation plan and test strategy.

## File naming (required)

Before writing the artifact, you MUST:

1. Extract the current git branch: run \`git rev-parse --abbrev-ref HEAD\`
2. Sanitize the branch name:
    - Replace slashes with hyphens (keep underscores as-is)
    - Keep original case (do not convert to lowercase)
    - Keep all prefixes (feature/, bugfix/, fix/, bug/, hotfix/, etc.)
3. Generate a descriptor:
    - Combine sanitized branch name with key words from the conversation
    - Format: \`branch-name_key-descriptor\` (or just \`branch-name\` if sufficient)
    - Limit to ~50 characters total
    - Use only alphanumeric, hyphens, and underscores
    - Replace spaces with hyphens
    - Remove special characters except hyphens and underscores
4. Generate a unique ID: 6-8 character lowercase alphanumeric hash
    - Method: Run \`date +%s%N | sha256sum | head -c 8\` (Unix/Linux/macOS) or equivalent
    - Or: Use first 8 characters of SHA-256 hash of \`$(date +%s%N)_${descriptor}\_${RANDOM}\`
    - Or: Generate using \`uuidgen | tr -d '-' | head -c 8\` (if available)
    - Fallback: Use first 8 alphanumeric characters from \`openssl rand -hex 4\`
5. Get current timestamp: \`YYYY-MM-DD_HHMMSS\` format (24-hour format)
    - Example: \`2024-01-15_143022\` (2:30:22 PM on Jan 15, 2024)
6. Construct filename: \`YYYY-MM-DD*HHMMSS*<id>\_<descriptor>.md\`
7. If branch extraction fails (no git repo, detached HEAD, empty or "HEAD" branch name):
    - Use descriptor from conversation context only
    - Still generate unique ID and timestamp
    - Filename format: \`YYYY-MM-DD*HHMMSS*<id>\_<descriptor>.md\` (without branch prefix)
    - Log a note in the artifact file if branch extraction was skipped

## Artifact output (required)

- Write/update: \`${ws}/context/feature*plans/YYYY-MM-DD_HHMMSS*<id>\_<descriptor>.md\`
- Keep it concise, structured, and easy to refresh later.

## Plan format

- Milestones
- Files to change
- Tests
- Rollout
