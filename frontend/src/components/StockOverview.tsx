import { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API = import.meta.env.VITE_API_BASE || '/api';

const PERIODS = ['1mo', '3mo', '6mo', '1y', '2y'];

interface StockQuote {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  exchange: string;
  currency: string;
  price: string;
  price_raw: number | null;
  change: string;
  change_pct: string;
  positive: boolean;
  week_52_high: string;
  week_52_low: string;
  week52_pos: number | null;
  market_cap: string;
  pe_ratio: string;
  forward_pe: string;
  peg_ratio: string;
  pb_ratio: string;
  ps_ratio: string;
  ev_ebitda: string;
  ev: string;
  eps: string;
  forward_eps: string;
  revenue: string;
  gross_profit: string;
  ebitda: string;
  net_income: string;
  free_cashflow: string;
  total_cash: string;
  total_debt: string;
  de_ratio: string;
  profit_margin: string;
  profit_margin_raw: number | null;
  operating_margin: string;
  operating_margin_raw: number | null;
  gross_margin: string;
  gross_margin_raw: number | null;
  revenue_growth: string;
  revenue_growth_raw: number | null;
  earnings_growth: string;
  earnings_growth_raw: number | null;
  return_on_equity: string;
  return_on_assets: string;
  dividend_yield: string;
  dividend_rate: string;
  payout_ratio: string;
  shares_outstanding: string;
  float_shares: string;
  short_ratio: string;
  short_pct_float: string;
  short_pct_raw: number | null;
  beta: string;
  beta_raw: number | null;
  target_high: string;
  target_high_raw: number | null;
  target_low: string;
  target_low_raw: number | null;
  target_mean: string;
  target_mean_raw: number | null;
  recommendation: string;
  num_analysts: string;
  day_high: string;
  day_low: string;
  fifty_day_avg: string;
  two_hundred_day_avg: string;
  volume: string;
  avg_volume: string;
  description: string;
}

interface QualData {
  catalysts: string[];
  headwinds: string[];
  moat: string;
  bull_case: string;
  bear_case: string;
}

interface HistPoint { date: string; close: number; }

function MetricRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'right', fontFamily: 'var(--font-mono)', marginLeft: 8 }}>{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '16px 18px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--blue)', marginBottom: 12, textTransform: 'uppercase' }}>{title}</div>
      {children}
    </div>
  );
}

function MarginBar({ label, value, raw, color }: { label: string; value: string; raw: number | null; color: string }) {
  const pct = raw != null ? Math.min(Math.max(raw * 100, 0), 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>{raw != null ? value : 'N/A'}</span>
      </div>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99 }} />
      </div>
    </div>
  );
}

function recStyle(rec: string) {
  const r = rec.toLowerCase();
  if (r.includes('strong buy') || r === 'buy') return { bg: 'rgba(46,204,135,0.15)', color: 'var(--green)', border: 'var(--green)' };
  if (r === 'hold' || r === 'neutral') return { bg: 'rgba(245,200,66,0.15)', color: 'var(--yellow)', border: 'var(--yellow)' };
  if (r.includes('sell') || r.includes('underperform')) return { bg: 'rgba(255,85,85,0.15)', color: 'var(--red)', border: 'var(--red)' };
  return { bg: 'var(--border)', color: 'var(--muted)', border: 'var(--border)' };
}

export default function StockOverview({ ticker }: { ticker: string }) {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [quoteErr, setQuoteErr] = useState<string | null>(null);
  const [history, setHistory] = useState<HistPoint[]>([]);
  const [activePeriod, setActivePeriod] = useState('6mo');
  const [chartLoading, setChartLoading] = useState(false);
  const [qual, setQual] = useState<QualData | null>(null);
  const [qualLoading, setQualLoading] = useState(false);
  const [qualErr, setQualErr] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    setQuote(null);
    setQuoteErr(null);
    setQual(null);
    setQualErr(null);
    setHistory([]);
    setShowFull(false);
    axios.get(`${API}/stock/${ticker}/quote`)
      .then(({ data }) => setQuote(data))
      .catch((err) => setQuoteErr(err.response?.data?.error || err.message));
  }, [ticker]);

  useEffect(() => {
    if (!quote) return;
    setQualLoading(true);
    setQualErr(null);
    axios.get(`${API}/stock/${ticker}/qualitative`, {
      params: { name: quote.name, sector: quote.sector, industry: quote.industry },
    })
      .then(({ data }) => setQual(data))
      .catch((err) => setQualErr(err.response?.data?.error || err.message))
      .finally(() => setQualLoading(false));
  }, [ticker, quote?.name]);

  const loadChart = (p: string) => {
    setActivePeriod(p);
    setChartLoading(true);
    axios.get(`${API}/stock/${ticker}/history`, { params: { period: p } })
      .then(({ data }) => {
        setHistory(data.dates.map((d: string, i: number) => ({ date: d, close: data.closes[i] })));
      })
      .catch(() => {})
      .finally(() => setChartLoading(false));
  };

  useEffect(() => { loadChart('6mo'); }, [ticker]);

  if (quoteErr) {
    return <div style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '20px 0' }}>{quoteErr}</div>;
  }
  if (!quote) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[180, 80, 220, 140].map((h, i) => (
          <div key={i} style={{ height: h, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6 }} />
        ))}
      </div>
    );
  }

  const isUp = quote.positive;
  const lineColor = isUp ? 'var(--green)' : 'var(--red)';

  const lo = quote.target_low_raw;
  const hi = quote.target_high_raw;
  const mean = quote.target_mean_raw;
  const curr = quote.price_raw;

  let meanPos = '50', currPos = '50';
  if (lo && hi && curr && hi !== lo) {
    meanPos = (((mean ?? curr) - lo) / (hi - lo) * 100).toFixed(1);
    currPos = Math.min(Math.max(((curr - lo) / (hi - lo) * 100), 0), 100).toFixed(1);
  }
  const upside = mean && curr ? (((mean - curr) / curr) * 100).toFixed(1) : null;

  const desc = quote.description;
  const shortDesc = desc.length > 320 ? desc.slice(0, 320) + '…' : desc;
  const rec = recStyle(quote.recommendation);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--bg) 100%)', border: '1px solid var(--border)', borderRadius: 8, padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2 }}>{quote.name}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(91,163,255,0.15)', border: '1px solid rgba(91,163,255,0.3)', borderRadius: 4, color: 'var(--blue)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, padding: '2px 7px' }}>{quote.ticker}</span>
              <span style={{ background: 'var(--border)', borderRadius: 4, color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 7px' }}>{quote.exchange}</span>
              {quote.sector !== 'N/A' && <span style={{ background: 'var(--border)', borderRadius: 4, color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 7px' }}>{quote.sector}</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '-1px' }}>{quote.price}</div>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: isUp ? 'var(--green)' : 'var(--red)', marginTop: 3 }}>
              {quote.change} · {quote.change_pct}
            </div>
          </div>
        </div>

        {quote.week52_pos != null && (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 5 }}>
              <span>52W Low {quote.week_52_low}</span>
              <span>{quote.week52_pos}% of range</span>
              <span>52W High {quote.week_52_high}</span>
            </div>
            <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 99, background: 'linear-gradient(90deg, var(--red), var(--yellow), var(--green))' }} />
              <div style={{ width: 12, height: 12, background: '#fff', border: '2px solid var(--blue)', borderRadius: '50%', position: 'absolute', top: '50%', left: `${quote.week52_pos}%`, transform: 'translate(-50%, -50%)' }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick stats — 4-col, 2-col on mobile */}
      <div className="grid-4">
        {[
          { label: 'Market Cap', value: quote.market_cap, sub: `${quote.exchange} · ${quote.currency}`, accent: 'var(--blue)' },
          { label: 'P/E Ratio', value: quote.pe_ratio, sub: `Fwd: ${quote.forward_pe}`, accent: 'var(--green)' },
          { label: 'EPS (TTM)', value: quote.eps, sub: `Fwd: ${quote.forward_eps}`, accent: 'var(--yellow)' },
          { label: 'Profit Margin', value: quote.profit_margin, sub: `Op: ${quote.operating_margin}`, accent: 'var(--red)' },
        ].map(({ label, value, sub, accent }) => (
          <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '14px 16px', borderTop: `2px solid ${accent}` }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800 }}>{value}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Price chart */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>PRICE HISTORY</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {PERIODS.map((p) => (
              <button key={p} onClick={() => loadChart(p)} style={{
                background: activePeriod === p ? 'rgba(91,163,255,0.15)' : 'transparent',
                border: `1px solid ${activePeriod === p ? 'var(--blue)' : 'var(--border)'}`,
                color: activePeriod === p ? 'var(--blue)' : 'var(--muted)',
                borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                padding: '3px 8px', cursor: 'pointer',
              }}>
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: 200, position: 'relative' }}>
          {chartLoading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12, zIndex: 1 }}>
              Loading…
            </div>
          )}
          {history.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={lineColor} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 9, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} minTickGap={50} />
                <YAxis orientation="right" tick={{ fill: 'var(--muted)', fontSize: 9, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} domain={['auto', 'auto']} width={54} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 11 }}
                  labelStyle={{ color: 'var(--muted)' }}
                  itemStyle={{ color: lineColor }}
                  formatter={(v: number) => [`$${v.toFixed(2)}`, 'Close']}
                />
                <Area type="monotone" dataKey="close" stroke={lineColor} strokeWidth={1.5} fill={`url(#grad-${ticker})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* AI Analysis */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0 }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--blue)', textTransform: 'uppercase' }}>AI Analysis — Catalysts & Risks</div>
        </div>
        {qualLoading && (
          <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>Generating qualitative analysis…</div>
        )}
        {qualErr && (
          <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{qualErr}</div>
        )}
        {qual && !qualLoading && (
          <div>
            {(qual.catalysts || qual.headwinds) && (
              <div className="grid-2" style={{ marginBottom: 14 }}>
                {qual.catalysts && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>▲ Catalysts</div>
                    {qual.catalysts.map((c, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, padding: '7px 9px', borderRadius: 5, marginBottom: 5, background: 'rgba(46,204,135,0.08)', fontSize: 12, lineHeight: 1.5 }}>
                        <span style={{ color: 'var(--green)', flexShrink: 0 }}>✦</span>
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                )}
                {qual.headwinds && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>▼ Headwinds</div>
                    {qual.headwinds.map((h, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, padding: '7px 9px', borderRadius: 5, marginBottom: 5, background: 'rgba(255,85,85,0.08)', fontSize: 12, lineHeight: 1.5 }}>
                        <span style={{ color: 'var(--red)', flexShrink: 0 }}>▸</span>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {(qual.bull_case || qual.bear_case) && (
              <div className="grid-2" style={{ marginBottom: 12 }}>
                {qual.bull_case && (
                  <div style={{ background: 'rgba(46,204,135,0.08)', border: '1px solid rgba(46,204,135,0.2)', borderRadius: 6, padding: 12 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 800, color: 'var(--green)', letterSpacing: '0.08em', marginBottom: 6 }}>BULL CASE</div>
                    <p style={{ fontSize: 12, lineHeight: 1.6 }}>{qual.bull_case}</p>
                  </div>
                )}
                {qual.bear_case && (
                  <div style={{ background: 'rgba(255,85,85,0.08)', border: '1px solid rgba(255,85,85,0.2)', borderRadius: 6, padding: 12 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 800, color: 'var(--red)', letterSpacing: '0.08em', marginBottom: 6 }}>BEAR CASE</div>
                    <p style={{ fontSize: 12, lineHeight: 1.6 }}>{qual.bear_case}</p>
                  </div>
                )}
              </div>
            )}
            {qual.moat && (
              <div style={{ background: 'rgba(91,163,255,0.08)', border: '1px solid rgba(91,163,255,0.2)', borderRadius: 6, padding: 12 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 800, color: 'var(--blue)', letterSpacing: '0.08em', marginBottom: 6 }}>COMPETITIVE MOAT</div>
                <p style={{ fontSize: 12, lineHeight: 1.6 }}>{qual.moat}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Valuation + Financials */}
      <div className="grid-2">
        <Section title="Valuation">
          <MetricRow label="P/E (TTM)" value={quote.pe_ratio} />
          <MetricRow label="Forward P/E" value={quote.forward_pe} />
          <MetricRow label="PEG Ratio" value={quote.peg_ratio} />
          <MetricRow label="Price / Book" value={quote.pb_ratio} />
          <MetricRow label="Price / Sales" value={quote.ps_ratio} />
          <MetricRow label="EV / EBITDA" value={quote.ev_ebitda} />
          <MetricRow label="Enterprise Value" value={quote.ev} />
          <MetricRow label="Beta" value={quote.beta} />
        </Section>
        <Section title="Financials">
          <MetricRow label="Revenue (TTM)" value={quote.revenue} />
          <MetricRow label="Gross Profit" value={quote.gross_profit} />
          <MetricRow label="EBITDA" value={quote.ebitda} />
          <MetricRow label="Net Income" value={quote.net_income} />
          <MetricRow label="Free Cash Flow" value={quote.free_cashflow} />
          <MetricRow label="Total Cash" value={quote.total_cash} />
          <MetricRow label="Total Debt" value={quote.total_debt} />
          <MetricRow label="D/E Ratio" value={quote.de_ratio} />
        </Section>
      </div>

      {/* Margins + Analyst */}
      <div className="grid-2">
        <Section title="Margins & Returns">
          <MarginBar label="Gross Margin" value={quote.gross_margin} raw={quote.gross_margin_raw} color="var(--green)" />
          <MarginBar label="Operating Margin" value={quote.operating_margin} raw={quote.operating_margin_raw} color="var(--blue)" />
          <MarginBar label="Profit Margin" value={quote.profit_margin} raw={quote.profit_margin_raw} color="var(--yellow)" />
          <div style={{ height: 6 }} />
          <MetricRow label="Revenue Growth" value={
            <span style={{ color: (quote.revenue_growth_raw ?? 0) > 0 ? 'var(--green)' : 'var(--red)' }}>{quote.revenue_growth}</span>
          } />
          <MetricRow label="Earnings Growth" value={
            <span style={{ color: (quote.earnings_growth_raw ?? 0) > 0 ? 'var(--green)' : 'var(--red)' }}>{quote.earnings_growth}</span>
          } />
          <MetricRow label="Return on Equity" value={quote.return_on_equity} />
          <MetricRow label="Return on Assets" value={quote.return_on_assets} />
        </Section>
        <Section title="Analyst Coverage">
          {lo && hi && curr && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                <span>Low {quote.target_low}</span>
                <span>High {quote.target_high}</span>
              </div>
              <div style={{ height: 8, background: 'var(--border)', borderRadius: 99, position: 'relative' }}>
                <div style={{ width: 12, height: 12, background: 'var(--blue)', borderRadius: '50%', position: 'absolute', top: '50%', left: `${meanPos}%`, transform: 'translate(-50%, -50%)', border: '2px solid var(--bg)' }} />
                <div style={{ width: 12, height: 12, background: 'var(--text)', borderRadius: '50%', position: 'absolute', top: '50%', left: `${currPos}%`, transform: 'translate(-50%, -50%)', border: '2px solid var(--bg)' }} />
              </div>
              <div style={{ textAlign: 'center', marginTop: 4, fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>▲ mean {quote.target_mean}</div>
            </div>
          )}
          <MetricRow label="Recommendation" value={
            <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 10, background: rec.bg, color: rec.color, border: `1px solid ${rec.border}`, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 800 }}>
              {quote.recommendation}
            </span>
          } />
          <MetricRow label="# of Analysts" value={quote.num_analysts} />
          <MetricRow label="Target High" value={quote.target_high} />
          <MetricRow label="Target Mean" value={
            <span>{quote.target_mean}{upside != null && <span style={{ color: parseFloat(upside) > 0 ? 'var(--green)' : 'var(--red)', marginLeft: 5, fontSize: 11 }}>({parseFloat(upside) > 0 ? '+' : ''}{upside}%)</span>}</span>
          } />
          <MetricRow label="Target Low" value={quote.target_low} />
        </Section>
      </div>

      {/* Shares/Divs + Risk */}
      <div className="grid-2">
        <Section title="Shares & Dividends">
          <MetricRow label="Shares Outstanding" value={quote.shares_outstanding} />
          <MetricRow label="Float" value={quote.float_shares} />
          <MetricRow label="Dividend Yield" value={quote.dividend_yield} />
          <MetricRow label="Dividend Rate" value={quote.dividend_rate} />
          <MetricRow label="Payout Ratio" value={quote.payout_ratio} />
        </Section>
        <Section title="Risk & Momentum">
          <MetricRow label="Beta" value={
            <span style={{ color: (quote.beta_raw ?? 1) > 1.5 ? 'var(--red)' : (quote.beta_raw ?? 1) < 0.8 ? 'var(--green)' : 'var(--text)' }}>{quote.beta}</span>
          } />
          <MetricRow label="Short % of Float" value={
            <span style={{ color: (quote.short_pct_raw ?? 0) > 0.1 ? 'var(--red)' : (quote.short_pct_raw ?? 0) > 0.05 ? 'var(--yellow)' : 'var(--green)' }}>{quote.short_pct_float}</span>
          } />
          <MetricRow label="Short Ratio" value={quote.short_ratio} />
          <MetricRow label="50-Day Avg" value={quote.fifty_day_avg} />
          <MetricRow label="200-Day Avg" value={quote.two_hundred_day_avg} />
          <MetricRow label="Day High / Low" value={`${quote.day_high} / ${quote.day_low}`} />
          <MetricRow label="Volume" value={quote.volume} />
          <MetricRow label="Avg Volume" value={quote.avg_volume} />
        </Section>
      </div>

      {/* About */}
      {desc && (
        <Section title={`About ${quote.name}`}>
          <p style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--muted)' }}>{showFull ? desc : shortDesc}</p>
          {desc.length > 320 && (
            <button onClick={() => setShowFull((v) => !v)} style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', fontSize: 12, marginTop: 6, padding: 0, fontFamily: 'var(--font-mono)' }}>
              {showFull ? 'Show less' : 'Show more'}
            </button>
          )}
        </Section>
      )}

    </div>
  );
}
