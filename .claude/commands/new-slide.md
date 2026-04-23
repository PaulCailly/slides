---
description: Scaffold a new slide in src/slides-data.js at position N, shifting later slides and updating section ranges in src/App.jsx. Pass the number and a short title.
argument-hint: <slide-number> "<title>" [variant]
---

You are inserting a new slide into the workshop deck. The deck lives in
`src/slides-data.js` as one exported string; section ranges live in the
`sections` array in `src/App.jsx`.

Arguments passed: `$ARGUMENTS`

## Steps

1. **Parse the arguments.** First token is the target slide number N. Remaining
   tokens are the title (may be quoted) and optional variant (`cover` or
   `question`). If the arguments are ambiguous, ask the user before touching
   any file.

2. **Confirm the slot.** Run `grep -n "SLIDE ${N}" src/slides-data.js` to check
   whether N already exists. If it does, you are **inserting before** it —
   every slide from N onward will be renumbered N+1. Confirm this is intended
   before proceeding.

3. **Insert the new slide.** Build a stub like:
   ```
   %%%SLIDE N <variant-if-any>%%%\n<h1>Title</h1>\n<p>TODO</p>\n
   ```
   Use Edit with a surgical `old_string` that is the next existing slide's
   marker, and an `new_string` that prepends the new slide. Do not rewrite the
   whole file.

4. **Renumber.** If shifting, increment every subsequent `SLIDE M%%%` marker.
   Do this with targeted Edits (ideally one per slide marker, in reverse order
   to avoid collisions), not a sed pass — we want the diff to be reviewable.

5. **Update section ranges.** Open `src/App.jsx`, find the `sections` array,
   and bump any `from`/`to` that is ≥ N. Every range after the insertion point
   shifts by 1.

6. **Verify.**
   - Run the Stop hook manually: `.claude/hooks/verify-slides.sh`
   - Launch the `slide-reviewer` sub-agent on the new slide N

7. **Report** what changed, then stop. Do not commit — the human decides when
   to commit.

## Guardrails

- If N is outside `[1, total+1]`, refuse and ask for a valid number.
- Never use unquoted sed/awk that could corrupt the huge string literal — every
  write goes through Edit with exact `old_string` matches.
- Leave placeholder copy explicit (`TODO`) so the human can't miss it.
