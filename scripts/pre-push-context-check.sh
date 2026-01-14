#!/usr/bin/env bash
set -euo pipefail

TEAM_DOC="docs/PROJECT_CONTEXT.md"

# pre-push receives: <local_ref> <local_sha> <remote_ref> <remote_sha>
while read -r local_ref local_sha remote_ref remote_sha; do
  # allow delete pushes
  if [[ "$local_sha" == "0000000000000000000000000000000000000000" ]]; then
    exit 0
  fi

  # new branch push -> compare against merge-base with main if possible
  if [[ "$remote_sha" == "0000000000000000000000000000000000000000" ]]; then
    base="$(git merge-base "$local_sha" origin/main 2>/dev/null || git merge-base "$local_sha" main 2>/dev/null || true)"
    range="${base:-$local_sha^}..$local_sha"
  else
    range="$remote_sha..$local_sha"
  fi

  # Skip if any commit message in range contains [context-skip]
  if git log --format=%B "$range" | grep -q "\[context-skip\]"; then
    echo "[context] skip token found; allowing push without $TEAM_DOC"
    continue
  fi

  files="$(git diff --name-only "$range")"

  # If no files, allow
  if [[ -z "${files// }" ]]; then
    continue
  fi

  # Meaningful = anything outside docs/ and markdown and .ai/.cursor
  meaningful="$(echo "$files" | grep -vE '^(docs/|.*\.md$|\.ai/|\.cursor/)' || true)"
  teamdoc_changed="$(echo "$files" | grep -F "$TEAM_DOC" || true)"

  if [[ -n "${meaningful// }" && -z "${teamdoc_changed// }" ]]; then
    echo "❌ Push blocked: meaningful changes detected but $TEAM_DOC was not updated."
    echo ""
    echo "Fix:"
    echo "  1) Run: aiw project_refresh (use it to update $TEAM_DOC)"
    echo "  2) Commit the doc update"
    echo ""
    echo "If truly unnecessary, add [context-skip] to a commit message."
    exit 1
  fi
done
