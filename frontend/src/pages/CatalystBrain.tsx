import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { EpicView, type EpicKey } from '../components/EpicViews';

const API = import.meta.env.VITE_API_BASE || '/api';

interface FmpStock {
  symbol: string;
  companyName: string;
  pe: number | null;
  sector: string | null;
}

const EPICS = ['latent', 'definitive', 'horizon', 'macro'];
const SECTORS = ['Technology', 'Financials', 'Healthcare', 'Industrials', 'Consumer Discretionary', 'Consumer Staples', 'Energy', 'Materials', 'Real Estate', 'Utilities', 'Communication Services'];
const MARKET_CAPS = ['Large Cap', 'Mid Cap', 'Small Cap', 'Micro Cap'];

interface Save {
  id: string;
  ticker: string;
  epic: EpicKey;
  sector: string | null;
  industry: string | null;
  market_cap: string | null;
  saved_at: string;
  data: any;
}

export default function CatalystBrain() {
  const navigate = useNavigate();

  // Search / autocomplete
  const [query, setQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // FMP stocks
  const [stocks, setStocks] = useState<FmpStock[]>([]);
  const [stocksLoading, setStocksLoading] = useState(true);
  const [fmpError, setFmpError] = useState(false);

  // Saved queries
  const [saves, setSaves] = useState<Save[]>([]);
  const [filterEpic, setFilterEpic] = useState('');
  const [activeSector, setActiveSector] = useState('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editMeta, setEditMeta] = useState({ sector: '', industry: '', market_cap: '' });
  const [fetchingMeta, setFetchingMeta] = useState<string | null>(null);

  function go(ticker: string) {
    const t = ticker.trim().toUpperCase();
    if (t) navigate(`/catalyst-brain/${t}`);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Screener fetch via server (Yahoo Finance)
  useEffect(() => {
    fetch(`${API}/tickers/screener`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) { setFmpError(true); return; }
        setStocks(data);
      })
      .catch(() => setFmpError(true))
      .finally(() => setStocksLoading(false));
  }, []);

  useEffect(() => { loadSaves(); }, [filterEpic]);

  async function loadSaves() {
    try {
      const params: Record<string, string> = {};
      if (filterEpic) params.epic = filterEpic;
      const res = await axios.get(`${API}/catalyst-saves`, { params });
      setSaves(res.data);
    } catch {
      // ignore
    }
  }

  async function deleteSave(id: string) {
    await axios.delete(`${API}/catalyst-saves/${id}`);
    setSaves((prev) => prev.filter((s) => s.id !== id));
  }

  function startEdit(s: Save) {
    setEditing(s.id);
    setEditMeta({ sector: s.sector || '', industry: s.industry || '', market_cap: s.market_cap || '' });
  }

  async function saveEdit(id: string) {
    const { data } = await axios.patch(`${API}/catalyst-saves/${id}`, editMeta);
    setSaves((prev) => prev.map((s) => s.id === id ? { ...s, ...data } : s));
    setEditing(null);
  }

  async function refreshMeta(s: Save) {
    setFetchingMeta(s.id);
    try {
      const { data: meta } = await axios.get(`${API}/ticker-meta/${s.ticker}`);
      const { data: updated } = await axios.patch(`${API}/catalyst-saves/${s.id}`, {
        sector: meta.sector || s.sector || '',
        industry: meta.industry || s.industry || '',
        market_cap: meta.market_cap || s.market_cap || '',
      });
      setSaves((prev) => prev.map((x) => x.id === s.id ? { ...x, ...updated } : x));
    } catch {
      // ignore
    } finally {
      setFetchingMeta(null);
    }
  }

  // Autocomplete: when typing filter by symbol/name; when empty show top P/E stocks
  const q = query.trim().toUpperCase();
  const dropdownStocks = q
    ? stocks
        .filter((s) => s.symbol.startsWith(q) || s.symbol.includes(q) || s.companyName?.toUpperCase().includes(q))
        .slice(0, 8)
    : stocks.slice(0, 8);

  // Recent tickers from saves (unique, preserve order)
  const recentTickers = Array.from(new Set(saves.map((s) => s.ticker))).slice(0, 8);

  // Saved queries grouping
  const sectorTabs = ['ALL', ...Array.from(new Set(saves.map((s) => s.sector).filter(Boolean))) as string[]];
  const filtered = saves.filter((s) => activeSector === 'ALL' || s.sector === activeSector);
  const grouped = filtered.reduce<Record<string, Save[]>>((acc, s) => {
    (acc[s.ticker] = acc[s.ticker] || []).push(s);
    return acc;
  }, {});

  return (
    <div>
      {/* ── Hero search ── */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.12em', marginBottom: 20 }}>
          CATALYST BRAIN
        </div>

        <div ref={searchRef} style={{ position: 'relative', maxWidth: 540 }}>
          <div style={{ display: 'flex', gap: 0 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { go(query); setDropdownOpen(false); }
                if (e.key === 'Escape') setDropdownOpen(false);
              }}
              placeholder="Search ticker or company…"
              style={{
                flex: 1,
                fontFamily: 'var(--font-mono)',
                fontSize: 20,
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '14px 18px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRight: 'none',
                borderRadius: '4px 0 0 4px',
                color: 'var(--text)',
                outline: 'none',
              }}
              autoFocus
            />
            <button
              onClick={() => { go(query); setDropdownOpen(false); }}
              style={{
                background: 'var(--blue)', border: 'none', color: '#000',
                padding: '14px 24px', borderRadius: '0 4px 4px 0',
                fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              GO →
            </button>
          </div>

          {/* Autocomplete dropdown */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, zIndex: 100,
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              overflow: 'hidden',
            }}>
              {stocksLoading && (
                <div style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>Loading stocks…</div>
              )}
              {!stocksLoading && fmpError && (
                <div style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                  Could not load screener — type any ticker and press Enter.
                </div>
              )}
              {!stocksLoading && !fmpError && dropdownStocks.length === 0 && (
                <div style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>No matches.</div>
              )}
              {!fmpError && dropdownStocks.length > 0 && (
                <>
                  <div style={{ padding: '6px 16px 4px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', borderBottom: '1px solid var(--border)' }}>
                    {q ? 'RESULTS' : 'HIGHEST P/E'}
                  </div>
                  {dropdownStocks.map((s) => (
                    <div
                      key={s.symbol}
                      onMouseDown={() => { go(s.symbol); setDropdownOpen(false); setQuery(''); }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '72px 1fr 90px 56px',
                        gap: 8,
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        alignItems: 'center',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{s.symbol}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.companyName}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.sector || '—'}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--yellow)', textAlign: 'right' }}>{s.pe?.toFixed(1)}x</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent tickers ── */}
      {recentTickers.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 10 }}>RECENT</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {recentTickers.map((t) => (
              <button
                key={t}
                onClick={() => go(t)}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  color: 'var(--text)', padding: '6px 16px', borderRadius: 4,
                  fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Saved queries ── */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 14 }}>SAVED QUERIES</div>

      {/* Sector tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 16, overflowX: 'auto' }}>
        {sectorTabs.map((sector) => (
          <button
            key={sector}
            onClick={() => setActiveSector(sector)}
            style={{
              background: 'none', border: 'none',
              borderBottom: `2px solid ${activeSector === sector ? 'var(--blue)' : 'transparent'}`,
              color: activeSector === sector ? 'var(--text)' : 'var(--muted)',
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em',
              padding: '8px 16px', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {sector.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Epic filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>EPIC</span>
        <select
          value={filterEpic}
          onChange={(e) => setFilterEpic(e.target.value)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 8px', borderRadius: 4 }}
        >
          <option value="">All</option>
          {EPICS.map((e) => <option key={e} value={e}>{e.toUpperCase()}</option>)}
        </select>
      </div>

      {saves.length === 0 && (
        <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>No saved queries yet. Searches are saved automatically.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.entries(grouped).map(([ticker, tickerSaves]) => (
          <div key={ticker}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15 }}>{ticker}</span>
              {tickerSaves[0].sector && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: 2 }}>
                  {tickerSaves[0].sector}
                </span>
              )}
              {tickerSaves[0].industry && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>{tickerSaves[0].industry}</span>
              )}
              {tickerSaves[0].market_cap && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--yellow)' }}>{tickerSaves[0].market_cap}</span>
              )}
              <button
                onClick={() => navigate(`/catalyst-brain/${ticker}`)}
                style={{
                  marginLeft: 'auto', background: 'none', border: '1px solid var(--border)',
                  color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 10,
                  cursor: 'pointer', padding: '2px 8px', borderRadius: 3,
                }}
              >
                OPEN ↗
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {tickerSaves.map((s) => (
                <div key={s.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4 }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'pointer' }}
                    onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--blue)', border: '1px solid var(--blue)', padding: '2px 6px', borderRadius: 2, minWidth: 68, textAlign: 'center' }}>
                      {s.epic.toUpperCase()}
                    </span>
                    <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
                      {new Date(s.saved_at).toLocaleDateString()}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
                      {expanded === s.id ? '▲' : '▼'}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); editing === s.id ? setEditing(null) : startEdit(s); }}
                      style={{ background: 'none', border: 'none', color: editing === s.id ? 'var(--blue)' : 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer', padding: '0 4px' }}
                      title="Edit metadata"
                    >
                      ✎
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSave(s.id); }}
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 16, cursor: 'pointer', padding: 0 }}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>

                  {editing === s.id && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>SECTOR</div>
                        <select
                          value={editMeta.sector}
                          onChange={(e) => setEditMeta((m) => ({ ...m, sector: e.target.value }))}
                          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 6px', borderRadius: 4 }}
                        >
                          <option value="">— none —</option>
                          {SECTORS.map((sec) => <option key={sec} value={sec}>{sec}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>INDUSTRY</div>
                        <input
                          value={editMeta.industry}
                          onChange={(e) => setEditMeta((m) => ({ ...m, industry: e.target.value }))}
                          placeholder="e.g. Regional Banks"
                          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 6px', borderRadius: 4, width: 160 }}
                        />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>MARKET CAP</div>
                        <select
                          value={editMeta.market_cap}
                          onChange={(e) => setEditMeta((m) => ({ ...m, market_cap: e.target.value }))}
                          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 6px', borderRadius: 4 }}
                        >
                          <option value="">— none —</option>
                          {MARKET_CAPS.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <button
                        onClick={() => saveEdit(s.id)}
                        style={{ background: 'var(--blue)', border: 'none', color: '#000', padding: '5px 14px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                      >
                        SAVE
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); refreshMeta(s); }}
                        disabled={fetchingMeta === s.id}
                        style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', padding: '5px 12px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer' }}
                        title="Auto-fill from Yahoo Finance"
                      >
                        {fetchingMeta === s.id ? 'FETCHING...' : 'AUTO-FILL'}
                      </button>
                    </div>
                  )}

                  {expanded === s.id && editing !== s.id && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '16px' }}>
                      <EpicView epic={s.epic} data={s.data} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
