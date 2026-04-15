import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { EpicView, type EpicKey } from '../components/EpicViews';

const API = import.meta.env.VITE_API_BASE || '/api';

const EPICS = [
  { key: 'latent' as EpicKey, label: 'LATENT' },
  { key: 'definitive' as EpicKey, label: 'DEFINITIVE' },
  { key: 'horizon' as EpicKey, label: 'HORIZON' },
  { key: 'macro' as EpicKey, label: 'MACRO OVERLAY' },
];

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

