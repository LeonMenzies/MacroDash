import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { EpicView, type EpicKey } from '../components/EpicViews';
import StockOverview from '../components/StockOverview';
import TimelineView from '../components/TimelineView';

const API = import.meta.env.VITE_API_BASE || '/api';

type ModelKey = 'haiku' | 'sonnet' | 'opus';

const MODEL_OPTIONS: { key: ModelKey; label: string; note: string; color: string }[] = [
  { key: 'haiku',  label: 'Haiku',  note: '~$0.02/run · fast · web search', color: 'var(--green)' },
  { key: 'sonnet', label: 'Sonnet', note: '~$0.05/run · web search',     color: 'var(--yellow)' },
  { key: 'opus',   label: 'Opus',   note: '~$0.30/run · deepest · web',  color: 'var(--red)' },
];

function ModelSelect({ value, onChange }: { value: ModelKey; onChange: (v: ModelKey) => void }) {
  const selected = MODEL_OPTIONS.find((m) => m.key === value)!;
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ModelKey)}
        style={{
          appearance: 'none',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 3,
          color: selected.color,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.06em',
          padding: '3px 24px 3px 8px',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {MODEL_OPTIONS.map((m) => (
          <option key={m.key} value={m.key}>
            {m.label.toUpperCase()} — {m.note}
          </option>
        ))}
      </select>
      <span style={{
        position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
        pointerEvents: 'none', color: 'var(--muted)', fontSize: 9,
      }}>▾</span>
    </div>
  );
}

type TabKey = 'overview' | 'timeline' | EpicKey;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'OVERVIEW' },
  { key: 'timeline', label: 'TIMELINE' },
  { key: 'latent', label: 'LATENT' },
  { key: 'definitive', label: 'DEFINITIVE' },
  { key: 'horizon', label: 'HORIZON' },
  { key: 'macro', label: 'MACRO OVERLAY' },
];

// ---------------------------------------------------------------------------
// Module-level fetch manager (survives unmount/remount)
// ---------------------------------------------------------------------------

type JobStatus = 'idle' | 'running' | 'done' | 'error';

interface FetchJob {
  ticker: string;
  epic: EpicKey;
  status: JobStatus;
  log: string[];
  data: any | null;
  error: string | null;
  listeners: Set<() => void>;
}

const jobs = new Map<string, FetchJob>();

function jobKey(ticker: string, epic: EpicKey) { return `${ticker}:${epic}`; }
function notify(job: FetchJob) { job.listeners.forEach((fn) => fn()); }

async function startFetch(ticker: string, epic: EpicKey, model: ModelKey = 'haiku') {
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

  const url = `${API}/catalyst/${ticker}?epic=${epic}&model=${model}`;
  try {
    const response = await fetch(url);
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

function useJob(ticker: string | undefined, epic: EpicKey, version: number) {
  const key = ticker ? jobKey(ticker, epic) : '';
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!ticker) return;
    const job = jobs.get(key);
    if (!job) return;
    const listener = () => forceRender((n) => n + 1);
    job.listeners.add(listener);
    return () => { job.listeners.delete(listener); };
  }, [key, ticker, version]); // version changes when load() is called, re-subscribing to the new job

  return ticker ? jobs.get(key) ?? null : null;
}

// ---------------------------------------------------------------------------
// Saved-result cache
// ---------------------------------------------------------------------------
const savedCache: Record<string, Record<EpicKey, any>> = {};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StockDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [savedData, setSavedData] = useState<Partial<Record<EpicKey, any>>>({});
  const [savedOk, setSavedOk] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [loadVersion, setLoadVersion] = useState(0);
  const [model, setModel] = useState<ModelKey>('haiku');

  const isEpicTab = (k: TabKey): k is EpicKey => k !== 'overview' && k !== 'timeline';
  const activeEpic: EpicKey = isEpicTab(activeTab) ? activeTab : 'latent';

  // Enrich ticker (saves to Supabase watchlist + gets company name)
  useEffect(() => {
    if (!ticker) return;
    axios.get(`${API}/tickers/${ticker}/enrich`)
      .then(({ data }) => setCompanyName(data.company_name))
      .catch(() => {});
  }, [ticker]);

  // Load saved catalyst results from DB
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

  const job = useJob(ticker, activeEpic, loadVersion);

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
    if (ticker && isEpicTab(activeTab)) {
      startFetch(ticker, activeEpic, model);
      setLoadVersion((v) => v + 1);
    }
  }, [ticker, activeTab, activeEpic, model]);

  const displayData = isEpicTab(activeTab)
    ? (job?.status === 'done' ? job.data : savedData[activeEpic] ?? null)
    : null;
  const isRunning = isEpicTab(activeTab) && job?.status === 'running';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700 }}>{ticker}</h1>
        {companyName && (
          <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{companyName}</span>
        )}
        {isRunning && (
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--blue)' }}>● RUNNING</span>
        )}
        {savedOk && (
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--green)' }}>SAVED</span>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 28, overflowX: 'auto' }}>
        {TABS.map(({ key, label }) => {
          const epicJob = isEpicTab(key) && ticker ? jobs.get(jobKey(ticker, key)) : null;
          const hasData = isEpicTab(key) && (!!savedData[key] || epicJob?.status === 'done');
          const timelineReady = key === 'timeline' && (['latent', 'definitive', 'horizon'] as EpicKey[]).some((e) => !!savedData[e]);
          const running = epicJob?.status === 'running';
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${activeTab === key ? 'var(--blue)' : 'transparent'}`,
                color: activeTab === key ? 'var(--text)' : 'var(--muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.08em',
                padding: '10px 20px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {label}
              {running && <span style={{ marginLeft: 6, color: 'var(--blue)', fontSize: 8 }}>●</span>}
              {!running && (hasData || timelineReady) && <span style={{ marginLeft: 6, color: 'var(--green)', fontSize: 8 }}>●</span>}
            </button>
          );
        })}
      </div>

      {/* OVERVIEW tab */}
      {activeTab === 'overview' && ticker && <StockOverview ticker={ticker} />}

      {/* TIMELINE tab */}
      {activeTab === 'timeline' && (() => {
        const missingEpics = (['latent', 'definitive', 'horizon'] as EpicKey[])
          .filter((e) => !savedData[e])
          .map((e) => e.toUpperCase());
        return (
          <TimelineView
            latent={savedData.latent}
            definitive={savedData.definitive}
            horizon={savedData.horizon}
            missingEpics={missingEpics}
          />
        );
      })()}

      {/* Epic tabs */}
      {isEpicTab(activeTab) && (
        <>
          {isRunning && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '14px 18px', marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 10 }}>PROGRESS</div>
              {job!.log.map((msg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: i === job!.log.length - 1 ? 'var(--blue)' : 'var(--muted)' }}>
                    {i === job!.log.length - 1 ? '●' : '✓'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: i === job!.log.length - 1 ? 'var(--text)' : 'var(--muted)' }}>{msg}</span>
                </div>
              ))}
            </div>
          )}

          {job?.status === 'error' && (
            <div style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 16 }}>{job.error}</div>
          )}

          {!isRunning && !displayData && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={load} style={{
                background: 'var(--blue)', border: 'none', color: '#000',
                padding: '8px 20px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}>
                LOAD {TABS.find((t) => t.key === activeTab)?.label}
              </button>
              <ModelSelect value={model} onChange={setModel} />
            </div>
          )}

          {!isRunning && displayData && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <button onClick={load} style={{
                background: 'none', border: '1px solid var(--border)', color: 'var(--muted)',
                padding: '4px 12px', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer',
              }}>
                RE-RUN ↗
              </button>
              <ModelSelect value={model} onChange={setModel} />
            </div>
          )}

          {displayData && <EpicView epic={activeEpic} data={displayData} />}
        </>
      )}
    </div>
  );
}
