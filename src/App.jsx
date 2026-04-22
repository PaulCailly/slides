import { useState, useEffect, useCallback, useRef } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import './deck.css';
import { slidesRaw } from './slides-data';

const sections = [
  { from: 1, to: 3, name: 'Intro' },
  { from: 4, to: 8, name: 'Mental Model' },
  { from: 9, to: 15, name: 'Setup & Hygiene' },
  { from: 16, to: 24, name: 'Context Engineering' },
  { from: 25, to: 31, name: 'Skills' },
  { from: 32, to: 38, name: 'MCP' },
  { from: 39, to: 46, name: 'Hooks' },
  { from: 47, to: 53, name: 'Sub-agents' },
  { from: 54, to: 61, name: 'Methodology' },
  { from: 62, to: 64, name: 'Beyond' },
  { from: 65, to: 65, name: 'Kahoot' },
  { from: 66, to: 70, name: 'Wrap-up' },
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

  // Render slide content with marked + highlight.js
  useEffect(() => {
    if (!contentRef.current) return;
    const html = marked.parse(slide.body);
    contentRef.current.innerHTML = html;

    // Highlight code blocks
    contentRef.current.querySelectorAll('pre code').forEach((block) => {
      if (!block.classList.contains('hljs')) {
        try { hljs.highlightElement(block); } catch (e) { /* skip */ }
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
          <div className="brand">Claude Code Advanced &middot; Deezer AI CoP</div>
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
