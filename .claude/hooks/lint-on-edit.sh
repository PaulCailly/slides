#!/usr/bin/env bash
# PostToolUse hook: auto-fix ESLint issues on .js/.jsx files after Edit/Write.
# Exit 0 on success, exit 2 to block Claude with stderr shown as error.

set -euo pipefail

payload=$(cat)
file=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty')

[[ -z "$file" ]] && exit 0
[[ ! -f "$file" ]] && exit 0

case "$file" in
  *.js|*.jsx) ;;
  *) exit 0 ;;
esac

cd "$(dirname "$0")/../.."

if ! npx --no-install eslint --fix "$file" 2>&1; then
  echo "ESLint found errors in $file that could not be auto-fixed. Review above and fix before continuing." >&2
  exit 2
fi

exit 0
