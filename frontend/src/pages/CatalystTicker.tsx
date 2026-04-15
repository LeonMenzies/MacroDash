import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';


const API = import.meta.env.VITE_API_BASE || '/api';

const EPICS = [
  { key: 'latent', label: 'LATENT' },
  { key: 'definitive', label: 'DEFINITIVE' },
  { key: 'horizon', label: 'HORIZON' },
  { key: 'macro', label: 'MACRO OVERLAY' },
] as const;

type EpicKey = typeof EPICS[number]['key'];

interface EpicState {
  data: any;
  loading: boolean;
  error: string | null;
  status: string | null;
  streamText: string;
}

// Cache per ticker, expires after 30 min
const cache: Record<string, { data: Record<EpicKey, any>; ts: number }> = {};
const CACHE_TTL = 30 * 60 * 1000;

export default function CatalystTicker() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [activeEpic, setActiveEpic] = useState<EpicKey>('latent');
  const [epics, setEpics] = useState<Record<EpicKey, EpicState>>({
    latent: { data: null, loading: false, error: null, status: null, streamText: '' },
    definitive: { data: null, loading: false, error: null, status: null, streamText: '' },
    horizon: { data: null, loading: false, error: null, status: null, streamText: '' },
    macro: { data: null, loading: false, error: null, status: null, streamText: '' },
  });
  const [savedOk, setSavedOk] = useState(false);

  const fetchEpic = useCallback(async (epic: EpicKey) => {
    if (!ticker) return;

    const cached = cache[ticker];
    if (cached && Date.now() - cached.ts < CACHE_TTL && cached.data[epic]) {
      setEpics((prev) => ({ ...prev, [epic]: { data: cached.data[epic], loading: false, error: null, status: null, streamText: '' } }));
      return;
    }

    setEpics((prev) => ({ ...prev, [epic]: { data: null, loading: true, error: null, status: 'Starting...', streamText: '' } }));

    try {
      const response = await fetch(`${API}/catalyst/${ticker}?epic=${epic}`);
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
            setEpics((prev) => ({ ...prev, [epic]: { ...prev[epic], status: event.message } }));
          } else if (event.type === 'text') {
            setEpics((prev) => ({ ...prev, [epic]: { ...prev[epic], streamText: prev[epic].streamText + event.delta } }));
          } else if (event.type === 'done') {
            const data = event.data;
            cache[ticker] = {
              ts: cached?.ts || Date.now(),
              data: { ...(cached?.data || {}), [epic]: data } as Record<EpicKey, any>,
            };
            setEpics((prev) => ({ ...prev, [epic]: { data, loading: false, error: null, status: null, streamText: '' } }));
            axios.post(`${API}/catalyst-saves`, { ticker, epic, data }).then(() => {
              setSavedOk(true);
              setTimeout(() => setSavedOk(false), 2000);
            }).catch(() => {});
          } else if (event.type === 'error') {
            setEpics((prev) => ({ ...prev, [epic]: { data: null, loading: false, error: event.message, status: null, streamText: '' } }));
          }
        }
      }
    } catch (err: any) {
      setEpics((prev) => ({ ...prev, [epic]: { data: null, loading: false, error: err.message, status: null, streamText: '' } }));
    }
  }, [ticker]);

  useEffect(() => {
    fetchEpic(activeEpic);
  }, [activeEpic, fetchEpic]);


  const current = epics[activeEpic];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button
          onClick={() => navigate('/catalyst-brain')}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18, padding: 0 }}
        >
          ←
        </button>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700 }}>{ticker}</h1>
        <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>CATALYST ANALYSIS</span>
        {savedOk && (
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--green)' }}>SAVED</span>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24, overflowX: 'auto' }}>
        {EPICS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveEpic(key)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeEpic === key ? 'var(--blue)' : 'transparent'}`,
              color: activeEpic === key ? 'var(--text)' : 'var(--muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.08em',
              padding: '10px 20px',
              cursor: 'pointer',
            }}
          >
            {label}
            {epics[key].data && (
              <span style={{ marginLeft: 6, color: 'var(--green)', fontSize: 8 }}>●</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {current.loading && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--blue)' }}>●</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>{current.status || 'Starting...'}</span>
          </div>
          {current.streamText && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '12px 16px' }}>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', whiteSpace: 'pre-wrap', margin: 0, maxHeight: 300, overflow: 'hidden' }}>
                {current.streamText}
              </pre>
            </div>
          )}
        </div>
      )}
      {current.error && (
        <div style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{current.error}</div>
      )}
      {!current.loading && !current.data && !current.error && (
        <button
          onClick={() => fetchEpic(activeEpic)}
          style={{
            background: 'var(--blue)', border: 'none', color: '#000',
            padding: '8px 20px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12,
          }}
        >
          LOAD {EPICS.find((e) => e.key === activeEpic)?.label}
        </button>
      )}
      {current.data && <EpicView epic={activeEpic} data={current.data} />}
    </div>
  );
}

function EpicView({ epic, data }: { epic: EpicKey; data: any }) {
  if (data.raw) {
    return <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>{data.raw}</pre>;
  }

  if (epic === 'latent') return <LatentView data={data} />;
  if (epic === 'definitive') return <DefinitiveView data={data} />;
  if (epic === 'horizon') return <HorizonView data={data} />;
  if (epic === 'macro') return <MacroView data={data} />;
  return null;
}

function LatentView({ data }: { data: any }) {
  return (
    <div>
      {data.summary && <p style={{ marginBottom: 20, lineHeight: 1.7, color: 'var(--muted)' }}>{data.summary}</p>}
      {data.events?.length > 0 && (
        <Section title="EVENTS">
          <div className="table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            <thead><tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
              <Th>DATE</Th><Th>EVENT</Th><Th>REACTION</Th><Th>NOTES</Th>
            </tr></thead>
            <tbody>
              {data.events.map((e: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <Td style={{ color: 'var(--muted)' }}>{e.date}</Td>
                  <Td>{e.event}</Td>
                  <Td style={{ color: e.priceReaction?.startsWith('-') ? 'var(--red)' : 'var(--green)' }}>{e.priceReaction}</Td>
                  <Td style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{e.notes}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Section>
      )}
      {data.estimateRevisions?.length > 0 && (
        <Section title="ESTIMATE REVISIONS">
          <div className="table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            <thead><tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
              <Th>DATE</Th><Th>METRIC</Th><Th>CHANGE</Th>
            </tr></thead>
            <tbody>
              {data.estimateRevisions.map((r: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <Td style={{ color: 'var(--muted)' }}>{r.date}</Td>
                  <Td>{r.metric}</Td>
                  <Td style={{ color: r.change?.startsWith('+') ? 'var(--green)' : 'var(--red)' }}>{r.change}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Section>
      )}
    </div>
  );
}

function DefinitiveView({ data }: { data: any }) {
  return (
    <div>
      {data.nextEarnings && (
        <Section title="NEXT EARNINGS">
          <div className="stat-row" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            <Stat label="DATE" value={data.nextEarnings.date} />
            <Stat label="EPS CONSENSUS" value={data.nextEarnings.epsConsensus} />
            <Stat label="REV CONSENSUS" value={data.nextEarnings.revenueConsensus} />
            <Stat label="IMPLIED MOVE" value={data.nextEarnings.impliedMove} color="var(--yellow)" />
          </div>
        </Section>
      )}
      {data.earningsHistory?.length > 0 && (
        <Section title="EARNINGS HISTORY">
          <div className="table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            <thead><tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
              <Th>DATE</Th><Th>EPS ACT.</Th><Th>EPS CONS.</Th><Th>IMPLIED</Th><Th>ACTUAL MOVE</Th>
            </tr></thead>
            <tbody>
              {data.earningsHistory.map((e: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <Td style={{ color: 'var(--muted)' }}>{e.date}</Td>
                  <Td>{e.epsActual}</Td>
                  <Td style={{ color: 'var(--muted)' }}>{e.epsConsensus}</Td>
                  <Td style={{ color: 'var(--yellow)' }}>{e.impliedMove}</Td>
                  <Td style={{ color: e.actualMove?.startsWith('-') ? 'var(--red)' : 'var(--green)' }}>{e.actualMove}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Section>
      )}
      {data.upcomingEvents?.length > 0 && (
        <Section title="UPCOMING EVENTS">
          {data.upcomingEvents.map((e: any, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: '6px 0', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              <span style={{ color: 'var(--muted)', minWidth: 100 }}>{e.date}</span>
              <span>{e.event}</span>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function HorizonView({ data }: { data: any }) {
  return (
    <div>
      {data.catalysts?.map((c: any, i: number) => (
        <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '14px 18px', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{c.event}</span>
            <span className={`tag tag-${c.confidence?.toLowerCase()}`}>{c.confidence}</span>
            {c.expectedTiming && <span style={{ color: 'var(--muted)', fontSize: 12 }}>{c.expectedTiming}</span>}
            {c.estimatedMagnitude && <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--yellow)', fontSize: 12 }}>{c.estimatedMagnitude}</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {c.bullCase && <div style={{ fontSize: 12, color: 'var(--green)' }}>↑ {c.bullCase}</div>}
            {c.bearCase && <div style={{ fontSize: 12, color: 'var(--red)' }}>↓ {c.bearCase}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function MacroView({ data }: { data: any }) {
  return (
    <div>
      {data.regimeAssessment && (
        <Section title="REGIME ASSESSMENT">
          <p style={{ lineHeight: 1.7 }}>{data.regimeAssessment}</p>
        </Section>
      )}
      {data.sensitivities?.length > 0 && (
        <Section title="MACRO SENSITIVITIES">
          <div className="table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            <thead><tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
              <Th>FACTOR</Th><Th>DIRECTION</Th><Th>BETA</Th><Th>NOTES</Th>
            </tr></thead>
            <tbody>
              {data.sensitivities.map((s: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <Td>{s.factor}</Td>
                  <Td style={{ color: s.direction === 'positive' ? 'var(--green)' : s.direction === 'negative' ? 'var(--red)' : 'var(--yellow)' }}>
                    {s.direction?.toUpperCase()}
                  </Td>
                  <Td>{s.beta}</Td>
                  <Td style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>{s.notes}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Section>
      )}
      <div className="grid-2">
        {data.riskOn && <Section title="RISK-ON"><p style={{ fontSize: 13, lineHeight: 1.7 }}>{data.riskOn}</p></Section>}
        {data.riskOff && <Section title="RISK-OFF"><p style={{ fontSize: 13, lineHeight: 1.7 }}>{data.riskOff}</p></Section>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '14px 18px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color || 'var(--text)' }}>{value || '—'}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>{children}</th>;
}

function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: '8px 10px', verticalAlign: 'top', ...style }}>{children}</td>;
}
