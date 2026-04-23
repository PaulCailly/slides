#!/usr/bin/env bash
# Stop hook: before Claude hands control back, verify the deck is still coherent.
# Checks:
#   1. ESLint passes across the project (npm run lint)
#   2. slides-data.js parses as a JS module (quick node --check)
#   3. All SLIDE markers are strictly ascending with no gaps
# Any failure exits 2 → Claude sees the error and is forced to fix before stopping.

set -euo pipefail

cd "$(dirname "$0")/../.."

fail() {
  echo "verify-slides: $1" >&2
  exit 2
}

npm run --silent lint >/tmp/slides-lint.log 2>&1 || {
  echo "--- eslint output ---" >&2
  cat /tmp/slides-lint.log >&2
  fail "ESLint is not clean — fix the lint errors above."
}

node --check src/slides-data.js 2>/tmp/slides-parse.log || {
  cat /tmp/slides-parse.log >&2
  fail "src/slides-data.js has a syntax error — likely an unescaped quote inside the big string literal."
}

# Extract slide numbers and verify they are 1..N with no gaps or duplicates.
numbers=$(grep -oE 'SLIDE [0-9]+' src/slides-data.js | awk '{print $2}')
expected=1
for n in $numbers; do
  if [[ "$n" -ne "$expected" ]]; then
    fail "slide numbering is broken: expected SLIDE $expected, got SLIDE $n. Check for gaps, duplicates, or out-of-order markers in src/slides-data.js."
  fi
  expected=$((expected + 1))
done

exit 0
