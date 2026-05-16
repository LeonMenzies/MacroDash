import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE || '/api';

const GLOBAL_LINKS = [
  { to: '/', label: 'MACRO' },
  { to: '/exec-summary', label: 'EXEC SUMMARY' },
  { to: '/ideas', label: 'IDEAS' },
  { to: '/tickers', label: 'TICKERS' },
  { to: '/industry', label: 'INDUSTRY' },
];

interface ScreenerItem { symbol: string; companyName: string; sector: string | null; }

function StockSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ScreenerItem[]>([]);
  const [open, setOpen] = useState(false);
  const [screener, setScreener] = useState<ScreenerItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios.get(`${API}/tickers/screener`).then(({ data }) => setScreener(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); setOpen(false); return; }
    const q = query.trim().toUpperCase();
    const filtered = screener
      .filter((s) => s.symbol.startsWith(q) || s.companyName.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 8);
    setSuggestions(filtered);
    setOpen(filtered.length > 0);
  }, [query, screener]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function go(symbol?: string) {
    const target = (symbol || query).trim().toUpperCase();
    if (!target) return;
    setQuery('');
    setOpen(false);
    navigate(`/stock/${target}`);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') go();
            if (e.key === 'Escape') { setOpen(false); setQuery(''); }
          }}
          placeholder="TICKER…"
          maxLength={10}
          spellCheck={false}
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            color: 'var(--text)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: '0.08em',
            padding: '4px 8px',
            outline: 'none',
            width: 100,
            transition: 'border-color 0.15s, width 0.2s',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.width = '140px'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.width = '100px'; }}
        />
        <button
          onClick={() => go()}
          style={{
            background: 'var(--blue)', border: 'none', borderRadius: 4, color: '#000',
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
            padding: '4px 10px', cursor: 'pointer', flexShrink: 0,
          }}
        >
          GO
        </button>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4,
          minWidth: 220, zIndex: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {suggestions.map((s) => (
            <div
              key={s.symbol}
              onClick={() => go(s.symbol)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--blue)', minWidth: 52 }}>{s.symbol}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.companyName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Nav() {
  return (
    <nav className="app-nav">
      <span className="nav-brand">MACRODASH</span>
      <div className="nav-search-wrap">
        <StockSearch />
      </div>
      <div className="nav-links-row">
        {GLOBAL_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
