import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { EpicView, type EpicKey } from '../components/EpicViews';

const API = import.meta.env.VITE_API_BASE || '/api';
const TEST_TICKERS = ['RF', 'CCL', 'EPAM', 'CENX'];
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
  const [input, setInput] = useState('');
  const navigate = useNavigate();
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

  useEffect(() => { loadSaves(); }, [filterEpic]);

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

  // Derive sector tabs from actual data
  const sectorTabs = ['ALL', ...Array.from(new Set(saves.map((s) => s.sector).filter(Boolean))) as string[]];

  const filtered = saves.filter((s) => {
    if (activeSector !== 'ALL' && s.sector !== activeSector) return false;
    return true;
  });

  // Group filtered saves by ticker for display
  const grouped = filtered.reduce<Record<string, Save[]>>((acc, s) => {
    (acc[s.ticker] = acc[s.ticker] || []).push(s);
    return acc;
  }, {});

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 20 }}>
        CATALYST BRAIN
      </h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 32, maxWidth: 400 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && go(input)}
          placeholder="Enter ticker (e.g. AAPL)"
          style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 14, textTransform: 'uppercase' }}
        />
        <button
          onClick={() => go(input)}
          style={{
            background: 'var(--blue)', border: 'none', color: '#000',
            padding: '6px 18px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontWeight: 700,
          }}
        >
          GO
        </button>
      </div>

      <div style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 12, letterSpacing: '0.08em' }}>
        WATCHLIST
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
        {TEST_TICKERS.map((t) => (
          <button
            key={t}
            onClick={() => go(t)}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--text)', padding: '6px 16px', borderRadius: 4,
              fontFamily: 'var(--font-mono)', fontSize: 13,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Saved queries */}
      <div style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 14, letterSpacing: '0.08em' }}>
        SAVED QUERIES
      </div>

      {/* Sector tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 16, overflowX: 'auto' }}>
        {sectorTabs.map((sector) => (
          <button
            key={sector}
            onClick={() => setActiveSector(sector)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeSector === sector ? 'var(--blue)' : 'transparent'}`,
              color: activeSector === sector ? 'var(--text)' : 'var(--muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.06em',
              padding: '8px 16px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
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
            {/* Ticker header */}
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
                title="Re-run analysis (uses credits)"
                style={{
                  marginLeft: 'auto', background: 'none', border: '1px solid var(--border)',
                  color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 10,
                  cursor: 'pointer', padding: '2px 8px', borderRadius: 3,
                }}
              >
                RE-RUN ↗
              </button>
            </div>

            {/* Epic rows */}
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
