import type { PatientTimelineEvent } from '../../../types/timeline';
import { HistoryEventCard } from './HistoryEventCard';

interface HistoryTimelineFeedProps {
  events: PatientTimelineEvent[];
}

function getMonthYearHeader(iso: string) {
  if (!iso) return 'Outros';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Outros';
  const month = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return month.charAt(0).toUpperCase() + month.slice(1);
}

export function HistoryTimelineFeed({ events }: HistoryTimelineFeedProps) {
  if (events.length === 0) {
    return (
      <div className="card" style={{ padding: '36px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 4 }}>
          Nenhum registro encontrado
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>
          Ajuste os filtros ou a busca acima para encontrar eventos clínicos.
        </div>
      </div>
    );
  }

  // Group events by Month Year
  const groups: { month: string; events: PatientTimelineEvent[] }[] = [];
  let currentMonth = '';
  let currentGroup: PatientTimelineEvent[] = [];

  for (const ev of events) {
    const month = getMonthYearHeader(ev.eventAt);
    if (month !== currentMonth) {
      if (currentGroup.length > 0) {
        groups.push({ month: currentMonth, events: currentGroup });
      }
      currentMonth = month;
      currentGroup = [ev];
    } else {
      currentGroup.push(ev);
    }
  }
  if (currentGroup.length > 0) {
    groups.push({ month: currentMonth, events: currentGroup });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {groups.map((group) => (
        <div key={group.month}>
          {/* Month Header Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: 'var(--fg-subtle)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
              }}
            >
              {group.month}
            </div>
            <div
              style={{
                flex: 1,
                height: 1,
                backgroundColor: 'var(--border)',
              }}
            />
          </div>

          {/* Event Items in Month */}
          <div>
            {group.events.map((ev, idx) => (
              <HistoryEventCard key={ev.id} event={ev} isLast={idx === group.events.length - 1} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
