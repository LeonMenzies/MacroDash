import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, LabelList } from 'recharts';

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtDollar(v: number | null): string {
  if (v == null) return '—';
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  return `${sign}$${abs.toFixed(2)}`;
}

function fmtPct(v: number | null): string {
  if (v == null) return '—';
  return `${v.toFixed(1)}%`;
}

function fmtEps(v: number | null): string {
  if (v == null) return '—';
  return `$${v.toFixed(2)}`;
}

function fmtVal(v: number | null, unit: string): string {
  if (unit === 'pct') return fmtPct(v);
  if (unit === 'eps') return fmtEps(v);
  return fmtDollar(v);
}

function fmtQoQ(qoq: number | null | undefined, higherIsBetter: boolean): { text: string; color: string } {
  if (qoq == null) return { text: '', color: 'var(--muted)' };
  const positive = qoq >= 0;
  const good = positive === higherIsBetter;
  return {
    text: `${positive ? '+' : ''}${qoq.toFixed(1)}% QoQ`,
    color: good ? 'var(--green)' : 'var(--red)',
  };
}

function trendColor(trend?: string): string {
  if (!trend) return 'var(--border)';
  if (trend === 'improving' || trend === 'accelerating') return 'var(--green)';
  if (trend === 'declining' || trend === 'decelerating') return 'var(--red)';
  return 'var(--yellow)';
}

function trendArrow(trend?: string): string {
  if (trend === 'improving' || trend === 'accelerating') return '↑';
  if (trend === 'declining' || trend === 'decelerating') return '↓';
  return '→';
}

// ── Financial bar chart — actual vs estimate, QoQ% ticks, forward quarter ────

function FinancialBarChart({ values, unit, higherIsBetter }: {
  values: {
    quarter: string;
    value: number | null;
    estimate?: number | null;
    qoq?: number | null;
    surprisePct?: number | null;
    isForward?: boolean;
  }[];
  unit: string;
  higherIsBetter: boolean;
}) {
  const hasData = values.some(v => v.value != null || v.estimate != null);
  if (!hasData) return <div style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>No data</div>;

  const hasEstimates = values.some(v => v.estimate != null);
  const allNums = values.flatMap(v => [v.value, v.estimate]).filter((n): n is number => n != null);
  const max = allNums.length ? Math.max(...allNums) : 1;
  const min = allNums.length ? Math.min(...allNums) : 0;
  const allPositive = min >= 0;
  const qoqMap: Record<string, { qoq: number | null | undefined; isForward?: boolean }> =
    Object.fromEntries(values.map(v => [v.quarter, { qoq: v.qoq, isForward: v.isForward }]));

  const renderTick = ({ x, y, payload }: any) => {
    const entry = qoqMap[payload.value];
    const qoq = entry?.qoq;
    const positive = qoq != null && qoq >= 0;
    const good = positive === higherIsBetter;
    return (
      <g transform={`translate(${x},${y})`}>
        <text y={4} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill={entry?.isForward ? 'var(--blue)' : 'var(--muted)'}>
          {payload.value}
        </text>
        {entry?.isForward ? (
          <text y={16} textAnchor="middle" fontSize={8} fontFamily="var(--font-mono)" fill="var(--blue)">est.</text>
        ) : qoq != null ? (
          <text y={16} textAnchor="middle" fontSize={8} fontFamily="var(--font-mono)" fill={good ? 'var(--green)' : 'var(--red)'}>
            {positive ? '+' : ''}{qoq.toFixed(1)}%
          </text>
        ) : null}
      </g>
    );
  };

  const renderActualLabel = ({ x, y, width, value }: any) => {
    if (value == null) return null;
    return (
      <text x={(x ?? 0) + (width ?? 0) / 2} y={(y ?? 0) - 4} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--text2)">
        {fmtVal(value, unit)}
      </text>
    );
  };

  const renderEstLabel = ({ x, y, width, value }: any) => {
    if (value == null) return null;
    return (
      <text x={(x ?? 0) + (width ?? 0) / 2} y={(y ?? 0) - 4} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--muted)">
        {fmtVal(value, unit)}
      </text>
    );
  };

  const renderTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const actualItem = payload.find((p: any) => p.dataKey === 'value');
    const estItem = payload.find((p: any) => p.dataKey === 'estimate');
    const actual: number | null = actualItem?.value ?? null;
    const estimate: number | null = estItem?.value ?? null;
    let beatMiss: { diff: number; pct: number; good: boolean } | null = null;
    if (actual != null && estimate != null && estimate !== 0) {
      const diff = actual - estimate;
      beatMiss = { diff, pct: (diff / Math.abs(estimate)) * 100, good: diff >= 0 };
    }
    return (
      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 11, minWidth: 160 }}>
        <div style={{ color: 'var(--muted)', marginBottom: 6, fontSize: 10, letterSpacing: '0.06em' }}>{label}</div>
        {actual != null && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 2 }}>
            <span style={{ color: 'var(--muted)' }}>Actual</span>
            <span style={{ fontWeight: 700 }}>{fmtVal(actual, unit)}</span>
          </div>
        )}
        {estimate != null && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 2 }}>
            <span style={{ color: 'var(--muted)' }}>Consensus</span>
            <span>{fmtVal(estimate, unit)}</span>
          </div>
        )}
        {beatMiss && (
          <div style={{ marginTop: 5, paddingTop: 5, borderTop: '1px solid var(--border)', color: beatMiss.good ? 'var(--green)' : 'var(--red)', fontWeight: 700, fontSize: 11 }}>
            {beatMiss.good ? 'BEAT' : 'MISS'}{' '}
            {beatMiss.diff >= 0 ? '+' : ''}{fmtVal(beatMiss.diff, unit)}{' '}
            ({beatMiss.pct >= 0 ? '+' : ''}{beatMiss.pct.toFixed(1)}%)
          </div>
        )}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={values} margin={{ top: 20, right: 4, left: 4, bottom: 0 }} barCategoryGap={hasEstimates ? '12%' : '18%'} barGap={2}>
        <XAxis dataKey="quarter" tick={renderTick} axisLine={false} tickLine={false} height={30} />
        <YAxis hide domain={allPositive ? [0, max * 1.3] : ['auto', 'auto']} />
        {!allPositive && <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="2 2" />}
        <Tooltip content={renderTooltip} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        {hasEstimates && (
          <Bar dataKey="estimate" name="estimate" fill="var(--surface3)" radius={[2, 2, 0, 0]} opacity={0.55}>
            <LabelList content={renderEstLabel} />
          </Bar>
        )}
        <Bar dataKey="value" name="value" radius={[2, 2, 0, 0]}>
          <LabelList content={renderActualLabel} />
          {values.map((entry, i) => {
            if (entry.value == null) return <Cell key={i} fill="transparent" />;
            let fill = 'var(--surface3)';
            let opacity = 0.7;
            if (entry.estimate != null) {
              fill = entry.value >= entry.estimate ? 'var(--green)' : 'var(--red)';
              opacity = 1;
            } else {
              const isLast = values.slice(i + 1).every(v => v.value == null);
              if (isLast) {
                const prev = values.slice(0, i).reverse().find(v => v.value != null);
                const up = prev?.value != null ? entry.value >= prev.value : true;
                fill = (up === higherIsBetter) ? 'var(--green)' : 'var(--red)';
                opacity = 1;
              }
            }
            return <Cell key={i} fill={fill} opacity={opacity} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Sector bar chart — parses AI string values, labels each bar ───────────────

function SectorBarChart({ values, trend }: { values: { quarter: string; value: string }[]; trend?: string }) {
  const chartData = values.map(v => ({
    quarter: v.quarter,
    numValue: parseFloat(String(v.value).replace(/[^0-9.-]/g, '')) || null,
    rawValue: String(v.value),
  }));

  const hasNumeric = chartData.some(p => p.numValue != null && p.numValue !== 0);
  if (!hasNumeric) return null;

  const nonNull = chartData.filter(p => p.numValue != null).map(p => p.numValue as number);
  const max = Math.max(...nonNull);
  const min = Math.min(...nonNull);
  const allPositive = min >= 0;
  const accent = trendColor(trend);

  const renderBarLabel = ({ x, y, width, index }: any) => {
    const raw = chartData[index]?.rawValue;
    if (!raw) return null;
    return (
      <text x={(x ?? 0) + (width ?? 0) / 2} y={(y ?? 0) - 4} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--text2)">
        {raw}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={chartData} margin={{ top: 18, right: 4, left: 4, bottom: 0 }} barCategoryGap="18%">
        <XAxis dataKey="quarter" tick={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--muted)' }} axisLine={false} tickLine={false} height={18} />
        <YAxis hide domain={allPositive ? [0, max * 1.3] : ['auto', 'auto']} />
        {!allPositive && <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="2 2" />}
        <Tooltip
          contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 11 }}
          labelStyle={{ color: 'var(--muted)', marginBottom: 4 }}
          formatter={(_: any, __: any, props: any) => [props.payload?.rawValue || '—', '']}
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
        />
        <Bar dataKey="numValue" radius={[2, 2, 0, 0]} fill={accent} opacity={0.75}>
          <LabelList content={renderBarLabel} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Financial KPI card ───────────────────────────────────────────────────────

function FinancialKpiCard({ kpi }: { kpi: any }) {
  const latest = kpi.values[kpi.values.length - 1];
  const qoq = fmtQoQ(latest?.qoq, kpi.higherIsBetter);

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '12px 14px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 4 }}>
        {kpi.name.toUpperCase()}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
          {fmtVal(latest?.value ?? null, kpi.unit)}
        </span>
        {qoq.text && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, color: qoq.color,
            background: qoq.color === 'var(--green)' ? 'var(--green-bg)' : 'var(--red-bg)',
            padding: '1px 6px', borderRadius: 3,
          }}>
            {qoq.text}
          </span>
        )}
      </div>
      <FinancialBarChart values={kpi.values} unit={kpi.unit} higherIsBetter={kpi.higherIsBetter} />
    </div>
  );
}

// ── Sector KPI card ──────────────────────────────────────────────────────────

function SectorKpiCard({ kpi }: { kpi: any }) {
  const accent = trendColor(kpi.trend);
  const hasValues = Array.isArray(kpi.values) && kpi.values.length >= 2;

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4,
      borderLeft: `3px solid ${accent}`, padding: '11px 13px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: hasValues ? 4 : 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 2 }}>
            {kpi.name.toUpperCase()}
          </div>
          {kpi.trend && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: accent }}>
              {trendArrow(kpi.trend)} {kpi.trend.charAt(0).toUpperCase() + kpi.trend.slice(1)}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {kpi.currentValue && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: hasValues ? 13 : 17, fontWeight: 700 }}>{kpi.currentValue}</div>
          )}
          {kpi.source && (
            <a href={kpi.source} target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--muted)', fontSize: 11, textDecoration: 'none', display: 'block' }}>↗ src</a>
          )}
        </div>
      </div>

      {hasValues && <SectorBarChart values={kpi.values} trend={kpi.trend} />}

      {kpi.why && (
        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55, margin: '0 0 5px', borderTop: '1px solid var(--border2)', paddingTop: 7 }}>
          {kpi.why}
        </p>
      )}
      {kpi.driverNote && (
        <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.55, margin: 0 }}>{kpi.driverNote}</p>
      )}
    </div>
  );
}

// ── Business KPI card ────────────────────────────────────────────────────────

function BusinessKpiCard({ kpi }: { kpi: any }) {
  const vals: { quarter: string; value: number | null; rawValue: string }[] = (kpi.values || [])
    .filter((v: any) => v.quarter)
    .map((v: any) => ({
      quarter: v.quarter,
      value: parseFloat(String(v.value).replace(/,/g, '')) || null,
      rawValue: String(v.value ?? ''),
    }));
  const hasNumeric = vals.some(v => v.value != null);
  const latest = kpi.values?.[kpi.values.length - 1];
  const accent = trendColor(kpi.trend);

  const renderBarLabel = ({ x, y, width, index }: any) => {
    const raw = vals[index]?.rawValue;
    if (!raw) return null;
    return (
      <text x={(x ?? 0) + (width ?? 0) / 2} y={(y ?? 0) - 4} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--text2)">
        {raw}
      </text>
    );
  };

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4,
      borderLeft: `3px solid ${accent}`, padding: '11px 13px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: hasNumeric || (!hasNumeric && vals.length > 1) ? 8 : 4 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            title={kpi.name}>
            {kpi.name.toUpperCase()}
          </div>
          {kpi.trend && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: accent, marginTop: 2 }}>
              {trendArrow(kpi.trend)} {kpi.trend.charAt(0).toUpperCase() + kpi.trend.slice(1)}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {!hasNumeric && latest?.value && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, maxWidth: 120, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              title={latest.value}>
              {latest.value}
            </div>
          )}
          {kpi.source && (
            <a href={kpi.source} target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--muted)', fontSize: 11, textDecoration: 'none', display: 'block' }}>↗ src</a>
          )}
        </div>
      </div>

      {hasNumeric && (
        <div style={{ marginBottom: 8 }}>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={vals} margin={{ top: 18, right: 4, left: 4, bottom: 0 }} barCategoryGap="18%">
              <XAxis dataKey="quarter" tick={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--muted)' }} axisLine={false} tickLine={false} height={18} />
              <YAxis hide domain={[0, 'auto']} />
              <Tooltip
                contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 11 }}
                labelStyle={{ color: 'var(--muted)', marginBottom: 4 }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="value" fill={accent} opacity={0.75} radius={[2, 2, 0, 0]}>
                <LabelList content={renderBarLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!hasNumeric && vals.length > 1 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8, borderTop: '1px solid var(--border2)', paddingTop: 7 }}>
          {vals.map((v, i) => (
            <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              <span style={{ color: 'var(--muted)' }}>{v.quarter} </span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{kpi.values[i]?.value || '—'}</span>
            </div>
          ))}
        </div>
      )}

      {kpi.driverNote && (
        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55, margin: '0 0 5px', borderTop: hasNumeric ? '1px solid var(--border2)' : undefined, paddingTop: hasNumeric ? 7 : 0 }}>
          {kpi.driverNote}
        </p>
      )}
      {kpi.managementQuote && (
        <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.55, margin: 0, borderLeft: '2px solid var(--border)', paddingLeft: 8, fontStyle: 'italic' }}>
          "{kpi.managementQuote}"
        </p>
      )}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', marginBottom: 10, marginTop: 28, paddingBottom: 6, borderBottom: '1px solid var(--border2)' }}>
      {children}
    </div>
  );
}

// ── Sources ───────────────────────────────────────────────────────────────────

function SourcesList({ sources }: { sources?: { title: string; url: string }[] }) {
  if (!sources?.length) return null;
  return (
    <div style={{ marginTop: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '12px 14px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 8 }}>SOURCES</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sources.map((s, i) => (
          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={s.url}>
            ↗ {s.title || s.url}
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function KpiView({ data }: { data: any }) {
  const { financialKPIs = [], ttmMetrics = [], sectorKPIs = [], businessKPIs = [], analystFocus, managementGuidance, _sources } = data;

  return (
    <div>
      {(analystFocus || managementGuidance) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
          {analystFocus && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--blue)', borderRadius: 4, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--blue)', letterSpacing: '0.1em', marginBottom: 6 }}>ANALYST FOCUS</div>
              <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{analystFocus}</p>
            </div>
          )}
          {managementGuidance && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--yellow)', borderRadius: 4, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--yellow)', letterSpacing: '0.1em', marginBottom: 6 }}>MANAGEMENT GUIDANCE</div>
              <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{managementGuidance}</p>
            </div>
          )}
        </div>
      )}

      {financialKPIs.length > 0 && (
        <>
          <SectionLabel>FINANCIAL KPIs — QUARTERLY TREND</SectionLabel>
          <div className="grid-2" style={{ gap: 12 }}>
            {financialKPIs.map((kpi: any, i: number) => <FinancialKpiCard key={i} kpi={kpi} />)}
          </div>
        </>
      )}

      {ttmMetrics.length > 0 && (
        <>
          <SectionLabel>TTM METRICS</SectionLabel>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '14px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '14px 24px' }}>
              {ttmMetrics.map((m: any, i: number) => (
                <div key={i}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 4 }}>{m.label.toUpperCase()}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700 }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {sectorKPIs.length > 0 && (
        <>
          <SectionLabel>SECTOR / INDUSTRY KPIs</SectionLabel>
          <div className="grid-2" style={{ gap: 12 }}>
            {sectorKPIs.map((kpi: any, i: number) => <SectorKpiCard key={i} kpi={kpi} />)}
          </div>
        </>
      )}

      {businessKPIs.length > 0 && (
        <>
          <SectionLabel>BUSINESS KPIs</SectionLabel>
          <div className="grid-2" style={{ gap: 12 }}>
            {businessKPIs.map((kpi: any, i: number) => <BusinessKpiCard key={i} kpi={kpi} />)}
          </div>
        </>
      )}

      <SourcesList sources={_sources} />
    </div>
  );
}
