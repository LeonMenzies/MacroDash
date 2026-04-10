import { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE || '/api';

interface Idea {
  id: string;
  date: string;
  tag: string;
  text: string;
}

const TAGS = ['idea', 'bug', 'improvement', 'question'];

const TAG_COLORS: Record<string, string> = {
  idea: 'var(--blue)',
  bug: 'var(--red)',
  improvement: 'var(--green)',
  question: 'var(--yellow)',
};

export default function Ideas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [text, setText] = useState('');
  const [tag, setTag] = useState('idea');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await axios.get(`${API}/ideas`);
      setIdeas(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submit() {
    if (!text.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await axios.post(`${API}/ideas`, { text: text.trim(), tag });
      setText('');
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await axios.delete(`${API}/ideas/${id}`);
      setIdeas((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 20 }}>
        IDEAS &amp; UPDATES
      </h1>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '14px 18px', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {TAGS.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              style={{
                background: tag === t ? TAG_COLORS[t] : 'var(--surface2)',
                border: `1px solid ${tag === t ? TAG_COLORS[t] : 'var(--border)'}`,
                color: tag === t ? '#000' : 'var(--muted)',
                padding: '4px 12px',
                borderRadius: 3,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
          placeholder="Describe the idea, bug, or update... (Ctrl+Enter to save)"
          rows={4}
          style={{
            width: '100%',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            padding: '10px 12px',
            borderRadius: 4,
            resize: 'vertical',
            boxSizing: 'border-box',
            marginBottom: 10,
          }}
        />
        <button
          onClick={submit}
          disabled={saving || !text.trim()}
          style={{
            background: saving ? 'var(--surface2)' : 'var(--blue)',
            border: 'none',
            color: saving ? 'var(--muted)' : '#000',
            padding: '6px 18px',
            borderRadius: 4,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: 12,
            cursor: saving ? 'default' : 'pointer',
          }}
        >
          {saving ? 'SAVING...' : 'SAVE'}
        </button>
        {error && <div style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 8 }}>{error}</div>}
      </div>

      {loading && <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>Loading...</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[...ideas].reverse().map((idea) => (
          <div
            key={idea.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '12px 16px',
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 700,
                color: TAG_COLORS[idea.tag] || 'var(--muted)',
                textTransform: 'uppercase',
                minWidth: 72,
                paddingTop: 2,
              }}
            >
              {idea.tag}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{idea.text}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>{idea.date}</div>
            </div>
            <button
              onClick={() => remove(idea.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 16,
                lineHeight: 1,
                padding: 0,
              }}
              title="Delete"
            >
              ×
            </button>
          </div>
        ))}
        {!loading && ideas.length === 0 && (
          <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>No ideas yet.</div>
        )}
      </div>
    </div>
  );
}
