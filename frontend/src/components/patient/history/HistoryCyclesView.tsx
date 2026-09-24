import { useState } from 'react';
import {
  usePatientHistoryEpisodes,
  useHistoricalEpisode,
  usePatientTimeline,
} from '../../../stores/clinicalStore';
import type { HistoryEpisodeListItem, HistorySnapshot } from '../../../types/patient';
import { IconScale, IconPlan } from '../../icons';

interface HistoryCyclesViewProps {
  patientId: string;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function PastCycleSnapshotView({
  snapshot,
  isLoading,
}: {
  snapshot: HistorySnapshot | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div style={{ padding: 18, textAlign: 'center', color: 'var(--fg-subtle)', fontSize: 13 }}>
        Carregando dados do ciclo...
      </div>
    );
  }
  if (!snapshot) return null;

  return (
    <div style={{ padding: '16px 20px' }}>
      {snapshot.episodeObjective && (
        <div style={{ marginBottom: 14, fontSize: 12, color: 'var(--fg-muted)' }}>
          <span
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.06em',
              color: 'var(--fg-subtle)',
              marginRight: 6,
            }}
          >
            OBJETIVO DO CICLO:
          </span>
          <strong>{snapshot.episodeObjective}</strong>
        </div>
      )}

      {snapshot.assessments.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            AVALIAÇÕES BIOMÉTRICAS DO CICLO
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {snapshot.assessments.map((a) => (
              <div
                key={a.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: 12,
                  padding: '8px 12px',
                  background: 'var(--surface-2)',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              >
                <div>
                  <div className="eyebrow">DATA</div>
                  <div className="mono tnum">{fmtDate(a.assessmentDate)}</div>
                </div>
                <div>
                  <div className="eyebrow">PESO</div>
                  <div className="mono tnum" style={{ fontWeight: 600 }}>
                    {a.weight} kg
                  </div>
                </div>
                <div>
                  <div className="eyebrow">% GORDURA</div>
                  <div className="mono tnum">
                    {a.bodyFatPercent != null ? `${a.bodyFatPercent}%` : '—'}
                  </div>
                </div>
                <div>
                  <div className="eyebrow">MASSA MAGRA</div>
                  <div className="mono tnum">
                    {a.leanMassKg != null ? `${a.leanMassKg} kg` : '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 16,
          padding: '10px 14px',
          backgroundColor: 'var(--surface-2)',
          borderRadius: 6,
          fontSize: 12,
          color: 'var(--fg-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconPlan size={14} />
          <span>
            {snapshot.mealSlotCount} {snapshot.mealSlotCount === 1 ? 'refeição' : 'refeições'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconScale size={14} />
          <span>{snapshot.assessments.length} avaliações registradas</span>
        </div>
      </div>
    </div>
  );
}

function PastCycleCard({
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
    <div className="card" style={{ overflow: 'hidden' }}>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
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
          {ep.hasBiometry && (
            <span className="chip ontrack" style={{ fontSize: 11 }}>
              Com biometria
            </span>
          )}
          <span style={{ color: 'var(--fg-subtle)', fontSize: 16 }}>{isSelected ? '▴' : '▾'}</span>
        </div>
      </div>

      {isSelected && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <PastCycleSnapshotView snapshot={snapshot} isLoading={snapshotLoading} />
        </div>
      )}
    </div>
  );
}

export function HistoryCyclesView({ patientId }: HistoryCyclesViewProps) {
  const { data: episodes, isLoading } = usePatientHistoryEpisodes(patientId);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const { data: snapshot, isLoading: snapshotLoading } = useHistoricalEpisode(
    patientId,
    selectedEpisodeId,
  );

  const { data: timeline } = usePatientTimeline(patientId);
  const episodeList: HistoryEpisodeListItem[] = episodes ?? [];
  const activeEvents = (timeline ?? []).filter((ev) => ev.currentEpisode);
  const hasActiveCycle = activeEvents.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {hasActiveCycle ? (
        <div
          className="card"
          style={{
            padding: '16px 20px',
            border: '1.5px solid var(--lime, #10b981)',
            backgroundColor: 'var(--surface, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="chip ontrack">
                  <span className="d" />
                  Ciclo Atual (Em andamento)
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--fg-muted)' }}>
                {activeEvents.length}{' '}
                {activeEvents.length === 1 ? 'registro clínico' : 'registros clínicos'} no ciclo
                atual com plano alimentar e acompanhamento ativo via WhatsApp.
              </div>
            </div>
            <div
              className="mono"
              style={{ fontSize: 11.5, color: 'var(--sage, #10b981)', fontWeight: 600 }}
            >
              ATIVO
            </div>
          </div>
        </div>
      ) : (
        <div
          className="card"
          style={{
            padding: '14px 18px',
            backgroundColor: 'var(--surface-2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--fg-muted)' }}>
            Nenhum ciclo de acompanhamento em andamento no momento.
          </div>
          <span className="chip neutral" style={{ fontSize: 11 }}>
            SEM CICLO ATIVO
          </span>
        </div>
      )}

      <div>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          CICLOS ANTERIORES FINALIZADOS ({episodeList.length})
        </div>

        {isLoading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-subtle)' }}>
            Carregando ciclos anteriores...
          </div>
        ) : episodeList.length === 0 ? (
          <div className="card" style={{ padding: '28px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 2 }}>
              Nenhum ciclo anterior finalizado
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-subtle)' }}>
              Quando um ciclo for concluído, o snapshot aparecerá aqui.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {episodeList.map((ep) => (
              <PastCycleCard
                key={ep.episodeId}
                ep={ep}
                isSelected={selectedEpisodeId === ep.episodeId}
                onToggle={() =>
                  setSelectedEpisodeId(selectedEpisodeId === ep.episodeId ? null : ep.episodeId)
                }
                snapshot={snapshot}
                snapshotLoading={Boolean(selectedEpisodeId === ep.episodeId && snapshotLoading)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
