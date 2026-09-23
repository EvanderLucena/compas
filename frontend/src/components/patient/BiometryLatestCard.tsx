import { IconPlus, IconDownload } from '../icons';
import { BioCell } from './BioCell';
import type { BiometryAssessmentDTO } from '../../types/patient';

interface BiometryLatestCardProps {
  last: BiometryAssessmentDTO;
  prev?: BiometryAssessmentDTO;
  downloadingBiometry: boolean;
  onDownloadPdf: () => void;
  onNewEval: () => void;
  fmtDate: (iso: string | null | undefined) => string;
}

export function BiometryLatestCard({
  last,
  prev,
  downloadingBiometry,
  onDownloadPdf,
  onNewEval,
  fmtDate,
}: BiometryLatestCardProps) {
  const delta = (
    cur: number | null | undefined,
    prevVal: number | null | undefined,
  ): number | undefined => {
    if (cur == null || prevVal == null) return undefined;
    const d = cur - prevVal;
    return Math.round(d * 10) / 10;
  };
  const weightDelta = delta(last.weight, prev?.weight);
  const bodyFatDelta = delta(last.bodyFatPercent, prev?.bodyFatPercent);
  const leanMassDelta = delta(last.leanMassKg, prev?.leanMassKg);

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div
        className="biometry-latest-grid"
        style={{
          padding: '18px 22px',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: 20,
          alignItems: 'center',
        }}
      >
        <div>
          <div className="eyebrow">ÚLTIMA AVALIAÇÃO</div>
          <div
            className="serif"
            style={{ fontSize: 22, margin: '4px 0 0', letterSpacing: '-0.01em' }}
          >
            {fmtDate(last.assessmentDate)}
          </div>
        </div>
        <div
          className="biometry-latest-cells"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 20,
            paddingLeft: 20,
            borderLeft: '1px solid var(--border)',
          }}
        >
          <BioCell
            label="Peso"
            value={last.weight}
            unit="kg"
            delta={weightDelta}
            good={weightDelta != null && weightDelta <= 0}
          />
          <BioCell
            label="% Gordura"
            value={last.bodyFatPercent ?? 0}
            unit="%"
            delta={bodyFatDelta}
            good={bodyFatDelta != null && bodyFatDelta < 0}
          />
          <BioCell
            label="Massa magra"
            value={last.leanMassKg ?? 0}
            unit="kg"
            delta={leanMassDelta}
            good={leanMassDelta != null && leanMassDelta > 0}
          />
          <BioCell label="% Água" value={last.waterPercent ?? 0} unit="%" />
          <BioCell label="Gordura visceral" value={last.visceralFatLevel ?? 0} sub="nível" />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <button
            type="button"
            className="btn btn-secondary"
            data-testid="btn-download-biometry-pdf"
            onClick={onDownloadPdf}
            disabled={downloadingBiometry}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            title="Baixar Relatório de Evolução Biométrica em PDF"
          >
            <IconDownload size={13} /> {downloadingBiometry ? 'Baixando...' : 'Relatório em PDF'}
          </button>
          <button className="btn btn-primary" data-testid="btn-new-biometry" onClick={onNewEval}>
            <IconPlus size={13} /> Nova avaliação
          </button>
        </div>
      </div>
    </div>
  );
}
