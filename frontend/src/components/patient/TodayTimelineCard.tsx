import { Timeline } from './Timeline';
import type { TimelineEvent } from '../../types/patient';

interface TodayTimelineCardProps {
  shortDate: string;
  dateLabel: string;
  isToday: boolean;
  extractionsLoading: boolean;
  extractionsError: boolean;
  timelineEvents: TimelineEvent[];
  patientId: string;
}

export function TodayTimelineCard({
  shortDate,
  dateLabel,
  isToday,
  extractionsLoading,
  extractionsError,
  timelineEvents,
  patientId,
}: TodayTimelineCardProps) {
  return (
    <div className="card">
      <div className="card-h">
        <div className="title">Refeições reportadas · {shortDate}</div>
        <div className="sub">
          {isToday ? 'SOMENTE REGISTROS DO PACIENTE' : `DATA: ${dateLabel.toUpperCase()}`}
        </div>
        <div className="spacer" />
        <div
          style={{
            fontSize: 11,
            color: 'var(--fg-muted)',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <span
            style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--lime-dim)' }}
          />{' '}
          Extraído via WhatsApp
        </div>
      </div>
      <div className="card-b tight">
        {extractionsLoading && (
          <div
            style={{
              padding: '20px 0',
              textAlign: 'center',
              color: 'var(--fg-subtle)',
              fontSize: 14,
            }}
          >
            Carregando extrações...
          </div>
        )}
        {extractionsError && !extractionsLoading && (
          <div style={{ padding: '12px 0', textAlign: 'center' }}>
            <p style={{ color: 'var(--coral)', fontSize: 13 }}>
              Erro ao carregar extrações do WhatsApp.
            </p>
            <p style={{ color: 'var(--fg-muted)', fontSize: 11 }}>Mostrando dados locais.</p>
          </div>
        )}
        {!extractionsLoading && (
          <Timeline
            items={timelineEvents}
            patientId={patientId}
            emptyTitle={`Nenhum registro em ${shortDate}`}
          />
        )}
      </div>
    </div>
  );
}
