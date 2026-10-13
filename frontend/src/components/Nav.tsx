import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart2, Star, Factory, FileText, Lightbulb } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE || '/api';

const NAV_LINKS = [
  { to: '/',             label: 'MACRO',        Icon: BarChart2   },
  { to: '/tickers',      label: 'WATCHLIST',    Icon: Star        },
  { to: '/industry',     label: 'INDUSTRY',     Icon: Factory     },
  { to: '/exec-summary', label: 'EXEC SUMMARY', Icon: FileText    },
  { to: '/ideas',        label: 'IDEAS',        Icon: Lightbulb   },
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
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
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
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value.toUpperCase())}
        onKeyDown={(e) => {
          if (e.key === 'Enter') go();
          if (e.key === 'Escape') { setOpen(false); setQuery(''); }
        }}
        placeholder="TICKER / SEARCH…"
        maxLength={10}
        spellCheck={false}
        style={{ width: '100%' }}
      />
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4,
          zIndex: 300, boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
        }}>
          {suggestions.map((s) => (
            <div
              key={s.symbol}
              onClick={() => go(s.symbol)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border2)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface3)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--blue)', minWidth: 44 }}>{s.symbol}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.companyName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Nav() {
  return (
    <>
      {/* ── Mobile top search bar ── */}
      <div className="mobile-topbar">
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--blue)', flexShrink: 0 }}>M</span>
        <StockSearch />
      </div>

      {/* ── Desktop sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/MacroDashLogo.png" alt="MacroDash" className="sidebar-logo" />
        </div>

        <div className="sidebar-search">
          <StockSearch />
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">NAVIGATION</div>
          {NAV_LINKS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <span className="sidebar-icon"><Icon size={14} strokeWidth={1.75} /></span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em' }}>
            L/S EQUITY DESK
          </span>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {NAV_LINKS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}
            >
              <span className="mobile-nav-icon"><Icon size={18} strokeWidth={1.75} /></span>
              {label.split(' ')[0]}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
