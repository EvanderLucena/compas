import { useState } from 'react';
import type { BiometryAssessmentDTO, PatientStatus } from '../../types/patient';
import { IconPlus } from '../icons';
import { downloadPatientDocument } from '../../api/documents';
import { useToastStore } from '../../stores/toastStore';
import { useAuthStore } from '../../stores/authStore';
import { NewBiometryModal } from './NewBiometryModal';
import { StatusReviewModal } from './StatusReviewModal';
import { BiometryEvolutionCard } from './BiometryEvolutionCard';
import { usePatientBiometry, useCreateBiometry } from '../../stores/clinicalStore';
import { BiometryLatestCard } from './BiometryLatestCard';
import { BiometryEvolutionChartCard } from './BiometryEvolutionChartCard';
import { BiometryMeasuresGrid } from './BiometryMeasuresGrid';
import { BiometryHistoryTable } from './BiometryHistoryTable';
import { BiometryComparisonCard } from './BiometryComparisonCard';

interface BiometryTabProps {
  patientId: string;
  patientStatus: PatientStatus;
}

const METRIC_CONFIG: Record<string, { label: string; unit?: string; color?: string }> = {
  all: { label: 'Todas' },
  weight: { label: 'Peso', unit: 'kg', color: 'var(--ink-contrast)' },
  fat: { label: 'Gordura', unit: '%', color: 'var(--carb)' },
  lean: { label: 'Massa', unit: 'kg', color: 'var(--sage-dim)' },
  water: { label: 'Água', unit: '%', color: 'var(--sky)' },
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function BiometryViewModeNav({
  viewMode,
  onSetViewMode,
}: {
  viewMode: 'overview' | 'comparison';
  onSetViewMode: (mode: 'overview' | 'comparison') => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 4,
          backgroundColor: 'var(--paper-2)',
          padding: 4,
          borderRadius: 8,
          border: '1px solid var(--border)',
        }}
      >
        <button
          type="button"
          className={`btn ${viewMode === 'overview' ? 'btn-primary' : 'btn-subtle'}`}
          style={{ fontSize: 13, padding: '6px 16px' }}
          onClick={() => onSetViewMode('overview')}
        >
          Visão Geral
        </button>
        <button
          type="button"
          data-testid="btn-toggle-comparison"
          className={`btn ${viewMode === 'comparison' ? 'btn-primary' : 'btn-subtle'}`}
          style={{ fontSize: 13, padding: '6px 16px' }}
          onClick={() => onSetViewMode('comparison')}
        >
          📊 Comparar Avaliações
        </button>
      </div>

      {viewMode === 'overview' ? (
        <button
          type="button"
          className="btn btn-subtle"
          style={{ fontSize: 13, padding: '6px 14px' }}
          onClick={() => onSetViewMode('comparison')}
        >
          📊 Abrir Comparador Evolutivo
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-subtle"
          style={{ fontSize: 13, padding: '6px 14px' }}
          onClick={() => onSetViewMode('overview')}
        >
          ← Voltar para Visão Geral
        </button>
      )}
    </div>
  );
}

interface BiometryOverviewCardsProps {
  last: BiometryAssessmentDTO;
  prev?: BiometryAssessmentDTO;
  list: BiometryAssessmentDTO[];
  patientId: string;
  metric: string;
  onSetMetric: (m: string) => void;
  downloadingBiometry: boolean;
  onDownloadPdf: () => void;
  onNewEval: () => void;
  fmtDate: (iso: string | null | undefined) => string;
}

function BiometryOverviewCards({
  last,
  prev,
  list,
  patientId,
  metric,
  onSetMetric,
  downloadingBiometry,
  onDownloadPdf,
  onNewEval,
  fmtDate,
}: BiometryOverviewCardsProps) {
  return (
    <>
      <BiometryLatestCard
        last={last}
        prev={prev}
        downloadingBiometry={downloadingBiometry}
        onDownloadPdf={onDownloadPdf}
        onNewEval={onNewEval}
        fmtDate={fmtDate}
      />

      <BiometryEvolutionCard patientId={patientId} />

      {list.length >= 2 && (
        <BiometryEvolutionChartCard
          list={list}
          metric={metric}
          onSetMetric={onSetMetric}
          metricCfg={METRIC_CONFIG}
          fmtDate={fmtDate}
        />
      )}

      <BiometryMeasuresGrid last={last} prev={prev} fmtDate={fmtDate} />

      <BiometryHistoryTable list={list} fmtDate={fmtDate} />
    </>
  );
}

export function BiometryTab({ patientId, patientStatus }: BiometryTabProps) {
  const { data: assessments, isLoading } = usePatientBiometry(patientId);
  const isReadOnly = useAuthStore((s) => Boolean(s.user?.readOnly));
  const openReadOnlyModal = useAuthStore((s) => s.openReadOnlyModal);
  const [metric, setMetric] = useState('all');
  const [viewMode, setViewMode] = useState<'overview' | 'comparison'>('overview');
  const [newEvalOpen, setNewEvalOpen] = useState(false);
  const [statusReviewOpen, setStatusReviewOpen] = useState(false);
  const [downloadingBiometry, setDownloadingBiometry] = useState(false);
  const createBiometry = useCreateBiometry(patientId);

  const list: BiometryAssessmentDTO[] = assessments ?? [];
  const last = list[list.length - 1] as BiometryAssessmentDTO | undefined;
  const prev = list.length >= 2 ? list[list.length - 2] : undefined;

  const handleSaveSuccess = () => {
    setNewEvalOpen(false);
    setStatusReviewOpen(true);
  };

  const handleOpenNewEval = () => {
    if (isReadOnly) {
      openReadOnlyModal();
      return;
    }
    setNewEvalOpen(true);
  };

  const handleDownloadBiometryPdf = async () => {
    try {
      setDownloadingBiometry(true);
      await downloadPatientDocument(patientId, 'biometry', `evolucao-biometrica-${patientId}.pdf`);
      useToastStore.getState().showSuccess('Relatório biométrico em PDF baixado com sucesso!');
    } catch {
      useToastStore.getState().showError('Erro ao baixar o relatório biométrico em PDF.');
    } finally {
      setDownloadingBiometry(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '24px 28px' }}>
        <p style={{ color: 'var(--fg-subtle)', fontSize: 14 }}>Carregando biometria...</p>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div style={{ padding: '24px 28px' }}>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--fg-muted)', fontSize: 14, marginBottom: 16 }}>
            Nenhuma avaliação registrada ainda
          </p>
          <button
            className="btn btn-primary"
            data-testid="btn-new-biometry"
            onClick={handleOpenNewEval}
          >
            <IconPlus size={13} /> Registrar primeira avaliação
          </button>
        </div>
        {newEvalOpen && (
          <NewBiometryModal
            createMutation={createBiometry}
            onSuccess={handleSaveSuccess}
            onClose={() => setNewEvalOpen(false)}
          />
        )}
        {statusReviewOpen && (
          <StatusReviewModal
            patientId={patientId}
            currentStatus={patientStatus}
            onClose={() => setStatusReviewOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      {list.length >= 2 && <BiometryViewModeNav viewMode={viewMode} onSetViewMode={setViewMode} />}

      {viewMode === 'comparison' && list.length >= 2 ? (
        <BiometryComparisonCard
          patientId={patientId}
          assessments={list}
          fmtDate={fmtDate}
          onDownloadPdf={handleDownloadBiometryPdf}
          downloadingPdf={downloadingBiometry}
        />
      ) : (
        <BiometryOverviewCards
          last={last!}
          prev={prev}
          list={list}
          patientId={patientId}
          metric={metric}
          onSetMetric={setMetric}
          downloadingBiometry={downloadingBiometry}
          onDownloadPdf={handleDownloadBiometryPdf}
          onNewEval={handleOpenNewEval}
          fmtDate={fmtDate}
        />
      )}

      {newEvalOpen && (
        <NewBiometryModal
          createMutation={createBiometry}
          onSuccess={handleSaveSuccess}
          onClose={() => setNewEvalOpen(false)}
        />
      )}
      {statusReviewOpen && (
        <StatusReviewModal
          patientId={patientId}
          currentStatus={patientStatus}
          onClose={() => setStatusReviewOpen(false)}
        />
      )}
    </div>
  );
}
