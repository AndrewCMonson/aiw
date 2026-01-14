import { titleCaseFromSlug } from "../lib/slug.js";
export function scaffoldPromptMarkdown(opts) {
    const title = opts.title?.trim() || titleCaseFromSlug(opts.slug);
    const ws = opts.workspaceDirRelative || ".ai";
    const header = `---\ntitle: ${title}\nslug: ${opts.slug}\n---\n\n`;
    const standardRules = [
        "## Operating rules (critical)",
        "- PLAN FIRST: produce a step-by-step plan before running commands or editing files.",
        "- STOP AFTER PLAN: wait for explicit approval before executing.",
        "- Safety: do not request or expose secrets; never paste env var values; redact tokens.",
        `- Persist context: write/update durable notes under \`${ws}/\` as instructed below.`,
        ""
    ].join("\n");
    const artifactSection = (artifactPath) => [
        "## Artifact output (required)",
        `- Write/update: \`${artifactPath}\``,
        "- Keep it concise, structured, and easy to refresh later.",
        ""
    ].join("\n");
    const fileNamingSection = (requireBranch) => {
        const branchInstructions = requireBranch
            ? `1. Extract the current git branch: run \`git rev-parse --abbrev-ref HEAD\`
2. Sanitize the branch name:
   - Replace slashes with hyphens (keep underscores as-is)
   - Keep original case (do not convert to lowercase)
   - Keep all prefixes (feature/, bugfix/, fix/, bug/, hotfix/, etc.)
3. Generate a descriptor:
   - ${requireBranch ? "Combine sanitized branch name with key words from the conversation" : "Use branch name if provided, or extract from conversation context"}
   - Format: \`branch-name_key-descriptor\` (or just \`branch-name\` if sufficient)
   - Limit to ~50 characters total
   - Use only alphanumeric, hyphens, and underscores
   - Replace spaces with hyphens
   - Remove special characters except hyphens and underscores`
            : `1. Extract branch name (if not provided by user):
   - Optionally run \`git rev-parse --abbrev-ref HEAD\` to get current branch
   - Use user-provided branch name if available (prioritize this)
2. Sanitize the branch name:
   - Replace slashes with hyphens (keep underscores as-is)
   - Keep original case (do not convert to lowercase)
   - Keep all prefixes (feature/, bugfix/, fix/, bug/, hotfix/, etc.)
3. Generate a descriptor:
   - Use branch name if provided, or extract from conversation context
   - Format: \`branch-name\` or \`change-summary\` or \`branch-name_change-summary\`
   - Limit to ~50 characters total
   - Use only alphanumeric, hyphens, and underscores
   - Replace spaces with hyphens
   - Remove special characters except hyphens and underscores`;
        return [
            "## File naming (required)",
            "Before writing the artifact, you MUST:",
            branchInstructions,
            `4. Generate a unique ID: 6-8 character lowercase alphanumeric hash
   - Method: Run \`date +%s%N | sha256sum | head -c 8\` (Unix/Linux/macOS) or equivalent
   - Or: Use first 8 characters of SHA-256 hash of \`$(date +%s%N)_${requireBranch ? "${descriptor}" : "${descriptor}"}_${requireBranch ? "${RANDOM}" : "${RANDOM}"}\`
   - Or: Generate using \`uuidgen | tr -d '-' | head -c 8\` (if available)
   - Fallback: Use first 8 alphanumeric characters from \`openssl rand -hex 4\`
5. Get current timestamp: \`YYYY-MM-DD_HHMMSS\` format (24-hour format)
   - Example: \`2024-01-15_143022\` (2:30:22 PM on Jan 15, 2024)
6. Construct filename: \`YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md\`
7. If branch extraction fails (no git repo, detached HEAD, empty or "HEAD" branch name):
   - Use descriptor from conversation context only
   - Still generate unique ID and timestamp
   - Filename format: \`YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md\` (without branch prefix)
   - Log a note in the artifact file if branch extraction was skipped`,
            ""
        ].join("\n");
    };
    switch (opts.from) {
        case "repo":
            return (header +
                standardRules +
                "## Goal\n- Understand this repository and capture durable context.\n\n" +
                "## What to do\n- Inspect the repo structure, entrypoints, scripts, configs, and data flows.\n- Identify how to run, test, and build.\n- Note key modules, boundaries, and risks.\n\n" +
                artifactSection(`${ws}/context/REPO_CONTEXT.md`) +
                "## Plan format\n- Plan steps\n- What files/commands will be used\n- What will be written to the artifact\n");
        case "review":
            return (header +
                standardRules +
                "## Goal\n- Review local changes before push for correctness, quality, and risk.\n\n" +
                "## Inputs I will provide after you paste this\n- Branch name\n- Intent/context\n- Any areas of concern\n\n" +
                "## What to do\n- Review diff for correctness and edge cases.\n- Identify redundancies and cleanup.\n- Assess tests, reliability, and prod readiness.\n\n" +
                fileNamingSection(false) +
                artifactSection(`${ws}/context/pr_reviews/YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md`) +
                "## Plan format\n- Plan steps\n- Review checklist\n- Risks + mitigations\n");
        case "feature":
            return (header +
                standardRules +
                "## Goal\n- Create a senior-level feature plan based on details I provide.\n\n" +
                "## Inputs I will provide after you paste this\n- Feature description\n- Constraints\n- Acceptance criteria\n\n" +
                "## What to do\n- Ask clarifying questions if needed.\n- Propose approach options and recommend one.\n- Provide file-by-file implementation plan and test strategy.\n\n" +
                fileNamingSection(true) +
                artifactSection(`${ws}/context/feature_plans/YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md`) +
                "## Plan format\n- Milestones\n- Files to change\n- Tests\n- Rollout\n");
        case "debug":
            return (header +
                standardRules +
                "## Goal\n- Debug as a senior engineer. I will provide symptoms/logs.\n\n" +
                "## Inputs I will provide after you paste this\n- Repro steps\n- Expected vs actual\n- Logs/stack traces (redacted)\n\n" +
                "## What to do\n- Form hypotheses and rank by likelihood.\n- Propose experiments/observations.\n- Recommend a fix plan and regression tests.\n\n" +
                fileNamingSection(true) +
                artifactSection(`${ws}/context/debug_notes/YYYY-MM-DD_HHMMSS_<id>_<descriptor>.md`) +
                "## Plan format\n- Hypotheses\n- Experiments\n- Fix plan\n- Tests\n");
        case "blank":
        default:
            return (header +
                standardRules +
                "## Goal\n- Describe the purpose of this prompt.\n\n" +
                "## What to do\n- Add instructions here.\n\n" +
                "## Artifact output (required)\n- Write/update: `<choose a file under .ai/>`\n");
    }
}
