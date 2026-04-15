export type EpicKey = 'latent' | 'definitive' | 'horizon' | 'macro';

export function EpicView({ epic, data }: { epic: EpicKey; data: any }) {
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

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '14px 18px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

export function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
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
