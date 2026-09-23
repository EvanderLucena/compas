import { useState } from 'react';
import { usePatientHistoryEpisodes, useHistoricalEpisode } from '../../stores/clinicalStore';
import type { HistoryEpisodeListItem, HistorySnapshot } from '../../types/patient';

interface HistoryTabProps {
  patientId: string;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
}

function HistoryAssessmentsList({ assessments }: { assessments: HistorySnapshot['assessments'] }) {
  if (assessments.length === 0) {
    return (
      <div
        style={{
          padding: '14px 0',
          textAlign: 'center',
          color: 'var(--fg-subtle)',
          fontSize: 13,
        }}
      >
        Sem avaliação registrada no período
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        AVALIAÇÕES BIOMÉTRICAS
      </div>
      {assessments.map((a) => (
        <div
          key={a.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: 12,
            padding: '10px 12px',
            background: 'var(--surface-2)',
            borderRadius: 6,
            marginBottom: 6,
          }}
        >
          <div>
            <div className="eyebrow">DATA</div>
            <div className="mono tnum" style={{ fontSize: 12 }}>
              {fmtDate(a.assessmentDate)}
            </div>
          </div>
          <div>
            <div className="eyebrow">PESO</div>
            <div className="mono tnum" style={{ fontSize: 12 }}>
              {a.weight} kg
            </div>
          </div>
          <div>
            <div className="eyebrow">% GORDURA</div>
            <div className="mono tnum" style={{ fontSize: 12 }}>
              {a.bodyFatPercent ?? '—'}
              {a.bodyFatPercent != null ? '%' : ''}
            </div>
          </div>
          <div>
            <div className="eyebrow">MASSA MAGRA</div>
            <div className="mono tnum" style={{ fontSize: 12 }}>
              {a.leanMassKg ?? '—'}
              {a.leanMassKg != null ? ' kg' : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryTimelineList({ events }: { events: HistorySnapshot['timelineEvents'] }) {
  if (events.length === 0) {
    return (
      <div style={{ padding: '18px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--fg-subtle)', marginBottom: 4 }}>
          Sem eventos no período
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>
          Avaliações, planos e registros aparecem aqui
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        EVENTOS
      </div>
      {events.map((ev) => (
        <div
          key={ev.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
            gap: 12,
            padding: '10px 12px',
            borderBottom: '1px solid var(--border)',
            alignItems: 'start',
          }}
        >
          <div className="mono" style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>
            {fmtDateTime(ev.eventAt)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{ev.title}</div>
            {ev.description && (
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>
                {ev.description}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function HistorySnapshotView({
  snapshot,
  isLoading,
}: {
  snapshot: HistorySnapshot | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: 'var(--fg-subtle)', fontSize: 13 }}>
        Carregando...
      </div>
    );
  }
  if (!snapshot) return null;

  return (
    <div style={{ padding: '14px 18px' }}>
      <HistoryAssessmentsList assessments={snapshot.assessments} />
      <HistoryTimelineList events={snapshot.timelineEvents} />

      {snapshot.episodeObjective && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--fg-muted)' }}>
          <span
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.06em',
              color: 'var(--fg-subtle)',
              marginRight: 6,
            }}
          >
            OBJETIVO
          </span>
          {snapshot.episodeObjective}
        </div>
      )}
    </div>
  );
}

function HistoryEpisodeCard({
  ep,
  isSelected,
  onToggle,
  snapshot,
  snapshotLoading,
}: {
  ep: HistoryEpisodeListItem;
  isSelected: boolean;
  onToggle: () => void;
  snapshot: HistorySnapshot | undefined;
  snapshotLoading: boolean;
}) {
  return (
    <div className="card" style={{ cursor: 'pointer' }} onClick={onToggle}>
      <div
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {fmtDate(ep.startDate)} → {fmtDate(ep.endDate)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>
            {ep.durationDays} dias · {ep.assessmentCount}{' '}
            {ep.assessmentCount === 1 ? 'avaliação' : 'avaliações'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {ep.hasBiometry ? (
            <span className="chip ontrack">
              <span className="d" />
              Com biometria
            </span>
          ) : (
            <span className="chip" style={{ color: 'var(--fg-subtle)' }}>
              Sem biometria
            </span>
          )}
          <span style={{ color: 'var(--fg-subtle)', fontSize: 16 }}>{isSelected ? '▴' : '▾'}</span>
        </div>
      </div>

      {isSelected && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <HistorySnapshotView snapshot={snapshot} isLoading={snapshotLoading} />
        </div>
      )}
    </div>
  );
}

export function HistoryTab({ patientId }: HistoryTabProps) {
  const { data: episodes, isLoading } = usePatientHistoryEpisodes(patientId);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const { data: snapshot, isLoading: snapshotLoading } = useHistoricalEpisode(
    patientId,
    selectedEpisodeId,
  );

  if (isLoading) {
    return (
      <div style={{ padding: '24px 28px' }}>
        <p style={{ color: 'var(--fg-subtle)', fontSize: 14 }}>Carregando histórico...</p>
      </div>
    );
  }

  const episodeList: HistoryEpisodeListItem[] = episodes ?? [];

  if (episodeList.length === 0) {
    return (
      <div style={{ padding: '24px 28px' }}>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>
            Nenhum episódio fechado encontrado
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20 }}>
        <div className="eyebrow">Episódios finalizados</div>
        <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 2 }}>
          <span className="mono tnum" style={{ fontWeight: 600, color: 'var(--fg)' }}>
            {episodeList.length}
          </span>{' '}
          {episodeList.length === 1 ? 'episódio' : 'episódios'} · clique para ver detalhes
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {episodeList.map((ep) => (
          <HistoryEpisodeCard
            key={ep.episodeId}
            ep={ep}
            isSelected={selectedEpisodeId === ep.episodeId}
            onToggle={() =>
              setSelectedEpisodeId(selectedEpisodeId === ep.episodeId ? null : ep.episodeId)
            }
            snapshot={selectedEpisodeId === ep.episodeId ? snapshot : undefined}
            snapshotLoading={Boolean(selectedEpisodeId === ep.episodeId && snapshotLoading)}
          />
        ))}
      </div>
    </div>
  );
}
