import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE || '/api';

const GICS_ORDER = [
  'Information Technology',
  'Financials',
  'Health Care',
  'Consumer Discretionary',
  'Consumer Staples',
  'Industrials',
  'Communication Services',
  'Energy',
  'Materials',
  'Utilities',
  'Real Estate',
];

interface TickerRecord {
  ticker: string;
  company_name: string | null;
  gics_sector: string | null;
  gics_industry: string | null;
  market_cap: number | null;
  forward_pe: number | null;
  last_updated: string;
}

function fmtCap(n: number | null): string {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  return `$${(n / 1e6).toFixed(1)}M`;
}

export default function Tickers() {
  const [tickers, setTickers] = useState<TickerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/tickers`)
      .then(({ data }) => setTickers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group by sector, preserve GICS order
  const bySector = tickers.reduce<Record<string, TickerRecord[]>>((acc, t) => {
    const key = t.gics_sector || 'Unclassified';
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  const sectorKeys = [
    ...GICS_ORDER.filter((s) => bySector[s]),
    ...Object.keys(bySector).filter((s) => !GICS_ORDER.includes(s)),
  ];

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 20 }}>
        TICKERS
      </h1>

      {loading && (
        <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>Loading…</div>
      )}

      {!loading && tickers.length === 0 && (
        <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          No tickers yet — search a ticker in Catalyst Brain to populate this list.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {sectorKeys.map((sector) => (
          <div key={sector}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--blue)', letterSpacing: '0.1em', marginBottom: 10, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
              {sector.toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 140px 90px 70px', gap: 8, padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.08em' }}>
                <span>TICKER</span>
                <span>INDUSTRY</span>
                <span>COMPANY</span>
                <span style={{ textAlign: 'right' }}>MKT CAP</span>
                <span style={{ textAlign: 'right' }}>FWD P/E</span>
              </div>
              {bySector[sector].map((t) => (
                <div
                  key={t.ticker}
                  onClick={() => navigate(`/catalyst-brain/${t.ticker}`)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '70px 1fr 140px 90px 70px',
                    gap: 8,
                    padding: '8px 8px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 3,
                    cursor: 'pointer',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13 }}>{t.ticker}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.gics_industry || '—'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.company_name || '—'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, textAlign: 'right' }}>
                    {fmtCap(t.market_cap)}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: t.forward_pe ? 'var(--yellow)' : 'var(--muted)', textAlign: 'right' }}>
                    {t.forward_pe ? `${t.forward_pe.toFixed(1)}x` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
