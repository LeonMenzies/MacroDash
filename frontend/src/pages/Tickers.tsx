import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE || '/api';

const GICS_ORDER = [
  'Information Technology', 'Financials', 'Health Care', 'Consumer Discretionary',
  'Consumer Staples', 'Industrials', 'Communication Services', 'Energy',
  'Materials', 'Utilities', 'Real Estate',
];

type Stance = 'bullish' | 'bearish' | 'neutral' | null;
type SortKey = 'ticker' | 'last_price' | 'market_cap' | 'forward_pe' | 'beta' | 'next_earnings_date';
type SortDir = 'asc' | 'desc';

interface TickerRecord {
  ticker: string;
  company_name: string | null;
  gics_sector: string | null;
  gics_industry: string | null;
  market_cap: number | null;
  forward_pe: number | null;
  last_price: number | null;
  beta: number | null;
  next_earnings_date: string | null;
  last_updated: string;
  stance: Stance;
}

function fmtCap(n: number | null): string {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  return `$${(n / 1e6).toFixed(1)}M`;
}

function fmtDate(s: string | null): string {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const STANCE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  bullish: { label: 'BULL', color: 'var(--green)', bg: 'rgba(34,212,138,0.12)' },
  bearish: { label: 'BEAR', color: 'var(--red)',   bg: 'rgba(240,87,112,0.12)' },
  neutral: { label: 'NEUT', color: 'var(--yellow)', bg: 'rgba(245,200,66,0.12)' },
};

function StanceChip({ stance, onClick }: { stance: Stance; onClick: (e: React.MouseEvent) => void }) {
  const cfg = stance ? STANCE_CONFIG[stance] : null;
  return (
    <button
      onClick={onClick}
      title="Click to cycle stance"
      style={{
        background: cfg?.bg || 'var(--surface2)',
        border: `1px solid ${cfg?.color || 'var(--border)'}`,
        borderRadius: 3, color: cfg?.color || 'var(--muted)',
        fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
        letterSpacing: '0.06em', padding: '2px 6px', cursor: 'pointer',
        flexShrink: 0, whiteSpace: 'nowrap',
      }}
    >
      {cfg?.label || '···'}
    </button>
  );
}

const COLS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'ticker',            label: 'TICKER' },
  { key: 'last_price',        label: 'PRICE',    align: 'right' },
  { key: 'market_cap',        label: 'MKT CAP',  align: 'right' },
  { key: 'forward_pe',        label: 'FWD P/E',  align: 'right' },
  { key: 'beta',              label: 'BETA',     align: 'right' },
  { key: 'next_earnings_date',label: 'EARNINGS', align: 'right' },
];

function sortTickers(list: TickerRecord[], key: SortKey, dir: SortDir): TickerRecord[] {
  return [...list].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return dir === 'asc' ? cmp : -cmp;
  });
}

function SortHeader({ col, sortKey, sortDir, onSort }: {
  col: typeof COLS[0]; sortKey: SortKey; sortDir: SortDir; onSort: (k: SortKey) => void;
}) {
  const active = sortKey === col.key;
  return (
    <span
      onClick={() => onSort(col.key)}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, color: active ? 'var(--blue)' : 'var(--muted)',
        letterSpacing: '0.08em', cursor: 'pointer', userSelect: 'none',
        textAlign: col.align, display: 'block',
      }}
    >
      {col.label}{active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
    </span>
  );
}

export default function Tickers() {
  const [tickers, setTickers] = useState<TickerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('ticker');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/tickers`)
      .then(({ data }) => setTickers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  function cycleStance(ticker: string, current: Stance) {
    const order: Stance[] = [null, 'bullish', 'neutral', 'bearish'];
    const next = order[(order.indexOf(current) + 1) % order.length];
    axios.patch(`${API}/tickers/${ticker}`, { stance: next }).catch(() => {});
    setTickers((prev) => prev.map((t) => t.ticker === ticker ? { ...t, stance: next } : t));
  }

  function removeTicker(ticker: string) {
    axios.delete(`${API}/tickers/${ticker}`).catch(() => {});
    setTickers((prev) => prev.filter((t) => t.ticker !== ticker));
  }

  const bySector = tickers.reduce<Record<string, TickerRecord[]>>((acc, t) => {
    const key = t.gics_sector || 'Unclassified';
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  const sectorKeys = [
    ...GICS_ORDER.filter((s) => bySector[s]),
    ...Object.keys(bySector).filter((s) => !GICS_ORDER.includes(s)),
  ];

  const GRID = '70px 90px 100px 80px 60px 90px 42px 28px';

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 20 }}>
        WATCHLIST
      </h1>

      {loading && <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>Loading…</div>}

      {!loading && tickers.length === 0 && (
        <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          No tickers yet — search a ticker to add it to your watchlist.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {sectorKeys.map((sector) => {
          const sorted = sortTickers(bySector[sector], sortKey, sortDir);
          return (
            <div key={sector}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--blue)', letterSpacing: '0.1em', marginBottom: 10, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                {sector.toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Sortable header */}
                <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 8, padding: '4px 8px' }}>
                  {COLS.map((col) => (
                    <SortHeader key={col.key} col={col} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  ))}
                  <span></span>
                  <span></span>
                </div>
                {sorted.map((t) => (
                  <div
                    key={t.ticker}
                    style={{
                      display: 'grid', gridTemplateColumns: GRID, gap: 8,
                      padding: '8px 8px', background: 'var(--surface)',
                      border: '1px solid var(--border)', borderRadius: 3, alignItems: 'center',
                    }}
                  >
                    <span
                      onClick={() => navigate(`/stock/${t.ticker}`)}
                      style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: 'var(--blue)' }}
                    >
                      {t.ticker}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, textAlign: 'right' }}>
                      {t.last_price != null ? `$${t.last_price.toFixed(2)}` : '—'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, textAlign: 'right' }}>
                      {fmtCap(t.market_cap)}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: t.forward_pe ? 'var(--yellow)' : 'var(--muted)', textAlign: 'right' }}>
                      {t.forward_pe ? `${t.forward_pe.toFixed(1)}x` : '—'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text2)', textAlign: 'right' }}>
                      {t.beta != null ? t.beta.toFixed(2) : '—'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', textAlign: 'right' }}>
                      {fmtDate(t.next_earnings_date)}
                    </span>
                    <StanceChip
                      stance={t.stance}
                      onClick={(e) => { e.stopPropagation(); cycleStance(t.ticker, t.stance); }}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeTicker(t.ticker); }}
                      title="Remove from watchlist"
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', padding: 0, lineHeight: 1, textAlign: 'center' }}
                    >×</button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
