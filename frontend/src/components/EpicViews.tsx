import { useState } from 'react';

export type EpicKey = 'latent' | 'definitive' | 'horizon' | 'macro';

export function EpicView({ epic, data }: { epic: EpicKey; data: any }) {
  const resolved: any = (() => {
    if (!data?.raw) return data;
    const stripped = data.raw
      .replace(/<cite[^>]*>([\s\S]*?)<\/cite>/g, '$1')
      .replace(/```(?:json)?\s*/g, '')
      .replace(/```/g, '')
      .replace(/,(\s*[}\]])/g, '$1')
      .trim();

    function sanitize(s: string) {
      let inStr = false, esc = false, out = '';
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (esc) { out += c; esc = false; continue; }
        if (c === '\\') { out += c; esc = true; continue; }
        if (c === '"') { inStr = !inStr; out += c; continue; }
        if (inStr && (c === '\n' || c === '\r')) { out += '\\n'; continue; }
        if (inStr && c === '\t') { out += '\\t'; continue; }
        out += c;
      }
      return out;
    }

    function tryParse(s: string) {
      try { return JSON.parse(s); } catch {}
      try {
        const start = s.indexOf('{'), end = s.lastIndexOf('}');
        if (start !== -1 && end > start) return JSON.parse(s.slice(start, end + 1));
      } catch {}
      try {
        let depth = 0, start = -1;
        for (let i = 0; i < s.length; i++) {
          if (s[i] === '{') { if (depth === 0) start = i; depth++; }
          else if (s[i] === '}') { depth--; if (depth === 0 && start !== -1) return JSON.parse(s.slice(start, i + 1)); }
        }
      } catch {}
      // close truncated JSON by appending missing brackets
      try {
        let inStr = false, esc = false;
        const stack: string[] = [];
        for (let i = 0; i < s.length; i++) {
          const c = s[i];
          if (esc) { esc = false; continue; }
          if (c === '\\' && inStr) { esc = true; continue; }
          if (c === '"') { inStr = !inStr; continue; }
          if (inStr) continue;
          if (c === '{') stack.push('}');
          else if (c === '[') stack.push(']');
          else if (c === '}' || c === ']') stack.pop();
        }
        if (stack.length > 0) {
          const trimmed = s.replace(/,?\s*"[^"]*$/, '').replace(/,\s*$/, '');
          return JSON.parse(trimmed + stack.reverse().join(''));
        }
      } catch {}
      return null;
    }

    return tryParse(stripped) ?? tryParse(sanitize(stripped)) ?? data;
  })();

  if (resolved.raw) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '14px 18px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 10 }}>RAW RESPONSE</div>
        <p style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{resolved.raw}</p>
      </div>
    );
  }
  if (epic === 'latent') return <LatentView data={resolved} />;
  if (epic === 'definitive') return <DefinitiveView data={resolved} />;
  if (epic === 'horizon') return <HorizonView data={resolved} />;
  if (epic === 'macro') return <MacroView data={resolved} />;
  return null;
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '14px 16px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

export function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: color || 'var(--text)', fontFamily: 'var(--font-mono)' }}>{value || '—'}</div>
    </div>
  );
}

function SourceLink({ url }: { url?: string }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title={url}
      style={{ color: 'var(--muted)', fontSize: 11, lineHeight: 1, textDecoration: 'none', flexShrink: 0 }}
      onClick={(e) => e.stopPropagation()}
    >
      ↗
    </a>
  );
}

function Badge({ text, positive }: { text: string; positive?: boolean }) {
  const color = positive === undefined ? 'var(--muted)' : positive ? 'var(--green)' : 'var(--red)';
  const bg = positive === undefined ? 'transparent' : positive ? 'rgba(46,204,135,0.1)' : 'rgba(255,85,85,0.1)';
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color, background: bg, borderRadius: 3, padding: '1px 6px' }}>
      {text}
    </span>
  );
}

function isPositive(val?: string) {
  if (!val) return undefined;
  if (val.startsWith('+')) return true;
  if (val.startsWith('-')) return false;
  return undefined;
}

// ---------------------------------------------------------------------------
// Shared sources list
// ---------------------------------------------------------------------------

function SourcesList({ sources }: { sources?: { title: string; url: string }[] }) {
  if (!sources?.length) return null;
  return (
    <div style={{ marginTop: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '12px 16px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 8 }}>SOURCES</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sources.map((s, i) => (
          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={s.url}
          >
            ↗ {s.title || s.url}
          </a>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LATENT — events as cards, revisions as compact rows
// ---------------------------------------------------------------------------

function LatentView({ data }: { data: any }) {
  return (
    <div>
      {data.summary && <p style={{ marginBottom: 16, lineHeight: 1.7, color: 'var(--muted)', fontSize: 13 }}>{data.summary}</p>}

      {data.events?.length > 0 && (
        <Section title="PRICE-MOVING EVENTS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.events.map((e: any, i: number) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: e.notes ? 6 : 0 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>{e.date}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0 }}>{e.event}</span>
                  {e.priceReaction && <Badge text={e.priceReaction} positive={isPositive(e.priceReaction)} />}
                  <SourceLink url={e.source} />
                </div>
                {e.notes && <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>{e.notes}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.estimateRevisions?.length > 0 && (
        <Section title="ESTIMATE REVISIONS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {data.estimateRevisions.map((r: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < data.estimateRevisions.length - 1 ? '1px solid var(--border)' : 'none', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', minWidth: 80, flexShrink: 0 }}>{r.date}</span>
                <span style={{ fontSize: 13, flex: 1 }}>{r.metric}</span>
                {r.change && <Badge text={r.change} positive={isPositive(r.change)} />}
                <SourceLink url={r.source} />
              </div>
            ))}
          </div>
        </Section>
      )}
      <SourcesList sources={data._sources} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// DEFINITIVE — next earnings hero + history cards + upcoming list
// ---------------------------------------------------------------------------

function DefinitiveView({ data }: { data: any }) {
  return (
    <div>
      {data.nextEarnings && (
        <Section title="NEXT EARNINGS">
          <div className="grid-4" style={{ gap: 12 }}>
            <Stat label="DATE" value={data.nextEarnings.date} />
            <Stat label="EPS CONSENSUS" value={data.nextEarnings.epsConsensus} />
            <Stat label="REV CONSENSUS" value={data.nextEarnings.revenueConsensus} />
            <Stat label="IMPLIED MOVE" value={data.nextEarnings.impliedMove} color="var(--yellow)" />
          </div>
        </Section>
      )}

      {data.earningsHistory?.length > 0 && (
        <Section title="EARNINGS HISTORY">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.earningsHistory.map((e: any, i: number) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>{e.date}</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {e.impliedMove && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--yellow)' }}>impl {e.impliedMove}</span>}
                    {e.actualMove && <Badge text={`act ${e.actualMove}`} positive={isPositive(e.actualMove)} />}
                    <SourceLink url={e.source} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap' }}>
                  {e.epsActual && <span>EPS <strong style={{ color: 'var(--text)' }}>{e.epsActual}</strong></span>}
                  {e.epsConsensus && <span>vs {e.epsConsensus}e</span>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.upcomingEvents?.length > 0 && (
        <Section title="UPCOMING EVENTS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {data.upcomingEvents.map((e: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: i < data.upcomingEvents.length - 1 ? '1px solid var(--border)' : 'none', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', minWidth: 90, flexShrink: 0 }}>{e.date}</span>
                <span style={{ fontSize: 13, flex: 1 }}>{e.event}</span>
                <SourceLink url={e.source} />
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HORIZON — catalyst cards
// ---------------------------------------------------------------------------

function CaseBox({ summary, points, color, bg, arrow, open: openProp, onClick: onClickProp }: {
  summary: string; points?: string[]; color: string; bg: string; arrow: string;
  open?: boolean; onClick?: () => void;
}) {
  const [selfOpen, setSelfOpen] = useState(false);
  const controlled = onClickProp !== undefined;
  const isOpen = controlled ? openProp : selfOpen;
  const handleClick = controlled ? onClickProp : () => setSelfOpen((v) => !v);
  const pts = (points || []).filter(Boolean);
  const hasPoints = pts.length > 0;

  return (
    <div style={{ fontSize: 12, color, background: bg, borderRadius: 3, overflow: 'hidden' }}>
      <div
        onClick={hasPoints ? handleClick : undefined}
        style={{ padding: '8px 10px', cursor: hasPoints ? 'pointer' : 'default' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <span style={{ flexShrink: 0 }}>{arrow}</span>
          <span style={{ flex: 1, lineHeight: 1.5 }}>{summary}</span>
        </div>
        {hasPoints && !controlled && (
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${color}22`, display: 'flex', justifyContent: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', opacity: 0.8 }}>
            <span style={{ fontSize: 14 }}>{isOpen ? '▴' : '▾'}</span>
            <span>{isOpen ? 'HIDE DETAIL' : 'SHOW DETAIL'}</span>
          </div>
        )}
      </div>
      {isOpen && hasPoints && !controlled && (
        <ul style={{ margin: '0 0 8px 0', paddingLeft: 28, paddingRight: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {pts.map((pt, j) => (
            <li key={j} style={{ fontSize: 12, color, lineHeight: 1.55 }}>{pt}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HorizonView({ data }: { data: any }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.catalysts?.map((c: any, i: number) => {
        const bullPts = (c.bullPoints || []).filter(Boolean);
        const bearPts = (c.bearPoints || []).filter(Boolean);
        const hasDetails = bullPts.length > 0 || bearPts.length > 0;
        const isOpen = openIdx === i;

        return (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, flex: 1, minWidth: 0 }}>{c.event}</span>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                {c.confidence && <span className={`tag tag-${c.confidence?.toLowerCase()}`}>{c.confidence}</span>}
                {c.estimatedMagnitude && <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--yellow)', fontSize: 12 }}>{c.estimatedMagnitude}</span>}
                <SourceLink url={c.source} />
              </div>
            </div>
            {c.expectedTiming && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>{c.expectedTiming}</div>
            )}
            <div className="grid-2" style={{ gap: 8 }}>
              {c.bullCase && (
                <CaseBox
                  summary={c.bullCase}
                  points={bullPts}
                  color="var(--green)"
                  bg="rgba(46,204,135,0.07)"
                  arrow="↑"
                  open={isOpen}
                  onClick={hasDetails ? () => setOpenIdx(isOpen ? null : i) : undefined}
                />
              )}
              {c.bearCase && (
                <CaseBox
                  summary={c.bearCase}
                  points={bearPts}
                  color="var(--red)"
                  bg="rgba(255,85,85,0.07)"
                  arrow="↓"
                  open={isOpen}
                  onClick={hasDetails ? () => setOpenIdx(isOpen ? null : i) : undefined}
                />
              )}
            </div>

            {hasDetails && (
              <div
                onClick={() => setOpenIdx(isOpen ? null : i)}
                style={{
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  userSelect: 'none',
                }}
              >
                <span style={{ fontSize: 14 }}>{isOpen ? '▴' : '▾'}</span>
                <span>{isOpen ? 'HIDE DETAIL' : 'SHOW DETAIL'}</span>
              </div>
            )}

            {isOpen && (
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {bullPts.length > 0 && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)', letterSpacing: '0.1em', marginBottom: 8 }}>BULL CASE</div>
                    <ul style={{ margin: 0, paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {bullPts.map((pt: string, j: number) => (
                        <li key={j} style={{ fontSize: 12, color: 'var(--green)', lineHeight: 1.55 }}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {bearPts.length > 0 && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--red)', letterSpacing: '0.1em', marginBottom: 8 }}>BEAR CASE</div>
                    <ul style={{ margin: 0, paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {bearPts.map((pt: string, j: number) => (
                        <li key={j} style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.55 }}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <SourcesList sources={data._sources} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// MACRO — sensitivity cards + regime prose
// ---------------------------------------------------------------------------

function MacroView({ data }: { data: any }) {
  return (
    <div>
      {data.regimeAssessment && (
        <Section title="REGIME ASSESSMENT">
          <p style={{ lineHeight: 1.7, fontSize: 13 }}>{data.regimeAssessment}</p>
        </Section>
      )}

      {data.sensitivities?.length > 0 && (
        <Section title="MACRO SENSITIVITIES">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.sensitivities.map((s: any, i: number) => {
              const dir = s.direction?.toLowerCase();
              const dirColor = dir === 'positive' ? 'var(--green)' : dir === 'negative' ? 'var(--red)' : 'var(--yellow)';
              return (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: s.notes ? 6 : 0 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, flex: 1 }}>{s.factor}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: dirColor, fontWeight: 700 }}>
                      {dir === 'positive' ? '↑' : dir === 'negative' ? '↓' : '↔'} {s.direction?.toUpperCase()}
                    </span>
                    {s.beta && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>β {s.beta}</span>}
                    <SourceLink url={s.source} />
                  </div>
                  {s.notes && <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>{s.notes}</p>}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <div className="grid-2">
        {data.riskOn && (
          <Section title="RISK-ON">
            <CaseBox
              summary={data.riskOn}
              points={data.riskOnPoints}
              color="var(--green)"
              bg="transparent"
              arrow="↑"
            />
          </Section>
        )}
        {data.riskOff && (
          <Section title="RISK-OFF">
            <CaseBox
              summary={data.riskOff}
              points={data.riskOffPoints}
              color="var(--red)"
              bg="transparent"
              arrow="↓"
            />
          </Section>
        )}
      </div>
    </div>
  );
}
