# Slide navigation state machine

The viewer has exactly one piece of state: the current slide index `idx` in
`App.jsx`. All navigation is pure index arithmetic clamped to `[0, total-1]`.

```mermaid
stateDiagram-v2
  [*] --> idx0

  idx0: idx = 0 (slide 1)
  idxN: idx = N
  idxLast: idx = total-1

  idx0 --> idxN: → / Space / PageDown\n(next, clamps at last)
  idxN --> idx0: Home
  idxN --> idxLast: End
  idxN --> idxN: F (toggle fullscreen,\n no state change)

  idx0 --> idx0: ← / PageUp\n(prev, clamps at 0)
  idxN --> idxN: jump input blur\n(goTo slide number)
```

Notes:
- Jump input uses `slide.number`, not `idx`. `number` is the literal slide
  marker (1-based, human); `idx` is the array position (0-based). They usually
  align but `goTo` resolves by number for safety.
- Keyboard handler short-circuits when focus is on an `<input>`, so typing in
  the jump box doesn't trigger navigation.
