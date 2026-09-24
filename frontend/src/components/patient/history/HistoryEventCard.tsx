import type { PatientTimelineEvent } from '../../../types/timeline';
import { HistoryEventBadge } from './HistoryEventBadge';

interface HistoryEventCardProps {
  event: PatientTimelineEvent;
  isFirst?: boolean;
  isLast?: boolean;
}

function fmtDateTime(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return (
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' às ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
}

export function HistoryEventCard({ event, isLast }: HistoryEventCardProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr',
        gap: 14,
        position: 'relative',
      }}
    >
      {/* Timeline Rail & Dot */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: event.currentEpisode ? 'var(--lime, #10b981)' : 'var(--fg-subtle)',
            border: '2px solid var(--paper, #fff)',
            boxShadow: '0 0 0 1.5px var(--border)',
            marginTop: 14,
            zIndex: 2,
          }}
        />
        {!isLast && (
          <div
            style={{
              position: 'absolute',
              top: 24,
              bottom: -10,
              width: 1.5,
              backgroundColor: 'var(--border)',
              zIndex: 1,
            }}
          />
        )}
      </div>

      {/* Event Content Card */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          marginBottom: 12,
          border: '1px solid var(--border)',
          backgroundColor: 'var(--surface, #ffffff)',
          transition: 'border-color 0.15s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HistoryEventBadge eventType={event.eventType} />
            {event.episodeTitle && (
              <span
                style={{
                  fontSize: 10.5,
                  padding: '2px 6px',
                  borderRadius: 3,
                  backgroundColor: event.currentEpisode
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'var(--surface-2)',
                  color: event.currentEpisode ? 'var(--sage, #10b981)' : 'var(--fg-subtle)',
                  fontWeight: 500,
                }}
              >
                {event.episodeTitle}
              </span>
            )}
          </div>

          <div
            className="mono tnum"
            style={{
              fontSize: 11,
              color: 'var(--fg-subtle)',
            }}
          >
            {fmtDateTime(event.eventAt)}
          </div>
        </div>

        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg)', lineHeight: 1.35 }}>
          {event.title}
        </div>

        {event.description && (
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--fg-muted)',
              marginTop: 4,
              lineHeight: 1.45,
            }}
          >
            {event.description}
          </div>
        )}
      </div>
    </div>
  );
}
