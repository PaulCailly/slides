#!/usr/bin/env bash
# PreToolUse hook on Read: refuse to slurp slides-data.js without offset/limit.
# That single file is ~67KB of serialized slides — unbounded reads burn context
# on one tool call. Force Claude to page through it (or use the slide-explorer
# sub-agent for semantic searches instead).

set -euo pipefail

payload=$(cat)
file=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty')
offset=$(printf '%s' "$payload" | jq -r '.tool_input.offset // empty')
limit=$(printf '%s' "$payload" | jq -r '.tool_input.limit // empty')

case "$file" in
  */src/slides-data.js)
    if [[ -z "$offset" && -z "$limit" ]]; then
      cat >&2 <<EOF
BLOCKED: src/slides-data.js is ~67KB and a single long string — reading it whole
burns thousands of tokens on one tool call. Options that are cheaper:

  1. Read with offset+limit (e.g. offset=1, limit=200) to page through it.
  2. Grep for a slide marker first: grep -n 'SLIDE 42' src/slides-data.js
  3. Delegate to the 'slide-explorer' sub-agent — it's Haiku + read-only,
     so its findings return as a summary instead of filling main context.
EOF
      exit 2
    fi
    ;;
esac

exit 0
