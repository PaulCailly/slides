# App architecture

The deck is a single-page React app rendered by Vite. There is no router, no
state library, no backend — it's a keyboard-driven slide viewer.

```mermaid
flowchart LR
  subgraph entry[entry]
    HTML[index.html]
    MAIN[src/main.jsx]
  end

  subgraph app[App.jsx]
    PARSE[parseSlides\nsplits raw on %%%SLIDE N%%%]
    STATE[useState idx]
    KEYS[keydown handler\n← → space f Home End]
    RENDER[effect: marked + hljs + mermaid]
  end

  subgraph data[slides-data.js]
    RAW[export const slidesRaw = "..."\none giant string, ~67KB]
  end

  subgraph style[deck.css]
    CSS[variants: .cover .question\nprogress bar, top bar, controls]
  end

  HTML --> MAIN --> app
  RAW --> PARSE
  PARSE --> STATE
  KEYS --> STATE
  STATE --> RENDER
  CSS --> RENDER
```

Key invariants:
- Every slide number referenced in `sections` (App.jsx) must exist in
  slides-data.js; the Stop hook enforces this.
- `slideClasses` in App.jsx maps variants (`cover`, `question`) to CSS classes
  — adding a variant in slides-data.js without wiring it here silently
  no-ops.
