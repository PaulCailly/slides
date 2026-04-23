import { useState, useEffect, useCallback, useRef } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import mermaid from 'mermaid';
import 'highlight.js/styles/github-dark.css';
import './deck.css';
import { slidesRaw } from './slides-data';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#141414',
    primaryColor: '#1e1e1e',
    primaryTextColor: '#efefef',
    primaryBorderColor: '#d97757',
    lineColor: '#888',
    secondaryColor: '#242424',
    tertiaryColor: '#1a1a1a',
    mainBkg: '#1e1e1e',
    nodeBorder: '#d97757',
    clusterBkg: '#141414',
    clusterBorder: '#333',
    edgeLabelBackground: '#141414',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '14px',
  },
  flowchart: { curve: 'basis', padding: 20, useMaxWidth: true },
});

const sections = [
  { from: 1, to: 3, name: 'Intro' },
  { from: 4, to: 8, name: 'Mental Model' },
  { from: 9, to: 14, name: 'Setup & Hygiene' },
  { from: 15, to: 24, name: 'Context Engineering' },
  { from: 25, to: 31, name: 'Skills' },
  { from: 32, to: 39, name: 'MCP' },
  { from: 40, to: 41, name: 'Break' },
  { from: 42, to: 48, name: 'Hooks' },
  { from: 49, to: 56, name: 'Sub-agents' },
  { from: 57, to: 63, name: 'Methodology' },
  { from: 64, to: 66, name: 'Beyond' },
  { from: 67, to: 68, name: 'Demo' },
  { from: 69, to: 69, name: 'Kahoot' },
  { from: 70, to: 76, name: 'Wrap-up' },
];

function getSectionName(n) {
  const s = sections.find((s) => n >= s.from && n <= s.to);
  return s ? s.name : '';
}

function parseSlides(md) {
  const parts = md.split(/%%%SLIDE\s+(\d+)(?:\s+(\w+))?%%%/);
  const slides = [];
  for (let i = 1; i < parts.length; i += 3) {
    slides.push({
      number: parseInt(parts[i]),
      variant: parts[i + 1] || '',
      body: (parts[i + 2] || '').trim(),
    });
  }
  return slides;
}

const slides = parseSlides(slidesRaw);

marked.setOptions({ gfm: true, breaks: false });

export default function App() {
  const [idx, setIdx] = useState(0);
  const contentRef = useRef(null);
  const jumpRef = useRef(null);

  const slide = slides[idx];
  const total = slides.length;

  const next = useCallback(() => setIdx((i) => Math.min(i + 1, total - 1)), [total]);
  const prev = useCallback(() => setIdx((i) => Math.max(i - 1, 0)), []);
  const goTo = useCallback((n) => {
    const t = slides.findIndex((s) => s.number === n);
    if (t !== -1) setIdx(t);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e) {
      if (document.activeElement.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
      else if (e.key === ' ') { e.preventDefault(); next(); }
      else if (e.key === 'Home') { setIdx(0); }
      else if (e.key === 'End') { setIdx(total - 1); }
      else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [next, prev, total]);

  // Render slide content with marked + highlight.js + mermaid
  useEffect(() => {
    if (!contentRef.current) return;
    let html = marked.parse(slide.body);

    // Convert mermaid code blocks to pending containers
    html = html.replace(
      /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
      (_, code) => {
        const decoded = code
          .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        return `<div class="mermaid-pending">${decoded}</div>`;
      }
    );

    contentRef.current.innerHTML = html;

    // Highlight code blocks
    contentRef.current.querySelectorAll('pre code').forEach((block) => {
      if (!block.classList.contains('hljs')) {
        try { hljs.highlightElement(block); } catch { /* skip */ }
      }
    });

    // Render mermaid diagrams
    const mermaidEls = contentRef.current.querySelectorAll('.mermaid-pending');
    let counter = Date.now();
    mermaidEls.forEach(async (el) => {
      const graph = el.textContent;
      const id = `mermaid-${++counter}`;
      el.classList.remove('mermaid-pending');
      el.classList.add('mermaid');
      el.innerHTML = '';
      try {
        const { svg } = await mermaid.render(id, graph);
        el.innerHTML = svg;
      } catch {
        el.textContent = graph;
      }
    });
  }, [slide]);

  // Update jump input
  useEffect(() => {
    if (jumpRef.current) jumpRef.current.value = slide.number;
  }, [slide.number]);

  const slideClasses = ['slide'];
  if (slide.variant === 'cover') slideClasses.push('cover');
  if (slide.variant === 'question') slideClasses.push('question');

  return (
    <>
      <div className="progress">
        <div
          className="progress-bar"
          style={{ width: `${((idx + 1) / total) * 100}%` }}
        />
      </div>

      <div className="deck">
        <div className="top-bar">
          <div className="brand">Claude Code Advanced</div>
          <div className="section">{getSectionName(slide.number).toUpperCase()}</div>
          <div className="counter">
            <span className="n">{String(slide.number).padStart(2, '0')}</span>{' '}
            <span style={{ color: 'var(--dim)' }}>
              / {String(total).padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className={slideClasses.join(' ')}>
          <div className="slide-inner" ref={contentRef} key={idx} />
        </div>
      </div>

      <div className="controls">
        <button className="btn" onClick={prev} aria-label="Previous">&#8249;</button>
        <div className="jump">
          <input
            ref={jumpRef}
            type="text"
            defaultValue="1"
            maxLength={3}
            onBlur={(e) => {
              const n = parseInt(e.target.value);
              if (!isNaN(n) && n >= 1 && n <= total) goTo(n);
              else e.target.value = slide.number;
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
          />
          <span>/ {total}</span>
        </div>
        <button className="btn" onClick={next} aria-label="Next">&#8250;</button>
      </div>

      <div className="hint">
        <span><kbd>&#8592;</kbd><kbd>&#8594;</kbd> nav</span>
        <span><kbd>F</kbd> full</span>
        <span><kbd>Home</kbd> reset</span>
      </div>
    </>
  );
}
