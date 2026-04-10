import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TEST_TICKERS = ['RF', 'CCL', 'EPAM', 'CENX'];

export default function CatalystBrain() {
  const [input, setInput] = useState('');
  const navigate = useNavigate();

  function go(ticker: string) {
    const t = ticker.trim().toUpperCase();
    if (t) navigate(`/catalyst-brain/${t}`);
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 20 }}>
        CATALYST BRAIN
      </h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 32, maxWidth: 400 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && go(input)}
          placeholder="Enter ticker (e.g. AAPL)"
          style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 14, textTransform: 'uppercase' }}
        />
        <button
          onClick={() => go(input)}
          style={{
            background: 'var(--blue)', border: 'none', color: '#000',
            padding: '6px 18px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontWeight: 700,
          }}
        >
          GO
        </button>
      </div>

      <div style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 12, letterSpacing: '0.08em' }}>
        WATCHLIST
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {TEST_TICKERS.map((t) => (
          <button
            key={t}
            onClick={() => go(t)}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--text)', padding: '6px 16px', borderRadius: 4,
              fontFamily: 'var(--font-mono)', fontSize: 13,
            }}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
