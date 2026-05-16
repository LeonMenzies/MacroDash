import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { EpicView, type EpicKey } from '../components/EpicViews';
import { TickerCard, TickerCardSkeleton } from '../components/TickerCard';

const API = import.meta.env.VITE_API_BASE || '/api';

const EPICS = [
  { key: 'latent' as EpicKey, label: 'LATENT' },
  { key: 'definitive' as EpicKey, label: 'DEFINITIVE' },
  { key: 'horizon' as EpicKey, label: 'HORIZON' },
  { key: 'macro' as EpicKey, label: 'MACRO OVERLAY' },
];

// ---------------------------------------------------------------------------
// Module-level fetch manager — survives component unmount/remount
// ---------------------------------------------------------------------------

type JobStatus = 'idle' | 'running' | 'done' | 'error';

interface FetchJob {
  ticker: string;
  epic: EpicKey;
  status: JobStatus;
  log: string[];          // accumulated status messages
  data: any | null;
  error: string | null;
  listeners: Set<() => void>;
}

const jobs = new Map<string, FetchJob>();

function jobKey(ticker: string, epic: EpicKey) { return `${ticker}:${epic}`; }

function notify(job: FetchJob) { job.listeners.forEach((fn) => fn()); }

async function startFetch(ticker: string, epic: EpicKey) {
  const key = jobKey(ticker, epic);
  const existing = jobs.get(key);
  if (existing?.status === 'running') return;

  let job: FetchJob;
  if (existing) {
    existing.status = 'running';
    existing.log = ['Starting analysis…'];
    existing.data = null;
    existing.error = null;
    job = existing;
  } else {
    job = { ticker, epic, status: 'running', log: ['Starting analysis…'], data: null, error: null, listeners: new Set() };
    jobs.set(key, job);
  }
  notify(job);

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
          job.log = [...job.log, event.message];
          notify(job);
        } else if (event.type === 'done') {
          job.status = 'done';
          job.data = event.data;
          job.log = [...job.log, 'Done'];
          notify(job);
          axios.post(`${API}/catalyst-saves`, { ticker, epic, data: event.data }).catch(() => {});
        } else if (event.type === 'error') {
          job.status = 'error';
          job.error = event.message;
          job.log = [...job.log, `Error: ${event.message}`];
          notify(job);
        }
      }
    }
    if (job.status === 'running') { job.status = 'error'; job.error = 'Stream ended unexpectedly'; notify(job); }
  } catch (err: any) {
    job.status = 'error';
    job.error = err.message;
    job.log = [...job.log, `Error: ${err.message}`];
    notify(job);
  }
}

function useJob(ticker: string | undefined, epic: EpicKey) {
  const key = ticker ? jobKey(ticker, epic) : '';
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!ticker) return;
    const job = jobs.get(key);
    const listener = () => forceRender((n) => n + 1);
    if (job) {
      job.listeners.add(listener);
      return () => { job.listeners.delete(listener); };
    }
  }, [key, ticker]);

  return ticker ? jobs.get(key) ?? null : null;
}

// ---------------------------------------------------------------------------
// Saved-result cache (avoids re-fetching within a session)
// ---------------------------------------------------------------------------
const savedCache: Record<string, Record<EpicKey, any>> = {};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CatalystTicker() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [activeEpic, setActiveEpic] = useState<EpicKey>('latent');
  const [savedData, setSavedData] = useState<Partial<Record<EpicKey, any>>>({});
  const [savedOk, setSavedOk] = useState(false);
  const [tickerRecord, setTickerRecord] = useState<any | null>(null);
  const [enriching, setEnriching] = useState(false);

  // Enrich ticker in parallel on mount
  useEffect(() => {
    if (!ticker) return;
    setEnriching(true);
    axios.get(`${API}/tickers/${ticker}/enrich`)
      .then(({ data }) => setTickerRecord(data))
      .catch(() => {})
      .finally(() => setEnriching(false));
  }, [ticker]);

  // Load any already-saved results from DB on mount
  useEffect(() => {
    if (!ticker) return;
    if (savedCache[ticker]) { setSavedData(savedCache[ticker]); return; }
    axios.get(`${API}/catalyst-saves`, { params: { ticker } }).then(({ data }) => {
      const map: Record<string, any> = {};
      data.forEach((row: any) => { map[row.epic] = row.data; });
      savedCache[ticker] = map as Record<EpicKey, any>;
      setSavedData(map);
    }).catch(() => {});
  }, [ticker]);

  const job = useJob(ticker, activeEpic);

  // When a job finishes, update savedData so tab dot lights up
  useEffect(() => {
    if (job?.status === 'done' && job.data && ticker) {
      setSavedData((prev) => {
        const next = { ...prev, [activeEpic]: job.data };
        savedCache[ticker] = next as Record<EpicKey, any>;
        return next;
      });
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
    }
  }, [job?.status, job?.data]);

  const load = useCallback(() => {
    if (ticker) startFetch(ticker, activeEpic);
  }, [ticker, activeEpic]);

  const displayData = job?.status === 'done' ? job.data : savedData[activeEpic] ?? null;
  const isRunning = job?.status === 'running';

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
        <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          {tickerRecord?.company_name || 'CATALYST ANALYSIS'}
        </span>
        {isRunning && (
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--blue)' }}>● RUNNING</span>
        )}
        {savedOk && (
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--green)' }}>SAVED</span>
        )}
      </div>

      {/* Ticker enrichment card */}
      {enriching && <TickerCardSkeleton ticker={ticker!} />}
      {!enriching && tickerRecord && <TickerCard record={tickerRecord} />}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24, overflowX: 'auto' }}>
        {EPICS.map(({ key, label }) => {
          const epicJob = ticker ? jobs.get(jobKey(ticker, key)) : null;
          const hasData = !!savedData[key] || epicJob?.status === 'done';
          const running = epicJob?.status === 'running';
          return (
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
              {running && <span style={{ marginLeft: 6, color: 'var(--blue)', fontSize: 8 }}>●</span>}
              {!running && hasData && <span style={{ marginLeft: 6, color: 'var(--green)', fontSize: 8 }}>●</span>}
            </button>
          );
        })}
      </div>

      {/* Loading — progress log only, no raw JSON */}
      {isRunning && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 10 }}>PROGRESS</div>
          {job.log.map((msg, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: i === job.log.length - 1 ? 'var(--blue)' : 'var(--muted)' }}>
                {i === job.log.length - 1 ? '●' : '✓'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: i === job.log.length - 1 ? 'var(--text)' : 'var(--muted)' }}>{msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {job?.status === 'error' && (
        <div style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 16 }}>{job.error}</div>
      )}

      {/* Run button — shown when no data and not running */}
      {!isRunning && !displayData && (
        <button
          onClick={load}
          style={{
            background: 'var(--blue)', border: 'none', color: '#000',
            padding: '8px 20px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12,
          }}
        >
          LOAD {EPICS.find((e) => e.key === activeEpic)?.label}
        </button>
      )}

      {/* Re-run button when data already exists */}
      {!isRunning && displayData && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={load}
            style={{
              background: 'none', border: '1px solid var(--border)', color: 'var(--muted)',
              padding: '4px 12px', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer',
            }}
          >
            RE-RUN ↗
          </button>
        </div>
      )}

      {displayData && <EpicView epic={activeEpic} data={displayData} />}
    </div>
  );
}
