import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE || '/api';
const TEST_TICKERS = ['RF', 'CCL', 'EPAM', 'CENX'];
const EPICS = ['latent', 'definitive', 'horizon', 'macro'];
const SECTORS = ['Technology', 'Financials', 'Healthcare', 'Industrials', 'Consumer Discretionary', 'Consumer Staples', 'Energy', 'Materials', 'Real Estate', 'Utilities', 'Communication Services'];
const MARKET_CAPS = ['Large Cap', 'Mid Cap', 'Small Cap', 'Micro Cap'];

interface Save {
  id: string;
  ticker: string;
  epic: string;
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
  const [filterSector, setFilterSector] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editMeta, setEditMeta] = useState({ sector: '', industry: '', market_cap: '' });

  function go(ticker: string) {
    const t = ticker.trim().toUpperCase();
    if (t) navigate(`/catalyst-brain/${t}`);
  }

  async function loadSaves() {
    try {
      const params: Record<string, string> = {};
      if (filterEpic) params.epic = filterEpic;
      if (filterSector) params.sector = filterSector;
      const res = await axios.get(`${API}/catalyst-saves`, { params });
      setSaves(res.data);
    } catch {
      // ignore
    }
  }

  useEffect(() => { loadSaves(); }, [filterEpic, filterSector]);

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

  const sectors = Array.from(new Set(saves.map((s) => s.sector).filter(Boolean))) as string[];

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

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          value={filterEpic}
          onChange={(e) => setFilterEpic(e.target.value)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 8px', borderRadius: 4 }}
        >
          <option value="">All Epics</option>
          {EPICS.map((e) => <option key={e} value={e}>{e.toUpperCase()}</option>)}
        </select>
        <select
          value={filterSector}
          onChange={(e) => setFilterSector(e.target.value)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 8px', borderRadius: 4 }}
        >
          <option value="">All Sectors</option>
          {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {saves.length === 0 && (
        <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>No saved queries yet. Searches are saved automatically.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {saves.map((s) => (
          <div key={s.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4 }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer' }}
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, minWidth: 60 }}>{s.ticker}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--blue)', border: '1px solid var(--blue)', padding: '2px 6px', borderRadius: 2 }}>
                {s.epic.toUpperCase()}
              </span>
              {s.sector && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>{s.sector}</span>}
              {s.industry && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>· {s.industry}</span>}
              {s.market_cap && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--yellow)' }}>{s.market_cap}</span>}
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
                {new Date(s.saved_at).toLocaleDateString()}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/catalyst-brain/${s.ticker}`); }}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer', padding: '0 4px' }}
                title="Open ticker"
              >
                ↗
              </button>
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
              <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
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
              </div>
            )}

            {expanded === s.id && editing !== s.id && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
                <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', whiteSpace: 'pre-wrap', margin: 0 }}>
                  {JSON.stringify(s.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
