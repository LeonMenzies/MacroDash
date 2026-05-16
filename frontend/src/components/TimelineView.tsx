// Combines latent + definitive + horizon data into a single chronological timeline.

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function parseDate(raw?: string): { date: Date | null; approx: boolean } {
  if (!raw) return { date: null, approx: false };
  const s = raw.trim();

  // ISO / standard date
  const iso = new Date(s);
  if (!isNaN(iso.getTime())) return { date: iso, approx: false };

  // "Q1 2026", "Q2 2025" etc.
  const qMatch = s.match(/Q([1-4])\s*(\d{4})/i);
  if (qMatch) {
    const month = (parseInt(qMatch[1]) - 1) * 3;
    return { date: new Date(parseInt(qMatch[2]), month, 1), approx: true };
  }

  // "May 2026", "January 2025" etc.
  const monthMatch = s.match(/([A-Za-z]+)\s+(\d{4})/);
  if (monthMatch) {
    const d = new Date(`${monthMatch[1]} 1, ${monthMatch[2]}`);
    if (!isNaN(d.getTime())) return { date: d, approx: true };
  }

  // "early/mid/late 2026"
  const fuzzyMatch = s.match(/(early|mid|late)\s*(\d{4})/i);
  if (fuzzyMatch) {
    const month = fuzzyMatch[1].toLowerCase() === 'early' ? 1 : fuzzyMatch[1].toLowerCase() === 'mid' ? 5 : 9;
    return { date: new Date(parseInt(fuzzyMatch[2]), month, 1), approx: true };
  }

  // Just a year "2026"
  const yearMatch = s.match(/^(\d{4})$/);
  if (yearMatch) return { date: new Date(parseInt(yearMatch[1]), 0, 1), approx: true };

  return { date: null, approx: true };
}

function formatDate(raw: string, approx: boolean): string {
  const { date } = parseDate(raw);
  if (!date) return raw;
  const formatted = date.toLocaleDateString(undefined, { month: 'short', day: approx ? undefined : 'numeric', year: 'numeric' });
  return approx ? `~${formatted}` : formatted;
}

type EpicBadge = 'LATENT' | 'DEFINITIVE' | 'HORIZON';

interface TimelineItem {
  id: string;
  sortDate: Date | null;
  approx: boolean;
  rawDate: string;
  isPast: boolean;
  epic: EpicBadge;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  detail1?: string;
  detail2?: string;
  priceTag?: string;
  source?: string;
}

function epicColor(epic: EpicBadge) {
  if (epic === 'LATENT') return 'var(--muted)';
  if (epic === 'DEFINITIVE') return 'var(--blue)';
  return 'var(--yellow)';
}

function buildItems(latent: any, definitive: any, horizon: any): TimelineItem[] {
  const items: TimelineItem[] = [];

  // LATENT — events
  latent?.events?.forEach((e: any, i: number) => {
    const { date, approx } = parseDate(e.date);
    items.push({
      id: `latent-event-${i}`,
      sortDate: date,
      approx,
      rawDate: e.date || '',
      isPast: date ? date < TODAY : true,
      epic: 'LATENT',
      title: e.event,
      subtitle: e.notes,
      priceTag: e.priceReaction,
      source: e.source,
    });
  });

  // LATENT — estimate revisions
  latent?.estimateRevisions?.forEach((r: any, i: number) => {
    const { date, approx } = parseDate(r.date);
    items.push({
      id: `latent-rev-${i}`,
      sortDate: date,
      approx,
      rawDate: r.date || '',
      isPast: date ? date < TODAY : true,
      epic: 'LATENT',
      title: r.metric,
      badge: r.change,
      badgeColor: r.change?.startsWith('+') ? 'var(--green)' : r.change?.startsWith('-') ? 'var(--red)' : 'var(--muted)',
      source: r.source,
    });
  });

  // DEFINITIVE — next earnings
  if (definitive?.nextEarnings?.date) {
    const { date, approx } = parseDate(definitive.nextEarnings.date);
    items.push({
      id: 'definitive-next-earnings',
      sortDate: date,
      approx,
      rawDate: definitive.nextEarnings.date,
      isPast: date ? date < TODAY : false,
      epic: 'DEFINITIVE',
      title: 'Earnings',
      detail1: definitive.nextEarnings.epsConsensus ? `EPS est. ${definitive.nextEarnings.epsConsensus}` : undefined,
      detail2: definitive.nextEarnings.impliedMove ? `Implied move ${definitive.nextEarnings.impliedMove}` : undefined,
      source: definitive.nextEarnings.source,
    });
  }

  // DEFINITIVE — earnings history
  definitive?.earningsHistory?.forEach((e: any, i: number) => {
    const { date, approx } = parseDate(e.date);
    items.push({
      id: `definitive-hist-${i}`,
      sortDate: date,
      approx,
      rawDate: e.date || '',
      isPast: date ? date < TODAY : true,
      epic: 'DEFINITIVE',
      title: 'Earnings',
      detail1: e.epsActual ? `EPS ${e.epsActual} vs ${e.epsConsensus}e` : undefined,
      priceTag: e.actualMove,
      source: e.source,
    });
  });

  // DEFINITIVE — upcoming events
  definitive?.upcomingEvents?.forEach((e: any, i: number) => {
    const { date, approx } = parseDate(e.date);
    items.push({
      id: `definitive-upcoming-${i}`,
      sortDate: date,
      approx,
      rawDate: e.date || '',
      isPast: date ? date < TODAY : false,
      epic: 'DEFINITIVE',
      title: e.event,
      source: e.source,
    });
  });

  // HORIZON — catalysts
  horizon?.catalysts?.forEach((c: any, i: number) => {
    const { date, approx } = parseDate(c.expectedTiming);
    items.push({
      id: `horizon-${i}`,
      sortDate: date,
      approx,
      rawDate: c.expectedTiming || '',
      isPast: date ? date < TODAY : false,
      epic: 'HORIZON',
      title: c.event,
      badge: c.confidence,
      badgeColor: c.confidence === 'CONFIRMED' ? 'var(--green)' : c.confidence === 'EXPECTED' ? 'var(--blue)' : 'var(--yellow)',
      detail1: c.bullCase ? `↑ ${c.bullCase}` : undefined,
      detail2: c.bearCase ? `↓ ${c.bearCase}` : undefined,
      priceTag: c.estimatedMagnitude,
      source: c.source,
    });
  });

  // Sort: items with dates by date, undated items at the end
  items.sort((a, b) => {
    if (!a.sortDate && !b.sortDate) return 0;
    if (!a.sortDate) return 1;
    if (!b.sortDate) return -1;
    return a.sortDate.getTime() - b.sortDate.getTime();
  });

  return items;
}

function EpicTag({ epic }: { epic: EpicBadge }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
      color: epicColor(epic), border: `1px solid ${epicColor(epic)}`,
      borderRadius: 2, padding: '1px 5px', letterSpacing: '0.05em', flexShrink: 0,
    }}>
      {epic}
    </span>
  );
}

function SourceLink({ url }: { url?: string }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{ color: 'var(--muted)', fontSize: 11, textDecoration: 'none', flexShrink: 0 }}
      onClick={(e) => e.stopPropagation()}
    >↗</a>
  );
}

export default function TimelineView({
  latent, definitive, horizon, missingEpics,
}: {
  latent: any; definitive: any; horizon: any; missingEpics: string[];
}) {
  const items = buildItems(latent, definitive, horizon);

  // Find where TODAY falls in the list
  const todayIndex = items.findIndex((item) => !item.isPast);

  return (
    <div>
      {missingEpics.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4,
          padding: '10px 14px', marginBottom: 20,
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)',
        }}>
          Run {missingEpics.join(', ')} to populate the full timeline.
        </div>
      )}

      {items.length === 0 && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
          No data yet — run Latent, Definitive, and Horizon first.
        </div>
      )}

      <div style={{ position: 'relative', paddingLeft: 28 }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute', left: 9, top: 0, bottom: 0,
          width: 2, background: 'var(--border)',
        }} />

        {items.map((item, idx) => {
          const showTodayBefore = todayIndex !== -1 && idx === todayIndex;
          const isPast = item.isPast;

          return (
            <div key={item.id}>
              {showTodayBefore && <TodayMarker />}

              {/* Dot */}
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <div style={{
                  position: 'absolute', left: -23, top: 14,
                  width: 10, height: 10, borderRadius: '50%',
                  background: isPast ? 'var(--border)' : epicColor(item.epic),
                  border: `2px solid ${isPast ? 'var(--border)' : epicColor(item.epic)}`,
                  boxShadow: isPast ? 'none' : `0 0 6px ${epicColor(item.epic)}40`,
                }} />

                {/* Card */}
                <div style={{
                  background: 'var(--surface)',
                  border: `1px solid ${isPast ? 'var(--border)' : epicColor(item.epic) + '60'}`,
                  borderRadius: 4,
                  padding: '10px 12px',
                  opacity: isPast ? 0.6 : 1,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>
                      {item.rawDate ? formatDate(item.rawDate, item.approx) : 'TBD'}
                    </span>
                    <EpicTag epic={item.epic} />
                    {item.badge && (
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                        color: item.badgeColor, flexShrink: 0,
                      }}>
                        {item.badge}
                      </span>
                    )}
                    {item.priceTag && (
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                        color: item.priceTag.startsWith('+') ? 'var(--green)' : item.priceTag.startsWith('-') ? 'var(--red)' : 'var(--yellow)',
                        marginLeft: 'auto',
                      }}>
                        {item.priceTag}
                      </span>
                    )}
                    <SourceLink url={item.source} />
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: (item.subtitle || item.detail1 || item.detail2) ? 6 : 0 }}>
                    {item.title}
                  </div>

                  {item.subtitle && (
                    <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>{item.subtitle}</p>
                  )}

                  {(item.detail1 || item.detail2) && (
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: item.subtitle ? 4 : 0 }}>
                      {item.detail1 && (
                        <span style={{
                          fontSize: 12, lineHeight: 1.5,
                          color: item.detail1.startsWith('↑') ? 'var(--green)' : item.detail1.startsWith('↓') ? 'var(--red)' : 'var(--muted)',
                        }}>
                          {item.detail1}
                        </span>
                      )}
                      {item.detail2 && (
                        <span style={{
                          fontSize: 12, lineHeight: 1.5,
                          color: item.detail2.startsWith('↑') ? 'var(--green)' : item.detail2.startsWith('↓') ? 'var(--red)' : 'var(--muted)',
                        }}>
                          {item.detail2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* TODAY at end if all items are past or no future items found */}
        {todayIndex === -1 && items.length > 0 && <TodayMarker />}
      </div>
    </div>
  );
}

function TodayMarker() {
  return (
    <div style={{ position: 'relative', marginBottom: 16, marginTop: 4 }}>
      <div style={{
        position: 'absolute', left: -23, top: '50%', transform: 'translateY(-50%)',
        width: 10, height: 10, borderRadius: '50%',
        background: 'var(--blue)', boxShadow: '0 0 8px var(--blue)',
      }} />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        borderTop: '1px dashed var(--blue)',
        paddingTop: 6,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
          color: 'var(--blue)', letterSpacing: '0.1em',
        }}>
          TODAY — {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
    </div>
  );
}
