#!/usr/bin/env bash
# PreToolUse hook on Bash: refuse destructive ops the workshop demo should never perform.
# Exit 2 blocks the call and returns stderr to Claude so it self-corrects.

set -euo pipefail

payload=$(cat)
cmd=$(printf '%s' "$payload" | jq -r '.tool_input.command // empty')

[[ -z "$cmd" ]] && exit 0

block() {
  echo "BLOCKED by .claude/hooks/guard-bash.sh: $1" >&2
  echo "Command: $cmd" >&2
  exit 2
}

# Classic foot-guns
case "$cmd" in
  *"rm -rf /"*|*"rm -rf ~"*|*"rm -rf \$HOME"*|*"rm -rf /*"*)
    block "catastrophic rm -rf against system path"
    ;;
esac

# git push --force / --force-with-lease onto main or master
if printf '%s' "$cmd" | grep -Eq 'git +push.*(--force|--force-with-lease|\-f( |$))'; then
  if printf '%s' "$cmd" | grep -Eq '(main|master)\b'; then
    block "force-push to main/master is off limits — create a PR instead"
  fi
fi

# Direct commits / pushes to main without a PR
if printf '%s' "$cmd" | grep -Eq 'git +push( +origin)? +(main|master)\b'; then
  block "direct push to main/master — use a branch + PR"
fi

# git reset --hard with an explicit ref (interactive-only OK)
if printf '%s' "$cmd" | grep -Eq 'git +reset +--hard +[^ ]'; then
  block "git reset --hard with an explicit ref can destroy work — ask the human first"
fi

# Skipping hooks or signing bypasses — workshop teaches "never skip hooks"
if printf '%s' "$cmd" | grep -Eq -- '--no-verify|--no-gpg-sign'; then
  block "--no-verify / --no-gpg-sign bypass team safety rails"
fi

exit 0
