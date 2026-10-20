import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import fallbackTools from '../data/brand-tools.json';
import './ToolsLauncher.css';

const STAR_KEY = 'launcher-starred';
const TOOLS_URL = 'https://imranpollob.github.io/personal-brand-theme/tools.json';

function loadStars() {
  try {
    const saved = JSON.parse(localStorage.getItem(STAR_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}

export default function ToolsLauncher() {
  const [open, setOpen] = useState(false);
  const [tools, setTools] = useState(fallbackTools);
  const [stars, setStars] = useState(loadStars);
  const [position, setPosition] = useState({ top: 60, left: 20 });
  const toggleRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(TOOLS_URL, { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(list => {
        if (Array.isArray(list) && list.length && list.every(tool =>
          typeof tool.repo === 'string' && typeof tool.title === 'string' &&
          typeof tool.url === 'string' && /^https:\/\//.test(tool.url))) setTools(list);
      })
      .catch(() => { /* The bundled brand directory works offline too. */ });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = toggleRef.current.getBoundingClientRect();
      const width = Math.min(560, window.innerWidth - 40);
      setPosition({
        top: rect.bottom + 4,
        left: Math.max(20, Math.min(rect.right - width, window.innerWidth - width - 20)),
        maxHeight: Math.min(640, window.innerHeight - rect.bottom - 24),
      });
    };
    const close = () => { setOpen(false); toggleRef.current?.focus(); };
    const onKeyDown = event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'Tab') {
        const controls = panelRef.current.querySelectorAll('a[href], button');
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    };
    place();
    panelRef.current.querySelector('button')?.focus();
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  const toggleStar = repo => {
    const updated = stars.includes(repo) ? stars.filter(item => item !== repo) : [...stars, repo];
    setStars(updated);
    try { localStorage.setItem(STAR_KEY, JSON.stringify(updated)); } catch { /* Session only. */ }
  };
  const groups = new Map();
  const ordered = [...tools].sort((a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity));
  const starred = ordered.filter(tool => stars.includes(tool.repo));
  if (starred.length) groups.set('Starred', starred);
  ordered.filter(tool => !stars.includes(tool.repo)).forEach(tool => {
    const category = tool.category || 'Tools';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(tool);
  });

  return <>
    <button ref={toggleRef} type="button" className="bl-toggle" title="Browse all tools"
      aria-label="Browse all tools" aria-haspopup="dialog" aria-expanded={open}
      aria-controls={open ? 'brand-tools-panel' : undefined} onClick={() => setOpen(value => !value)}>
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        {[6, 12, 18].flatMap(y => [6, 12, 18].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" />))}
      </svg>
    </button>
    {open && createPortal(<>
      <div className="bl-backdrop" onClick={() => { setOpen(false); toggleRef.current?.focus(); }} />
      <div ref={panelRef} id="brand-tools-panel" className="bl-panel" role="dialog"
        aria-modal="true" aria-labelledby="brand-tools-title" style={position}>
        <div className="bl-heading">
          <h2 id="brand-tools-title">All tools</h2>
          <button type="button" className="bl-close" aria-label="Close all tools"
            onClick={() => { setOpen(false); toggleRef.current?.focus(); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg>
          </button>
        </div>
        <div className="bl-grid">
          {[...groups].map(([category, items]) => <React.Fragment key={category}>
            <h3 className="bl-category">{category}</h3>
            {items.map(tool => <div key={tool.repo} className="bl-tile" style={{ '--hue': Number(tool.hue) || 170 }}>
              <span className="bl-glyph" aria-hidden="true">{tool.glyph}</span>
              <a className="bl-link" href={tool.url} target="_blank" rel="noopener noreferrer">{tool.title}</a>
              <button type="button" className="bl-star" aria-pressed={stars.includes(tool.repo)}
                aria-label={`${stars.includes(tool.repo) ? 'Unstar' : 'Star'} ${tool.title}`}
                onClick={() => toggleStar(tool.repo)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.6l-5.8 3.1 1.1-6.5L2.6 9.6l6.5-.9z" strokeLinejoin="round" /></svg>
              </button>
            </div>)}
          </React.Fragment>)}
        </div>
      </div>
    </>, document.body)}
  </>;
}
