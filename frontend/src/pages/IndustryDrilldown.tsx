import { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE || '/api';

type ModelKey = 'haiku' | 'sonnet' | 'opus';

const MODEL_OPTIONS: { key: ModelKey; label: string; note: string; color: string }[] = [
  { key: 'haiku',  label: 'Haiku',  note: '~$0.02 · fast',    color: 'var(--green)' },
  { key: 'sonnet', label: 'Sonnet', note: '~$0.05',            color: 'var(--yellow)' },
  { key: 'opus',   label: 'Opus',   note: '~$0.30 · deepest', color: 'var(--red)' },
];

function SourceLink({ url }: { url?: string }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title={url}
      style={{ color: 'var(--muted)', fontSize: 11, textDecoration: 'none', flexShrink: 0 }}
      onClick={(e) => e.stopPropagation()}
    >↗</a>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '14px 16px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function ImpactBadge({ impact }: { impact?: string }) {
  const i = impact?.toLowerCase();
  const color = i === 'positive' ? 'var(--green)' : i === 'negative' ? 'var(--red)' : 'var(--yellow)';
  const bg = i === 'positive' ? 'rgba(46,204,135,0.1)' : i === 'negative' ? 'rgba(255,85,85,0.1)' : 'rgba(255,200,0,0.1)';
  const arrow = i === 'positive' ? '↑' : i === 'negative' ? '↓' : '↔';
  if (!impact) return null;
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color, background: bg, borderRadius: 3, padding: '1px 6px' }}>
      {arrow} {impact.toUpperCase()}
    </span>
  );
}

function SeverityBadge({ severity }: { severity?: string }) {
  const s = severity?.toUpperCase();
  const color = s === 'HIGH' ? 'var(--red)' : s === 'MEDIUM' ? 'var(--yellow)' : 'var(--muted)';
  if (!s) return null;
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color, border: `1px solid ${color}`, borderRadius: 2, padding: '1px 5px' }}>
      {s}
    </span>
  );
}

function IndustryView({ data }: { data: any }) {
  const resolved: any = (() => {
    if (!data?.raw) return data;
    const stripped = data.raw.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
    try { return JSON.parse(stripped); } catch {}
    try {
      let depth = 0, start = -1;
      for (let i = 0; i < stripped.length; i++) {
        if (stripped[i] === '{') { if (depth === 0) start = i; depth++; }
        else if (stripped[i] === '}') { depth--; if (depth === 0 && start !== -1) return JSON.parse(stripped.slice(start, i + 1)); }
      }
    } catch {}
    return data;
  })();

  if (resolved.raw) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '14px 18px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 10 }}>RAW RESPONSE</div>
        <p style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{resolved.raw}</p>
      </div>
    );
  }

  const d = resolved;
  return (
    <div>
      {d.executive_summary && (
        <Section title="EXECUTIVE SUMMARY">
          <p style={{ fontSize: 13, lineHeight: 1.8, margin: 0, color: 'var(--text)' }}>{d.executive_summary}</p>
        </Section>
      )}

      {d.overview && (
        <Section title="OVERVIEW">
          <p style={{ fontSize: 13, lineHeight: 1.8, margin: 0, color: 'var(--muted)' }}>{d.overview}</p>
        </Section>
      )}

      {d.sector_drivers?.length > 0 && (
        <Section title="SECTOR DRIVERS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.sector_drivers.map((item: any, i: number) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: item.notes ? 6 : 0 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, flex: 1 }}>{item.driver}</span>
                  <ImpactBadge impact={item.impact} />
                  <SourceLink url={item.source} />
                </div>
                {item.notes && <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>{item.notes}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {d.bottlenecks?.length > 0 && (
        <Section title="BOTTLENECKS & RISKS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.bottlenecks.map((item: any, i: number) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: item.description ? 6 : 0 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, flex: 1 }}>{item.name}</span>
                  <SeverityBadge severity={item.severity} />
                  <SourceLink url={item.source} />
                </div>
                {item.description && <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>{item.description}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {d.key_players?.length > 0 && (
        <Section title="KEY PLAYERS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {d.key_players.map((item: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < d.key_players.length - 1 ? '1px solid var(--border)' : 'none', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, minWidth: 100, color: 'var(--blue)' }}>{item.company}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)', flex: 1 }}>{item.role}</span>
                {item.market_position && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)' }}>{item.market_position}</span>}
                <SourceLink url={item.source} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {d.value_chain && (
        <Section title="VALUE CHAIN">
          <div className="grid-3" style={{ gap: 10 }}>
            {['upstream', 'midstream', 'downstream'].map((layer) => d.value_chain[layer] && (
              <div key={layer} style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '10px 12px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.08em' }}>{layer.toUpperCase()}</div>
                <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>{d.value_chain[layer]}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {d.economics && (
        <Section title="ECONOMICS">
          <div className="grid-3" style={{ gap: 12, marginBottom: d.economics.notes ? 12 : 0 }}>
            {d.economics.margins && (
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>MARGINS</div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{d.economics.margins}</div>
              </div>
            )}
            {d.economics.capex_intensity && (
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>CAPEX INTENSITY</div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--yellow)' }}>{d.economics.capex_intensity}</div>
              </div>
            )}
            {d.economics.cyclicality && (
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>CYCLICALITY</div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{d.economics.cyclicality}</div>
              </div>
            )}
          </div>
          {d.economics.notes && <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>{d.economics.notes}</p>}
        </Section>
      )}

      {d.investment_considerations && (
        <Section title="INVESTMENT CONSIDERATIONS">
          <p style={{ fontSize: 13, lineHeight: 1.8, margin: 0, color: 'var(--text)' }}>{d.investment_considerations}</p>
        </Section>
      )}
    </div>
  );
}

interface Save {
  id: string;
  industry: string;
  data: any;
  saved_at: string;
}

const SUGGESTIONS = [
  'Semiconductor Equipment', 'US Regional Banks', 'LNG Shipping',
  'Specialty Chemicals', 'Data Center REITs', 'Defense Electronics',
  'Generic Pharmaceuticals', 'Online Travel Agencies',
];

export default function IndustryDrilldown() {
  const [query, setQuery] = useState('');
  const [activeIndustry, setActiveIndustry] = useState('');
  const [model, setModel] = useState<ModelKey>('haiku');
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [log, setLog] = useState<string[]>([]);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saves, setSaves] = useState<Save[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const selectedModel = MODEL_OPTIONS.find((m) => m.key === model)!;

  useEffect(() => { loadSaves(); }, []);

  async function loadSaves() {
    try {
      const { data } = await axios.get(`${API}/industry-saves`);
      setSaves(data);
    } catch {}
  }

  async function deleteSave(id: string) {
    await axios.delete(`${API}/industry-saves/${id}`);
    setSaves((prev) => prev.filter((s) => s.id !== id));
  }

  async function run(industry: string) {
    const ind = industry.trim();
    if (!ind || status === 'running') return;
    setActiveIndustry(ind);
    setStatus('running');
    setLog(['Starting industry analysis...']);
    setData(null);
    setError(null);

    try {
      const response = await fetch(`${API}/industry/${encodeURIComponent(ind)}?model=${model}`);
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let event: any;
          try { event = JSON.parse(line.slice(6)); } catch { continue; }

          if (event.type === 'status') {
            setLog((prev) => [...prev, event.message]);
          } else if (event.type === 'done') {
            setData(event.data);
            setStatus('done');
            setLog((prev) => [...prev, 'Done']);
            loadSaves();
          } else if (event.type === 'error') {
            setError(event.message);
            setStatus('error');
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  }

  // Group saves by industry, each group shows all historical runs
  const grouped = saves.reduce<Record<string, Save[]>>((acc, s) => {
    (acc[s.industry] = acc[s.industry] || []).push(s);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.12em', marginBottom: 20 }}>
        INDUSTRY DRILLDOWN
      </div>

      {/* Search */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 0, maxWidth: 600, marginBottom: 10 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') run(query); }}
            placeholder="e.g. Semiconductor Equipment, US Regional Banks…"
            disabled={status === 'running'}
            style={{
              flex: 1,
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              fontWeight: 700,
              padding: '12px 16px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRight: 'none',
              borderRadius: '4px 0 0 4px',
              color: 'var(--text)',
              outline: 'none',
            }}
          />
          <button
            onClick={() => run(query)}
            disabled={status === 'running' || !query.trim()}
            style={{
              background: 'var(--blue)', border: 'none', color: '#000',
              padding: '12px 20px', borderRadius: '0 4px 4px 0',
              fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12,
              cursor: status === 'running' ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
              opacity: (!query.trim() || status === 'running') ? 0.5 : 1,
            }}
          >
            ANALYSE →
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>MODEL</span>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as ModelKey)}
              disabled={status === 'running'}
              style={{
                appearance: 'none',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 3,
                color: selectedModel.color,
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.06em',
                padding: '3px 24px 3px 8px',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.key} value={m.key}>{m.label.toUpperCase()} — {m.note}</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--muted)', fontSize: 9 }}>▾</span>
          </div>
        </div>
      </div>

      {/* Suggestions — only when nothing is loaded */}
      {status === 'idle' && !data && saves.length === 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 10 }}>SUGGESTIONS</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setQuery(s); run(s); }}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  color: 'var(--muted)', padding: '5px 12px', borderRadius: 4,
                  fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progress log */}
      {status === 'running' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 10 }}>PROGRESS</div>
          {log.map((msg, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: i === log.length - 1 ? 'var(--blue)' : 'var(--muted)' }}>
                {i === log.length - 1 ? '●' : '✓'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: i === log.length - 1 ? 'var(--text)' : 'var(--muted)' }}>{msg}</span>
            </div>
          ))}
        </div>
      )}

      {status === 'error' && error && (
        <div style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 16 }}>{error}</div>
      )}

      {/* Live result */}
      {status === 'done' && data && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, margin: 0 }}>{activeIndustry}</h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)' }}>SAVED</span>
            <button
              onClick={() => run(activeIndustry)}
              style={{
                background: 'none', border: '1px solid var(--border)', color: 'var(--muted)',
                padding: '4px 12px', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer',
              }}
            >
              RE-RUN ↗
            </button>
          </div>
          <IndustryView data={data} />
        </div>
      )}

      {/* Historical saves */}
      {saves.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 14 }}>SAVED ANALYSES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(grouped).map(([industry, entries]) => (
              <div key={industry}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14 }}>{industry}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>{entries.length} run{entries.length > 1 ? 's' : ''}</span>
                  <button
                    onClick={() => { setQuery(industry); run(industry); }}
                    style={{
                      marginLeft: 'auto', background: 'none', border: '1px solid var(--border)',
                      color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 10,
                      cursor: 'pointer', padding: '2px 8px', borderRadius: 3,
                    }}
                  >
                    RE-RUN ↗
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {entries.map((s) => (
                    <div key={s.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4 }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'pointer' }}
                        onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                      >
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', flex: 1 }}>
                          {new Date(s.saved_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
                          {expanded === s.id ? '▲' : '▼'}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteSave(s.id); }}
                          style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 16, cursor: 'pointer', padding: 0 }}
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                      {expanded === s.id && (
                        <div style={{ borderTop: '1px solid var(--border)', padding: '16px' }}>
                          <IndustryView data={s.data} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
