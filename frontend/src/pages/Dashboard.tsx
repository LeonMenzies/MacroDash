import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

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
}

function IndicatorCard({ ind }: { ind: Indicator }) {
  const isPos = ind.change !== null && ind.change > 0;
  const isNeg = ind.change !== null && ind.change < 0;
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 4,
      padding: '12px 16px',
      minWidth: 160,
    }}>
      <div style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
        {ind.label}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700 }}>
        {ind.value !== null ? ind.value.toFixed(2) : '—'}
      </div>
      <div style={{ fontSize: 11, marginTop: 4, color: isPos ? 'var(--green)' : isNeg ? 'var(--red)' : 'var(--muted)' }}>
        {ind.change !== null ? `${isPos ? '+' : ''}${ind.change.toFixed(2)}` : ''}{' '}
        <span style={{ color: 'var(--muted)' }}>{ind.date}</span>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 4 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--blue)' }}>
        {payload[0].value?.toFixed(2)}%
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [yieldCurve, setYieldCurve] = useState<YieldPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API}/macro/indicators`),
      axios.get(`${API}/macro/yield-curve`),
    ])
      .then(([indRes, ycRes]) => {
        setIndicators(indRes.data);
        setYieldCurve(ycRes.data);
        setError(null);
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 20 }}>
        MACRO DASHBOARD
      </h1>

      {error && (
        <div style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 16 }}>
          {error.includes('FRED_API_KEY') || error.includes('401')
            ? 'FRED API key not configured. Set FRED_API_KEY in .env'
            : error}
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>Loading...</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
            {indicators.map((ind) => <IndicatorCard key={ind.id} ind={ind} />)}
          </div>

          {yieldCurve.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '16px 20px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 16, letterSpacing: '0.08em' }}>
                US TREASURY YIELD CURVE
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={yieldCurve} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="var(--border)" />
                  <Line type="monotone" dataKey="yield" stroke="var(--blue)" strokeWidth={2} dot={{ fill: 'var(--blue)', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
