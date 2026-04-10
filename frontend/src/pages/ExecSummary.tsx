import { useState, useRef } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE || '/api';

interface Scenario {
  label: string;
  probability: number;
  priceTarget: string;
  rationale: string;
}

interface Summary {
  title?: string;
  thesis?: string;
  keyPoints?: string[];
  scenarios?: Scenario[];
  risks?: string[];
  catalysts?: string[];
  timeHorizon?: string;
  recommendation?: string;
  raw?: string;
}

const REC_COLORS: Record<string, string> = {
  BUY: 'var(--green)',
  SELL: 'var(--red)',
  HOLD: 'var(--yellow)',
  NEUTRAL: 'var(--muted)',
};

export default function ExecSummary() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setLoading(true);
    setError(null);
    setSummary(null);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await axios.post(`${API}/exec-summary`, form);
      setSummary(res.data.summary);
      setFilename(res.data.filename);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  function exportMarkdown() {
    if (!summary) return;
    const lines = [
      `# ${summary.title || filename}`,
      summary.recommendation ? `\n**Recommendation: ${summary.recommendation}**` : '',
      summary.timeHorizon ? `**Time Horizon:** ${summary.timeHorizon}` : '',
      summary.thesis ? `\n## Thesis\n${summary.thesis}` : '',
      summary.keyPoints?.length ? `\n## Key Points\n${summary.keyPoints.map((p) => `- ${p}`).join('\n')}` : '',
      summary.scenarios?.length
        ? `\n## Scenarios\n${summary.scenarios.map((s) => `**${s.label}** (${s.probability}%) — Target: ${s.priceTarget}\n${s.rationale}`).join('\n\n')}`
        : '',
      summary.catalysts?.length ? `\n## Catalysts\n${summary.catalysts.map((c) => `- ${c}`).join('\n')}` : '',
      summary.risks?.length ? `\n## Risks\n${summary.risks.map((r) => `- ${r}`).join('\n')}` : '',
    ].filter(Boolean).join('\n');

    const blob = new Blob([lines], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(summary.title || 'summary').replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 20 }}>
        EXEC SUMMARY ENGINE
      </h1>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? 'var(--blue)' : 'var(--border)'}`,
          borderRadius: 6,
          padding: '40px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: 24,
          background: dragging ? 'rgba(74,159,255,0.05)' : 'var(--surface)',
          transition: 'all 0.15s',
        }}
      >
        <input ref={inputRef} type="file" accept=".docx,.pdf" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: 12 }}>
          DROP .DOCX OR .PDF HERE — OR CLICK TO BROWSE
        </div>
      </div>

      {loading && <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>Analysing with Claude...</div>}
      {error && <div style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{error}</div>}

      {summary && !summary.raw && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 16 }}>{summary.title || filename}</h2>
            {summary.recommendation && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                color: REC_COLORS[summary.recommendation] || 'var(--text)',
                background: 'var(--surface2)', padding: '3px 10px', borderRadius: 3,
              }}>
                {summary.recommendation}
              </span>
            )}
            {summary.timeHorizon && (
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>{summary.timeHorizon}</span>
            )}
            <button
              onClick={exportMarkdown}
              style={{
                marginLeft: 'auto', background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--text)', padding: '6px 14px', borderRadius: 4,
              }}
            >
              Export MD
            </button>
          </div>

          {summary.thesis && (
            <Section title="THESIS">
              <p style={{ lineHeight: 1.7 }}>{summary.thesis}</p>
            </Section>
          )}

          {summary.keyPoints?.length && (
            <Section title="KEY POINTS">
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {summary.keyPoints.map((p, i) => (
                  <li key={i} style={{ paddingLeft: 16, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: 'var(--blue)' }}>›</span>
                    {p}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {summary.scenarios?.length && (
            <Section title="SCENARIOS">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                <thead>
                  <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                    <Th>SCENARIO</Th><Th>PROB</Th><Th>TARGET</Th><Th>RATIONALE</Th>
                  </tr>
                </thead>
                <tbody>
                  {summary.scenarios.map((s, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <Td>{s.label}</Td>
                      <Td>{s.probability}%</Td>
                      <Td style={{ color: 'var(--green)' }}>{s.priceTarget}</Td>
                      <Td style={{ fontFamily: 'var(--font-sans)', color: 'var(--muted)' }}>{s.rationale}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {summary.catalysts?.length && (
              <Section title="CATALYSTS">
                <BulletList items={summary.catalysts} color="var(--green)" />
              </Section>
            )}
            {summary.risks?.length && (
              <Section title="RISKS">
                <BulletList items={summary.risks} color="var(--red)" />
              </Section>
            )}
          </div>
        </div>
      )}

      {summary?.raw && (
        <Section title="RAW OUTPUT">
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
            {summary.raw}
          </pre>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '14px 18px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>{children}</th>;
}

function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: '8px 10px', verticalAlign: 'top', ...style }}>{children}</td>;
}

function BulletList({ items, color }: { items: string[]; color: string }) {
  return (
    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => (
        <li key={i} style={{ paddingLeft: 16, position: 'relative', fontSize: 13 }}>
          <span style={{ position: 'absolute', left: 0, color }}>›</span>
          {item}
        </li>
      ))}
    </ul>
  );
}
