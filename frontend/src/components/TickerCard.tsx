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
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function fmtPE(n: number | null): string {
  if (n == null) return '—';
  return `${n.toFixed(1)}x`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function TickerCardSkeleton({ ticker }: { ticker: string }) {
  const bar = (w: number) => (
    <span style={{ display: 'inline-block', width: w, height: 10, background: 'var(--border)', borderRadius: 2 }} />
  );
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '14px 18px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16 }}>{ticker}</span>
        {bar(120)}
      </div>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px 16px' }}>
        {[80, 100, 60, 50].map((w, i) => (
          <div key={i}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginBottom: 4 }}>{['SECTOR', 'INDUSTRY', 'MKT CAP', 'FWD P/E'][i]}</div>
            {bar(w)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TickerCard({ record }: { record: TickerRecord }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '14px 18px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16 }}>{record.ticker}</span>
        {record.company_name && (
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{record.company_name}</span>
        )}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>
          Updated {fmtDate(record.last_updated)}
        </span>
      </div>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px 16px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 4 }}>SECTOR</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: record.gics_sector ? 'var(--text)' : 'var(--muted)' }}>
            {record.gics_sector || '—'}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 4 }}>INDUSTRY</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: record.gics_industry ? 'var(--text)' : 'var(--muted)' }}>
            {record.gics_industry || '—'}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 4 }}>MKT CAP</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
            {fmtCap(record.market_cap)}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 4 }}>FWD P/E</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: record.forward_pe ? 'var(--yellow)' : 'var(--muted)' }}>
            {fmtPE(record.forward_pe)}
          </div>
        </div>
      </div>
    </div>
  );
}
