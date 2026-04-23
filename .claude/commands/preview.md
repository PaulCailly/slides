---
description: Start the Vite dev server in the background and report the URL. Optionally pass a slide number to jump to on load.
argument-hint: [slide-number]
---

Arguments: `$ARGUMENTS`

## Steps

1. Check whether Vite is already running on the default port:
   ```bash
   lsof -ti:5173 >/dev/null 2>&1 && echo "already running on :5173"
   ```
   If yes, skip the start step.

2. Otherwise, start it in the background:
   ```bash
   npm run dev > /tmp/slides-vite.log 2>&1 &
   ```
   Then poll `/tmp/slides-vite.log` until the line `Local:` appears (or 15
   seconds elapse — if it doesn't start, tail the log and show the error).

3. Report the URL. If the user passed a slide number in `$ARGUMENTS`, append
   the instruction: *"Once loaded, press keyboard → to advance, or type the
   number N in the jump box at the bottom and press Enter to jump to slide N."*

4. **Do not** open the browser yourself unless the user explicitly asked —
   just print the URL.

## Stopping

If the user later asks to stop the preview, run:
```bash
lsof -ti:5173 | xargs -r kill
```
