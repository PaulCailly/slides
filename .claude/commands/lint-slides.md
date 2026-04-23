---
description: Run a full consistency audit across the deck — numbering, section coverage, variant usage, tag balance, and duplicate markers. Reports issues without fixing them.
---

You are running a **read-only** audit over the slide deck. Do not edit files
during this command — only report.

## Checks

Run these in parallel where possible:

1. **Numbering integrity.** Extract all `SLIDE N` markers from
   `src/slides-data.js` in file order. They must be the sequence 1, 2, …, total
   with no gaps and no duplicates.
   ```bash
   grep -oE 'SLIDE [0-9]+' src/slides-data.js | awk '{print $2}' | \
     awk 'BEGIN{e=1} {if($1!=e) print "gap/dup at expected "e" got "$1; e=$1+1}'
   ```

2. **Section coverage.** Read `sections` from `src/App.jsx`. Every slide number
   in the deck must be covered by exactly one section range. Report any
   uncovered slide or any overlap.

3. **Variant usage.** Extract variants from markers (e.g. `SLIDE 9 question`).
   Cross-check against `slideClasses` in `src/App.jsx` — any variant that isn't
   explicitly handled is a dead variant (CSS won't apply).

4. **Tag balance per slide.** For each slide body, count `<div>` vs `</div>`,
   `<h1>` vs `</h1>`, etc. Report any imbalance with the slide number.

5. **Escape hygiene.** Scan for unescaped double quotes inside the string
   literal. The whole file is wrapped in `"..."`, so every content `"` must be
   `\"`. A quick heuristic: look for `[^\\]"` followed by non-`;` non-`+`
   characters on the same line.

6. **Duplicate titles.** Extract `<h1>...</h1>` text per slide and flag
   duplicates (two "Guidelines" slides probably means someone forgot to
   renumber).

## Output

One section per failing check with slide numbers and file:line refs. End with
a one-line summary:

```
lint-slides: 3 issues across 2 slides.
```

If everything is clean, output `lint-slides: all clean (N slides)`.

## Guardrails

- **Read-only.** No Edit, no Write, no Bash that mutates files.
- If any check can't be run (e.g. section array not parseable), say so
  explicitly — don't silently skip.
