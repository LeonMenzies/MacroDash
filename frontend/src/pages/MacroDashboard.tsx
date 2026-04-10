import { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API = import.meta.env.VITE_API_BASE || '/api';

interface Indicator {
  id: string;
  label: string;
  value: number | null;
  date: string;
  change: number | null;
}

interface YieldPoint {
  label: string;
  yield: number;
  date: string;
}

const INDICATOR_FORMAT: Record<string, { suffix: string; decimals: number }> = {
  STLFSI4: { suffix: '', decimals: 2 },
  UNRATE: { suffix: '%', decimals: 1 },
  CPIAUCSL: { suffix: '', decimals: 1 },
  DGS10: { suffix: '%', decimals: 2 },
  BAMLH0A0HYM2: { suffix: 'bps', decimals: 0 },
  FEDFUNDS: { suffix: '%', decimals: 2 },
};

function fmt(id: string, value: number | null): string {
  if (value === null) return '—';
  const { suffix, decimals } = INDICATOR_FORMAT[id] || { suffix: '', decimals: 2 };
  const n = id === 'BAMLH0A0HYM2' ? (value * 100).toFixed(decimals) : value.toFixed(decimals);
  return `${n}${suffix}`;
}

function changeColor(change: number | null): string {
  if (change === null) return 'var(--muted)';
  return change > 0 ? 'var(--red)' : 'var(--green)';
}

export default function MacroDashboard() {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [yieldCurve, setYieldCurve] = useState<YieldPoint[]>([]);
  const [macroText, setMacroText] = useState('');
  const [regime, setRegime] = useState<string | null>(null);
  const [regimeLoading, setRegimeLoading] = useState(false);
  const [regimeError, setRegimeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/macro/indicators`),
      axios.get(`${API}/macro/yield-curve`),
    ])
      .then(([ind, yc]) => {
        setIndicators(ind.data);
        setYieldCurve(yc.data);
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, []);

  async function summariseRegime() {
    if (!macroText.trim()) return;
    setRegimeLoading(true);
    setRegimeError(null);
    setRegime(null);
    try {
      const res = await axios.post(`${API}/macro/regime`, { text: macroText });
      setRegime(res.data.summary);
    } catch (err: any) {
      setRegimeError(err.response?.data?.error || err.message);
    } finally {
      setRegimeLoading(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 20 }}>
        MACRO DASHBOARD
      </h1>

      {loading && <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>Loading FRED data...</div>}
      {error && <div style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{error}</div>}

      {indicators.length > 0 && (
        <div className="grid-3" style={{ marginBottom: 24 }}>
          {indicators.map((ind) => (
            <div
              key={ind.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '14px 18px',
              }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 8 }}>
                {ind.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700 }}>
                  {fmt(ind.id, ind.value)}
                </span>
                {ind.change !== null && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: changeColor(ind.change) }}>
                    {ind.change > 0 ? '+' : ''}{ind.id === 'BAMLH0A0HYM2' ? (ind.change * 100).toFixed(0) : ind.change.toFixed(2)}
                  </span>
                )}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                {ind.date}
              </div>
            </div>
          ))}
        </div>
      )}

      {yieldCurve.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '14px 18px', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 16 }}>
            YIELD CURVE — {yieldCurve[0]?.date}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={yieldCurve}>
              <XAxis
                dataKey="label"
                tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--muted)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--muted)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                width={40}
              />
              <Tooltip
                contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                formatter={(v: number) => [`${v.toFixed(2)}%`, 'Yield']}
              />
              <Line type="monotone" dataKey="yield" stroke="var(--blue)" dot={{ r: 3, fill: 'var(--blue)' }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '14px 18px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 12 }}>
          MACRO REGIME — PASTE & SUMMARISE
        </div>
        <textarea
          value={macroText}
          onChange={(e) => setMacroText(e.target.value)}
          placeholder="Paste macro commentary, Fed minutes, economic data..."
          rows={6}
          style={{
            width: '100%',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            padding: '10px 12px',
            borderRadius: 4,
            resize: 'vertical',
            boxSizing: 'border-box',
            marginBottom: 10,
          }}
        />
        <button
          onClick={summariseRegime}
          disabled={regimeLoading || !macroText.trim()}
          style={{
            background: regimeLoading ? 'var(--surface2)' : 'var(--blue)',
            border: 'none',
            color: regimeLoading ? 'var(--muted)' : '#000',
            padding: '6px 18px',
            borderRadius: 4,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: 12,
            cursor: regimeLoading ? 'default' : 'pointer',
          }}
        >
          {regimeLoading ? 'ANALYSING...' : 'SUMMARISE'}
        </button>

        {regimeError && (
          <div style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 12 }}>{regimeError}</div>
        )}

        {regime && (
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            lineHeight: 1.7,
            color: 'var(--text)',
            whiteSpace: 'pre-wrap',
          }}>
            {regime}
          </div>
        )}
      </div>
    </div>
  );
}
