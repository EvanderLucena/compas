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

export function BiometryTab({ patientId, patientStatus }: BiometryTabProps) {
  const { data: assessments, isLoading } = usePatientBiometry(patientId);
  const isReadOnly = useAuthStore((s) => Boolean(s.user?.readOnly));
  const openReadOnlyModal = useAuthStore((s) => s.openReadOnlyModal);
  const [metric, setMetric] = useState('all');
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
      <BiometryLatestCard
        last={last!}
        prev={prev}
        downloadingBiometry={downloadingBiometry}
        onDownloadPdf={handleDownloadBiometryPdf}
        onNewEval={handleOpenNewEval}
        fmtDate={fmtDate}
      />

      <BiometryEvolutionCard patientId={patientId} />

      {list.length >= 2 && (
        <BiometryEvolutionChartCard
          list={list}
          metric={metric}
          onSetMetric={setMetric}
          metricCfg={METRIC_CONFIG}
          fmtDate={fmtDate}
        />
      )}

      <BiometryMeasuresGrid last={last!} prev={prev} fmtDate={fmtDate} />

      <BiometryHistoryTable list={list} fmtDate={fmtDate} />

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
