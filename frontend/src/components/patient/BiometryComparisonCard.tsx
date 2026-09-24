import { useState, useEffect } from 'react';
import type { BiometryAssessmentDTO } from '../../types/patient';
import { useBiometryComparison } from '../../stores/clinicalStore';
import { BiometryComparisonSelectors } from './BiometryComparisonSelectors';
import { BiometryComparisonMetricsGrid } from './BiometryComparisonMetricsGrid';
import { BiometryComparisonDualBarChart } from './BiometryComparisonDualBarChart';
import { BiometryComparisonTable } from './BiometryComparisonTable';
import { BiometryComparisonFeedback } from './BiometryComparisonFeedback';

interface BiometryComparisonCardProps {
  patientId: string;
  assessments: BiometryAssessmentDTO[];
  fmtDate: (iso: string | null | undefined) => string;
  onDownloadPdf?: () => void;
  downloadingPdf?: boolean;
}

export function BiometryComparisonCard({
  patientId,
  assessments,
  fmtDate,
  onDownloadPdf,
  downloadingPdf,
}: BiometryComparisonCardProps) {
  // Default base: first assessment (marco zero); target: latest assessment
  const [baseId, setBaseId] = useState<string>(() => assessments[0]?.id ?? '');
  const [targetId, setTargetId] = useState<string>(
    () => assessments[assessments.length - 1]?.id ?? '',
  );

  // Keep ids in sync if assessments change
  useEffect(() => {
    if (assessments.length >= 2) {
      if (!assessments.some((a) => a.id === baseId)) {
        setBaseId(assessments[0].id);
      }
      if (!assessments.some((a) => a.id === targetId)) {
        setTargetId(assessments[assessments.length - 1].id);
      }
    }
  }, [assessments, baseId, targetId]);

  const {
    data: comparison,
    isLoading,
    isError,
  } = useBiometryComparison(patientId, baseId || null, targetId || null);

  const handleSwap = () => {
    setBaseId(targetId);
    setTargetId(baseId);
  };

  const handleSetPreset = (preset: 'initialVsLatest' | 'prevVsLatest') => {
    if (assessments.length < 2) return;
    if (preset === 'initialVsLatest') {
      setBaseId(assessments[0].id);
      setTargetId(assessments[assessments.length - 1].id);
    } else if (preset === 'prevVsLatest') {
      setBaseId(assessments[assessments.length - 2].id);
      setTargetId(assessments[assessments.length - 1].id);
    }
  };

  return (
    <div
      className="card"
      data-testid="biometry-comparison-card"
      style={{
        marginBottom: 20,
        border: '1px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        className="card-h"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--paper)',
        }}
      >
        <div>
          <div className="title" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
            Comparativo Evolutivo Biométrico
          </div>
          <div className="sub" style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>
            ANÁLISE COMPARATIVA DE PROGRESSO · RETORNO CLÍNICO
          </div>
        </div>
        {comparison && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 6,
              backgroundColor: 'var(--paper-2)',
              color: 'var(--fg-muted)',
              border: '1px solid var(--border)',
            }}
          >
            Intervalo: {comparison.daysBetween} dias
          </div>
        )}
      </div>

      {/* Selectors */}
      <BiometryComparisonSelectors
        assessments={assessments}
        baseId={baseId}
        targetId={targetId}
        onSelectBase={setBaseId}
        onSelectTarget={setTargetId}
        onSwap={handleSwap}
        onSetPreset={handleSetPreset}
        fmtDate={fmtDate}
      />

      {/* Content states */}
      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-muted)' }}>
          Calculando comparativo biométrico...
        </div>
      ) : isError || !comparison ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--coral)' }}>
          Não foi possível carregar os dados de comparação.
        </div>
      ) : (
        <>
          <BiometryComparisonMetricsGrid comparison={comparison} />
          <BiometryComparisonDualBarChart comparison={comparison} />
          <BiometryComparisonTable comparison={comparison} />
          <BiometryComparisonFeedback
            comparison={comparison}
            onDownloadPdf={onDownloadPdf}
            downloadingPdf={downloadingPdf}
          />
        </>
      )}
    </div>
  );
}
