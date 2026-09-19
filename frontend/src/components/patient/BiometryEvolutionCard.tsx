import * as React from 'react';
import { useBiometryEvolutionSummary } from '../../stores/clinicalStore';
import { useToastStore } from '../../stores/toastStore';
import { IconSparkle, IconCopy, IconCheck } from '../icons';
import type { BiometryEvolutionSummary, PerimetryDelta } from '../../types/biometry';

interface BiometryEvolutionCardProps {
  patientId: string;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDelta(val: number | null | undefined, unit: string, invertColor = false) {
  if (val == null) return null;
  const formatted = `${val > 0 ? '+' : ''}${val.toFixed(1)} ${unit}`;
  const isGood = invertColor ? val > 0 : val < 0;
  const isBad = invertColor ? val < 0 : val > 0;
  const color = isGood ? 'var(--sage)' : isBad ? 'var(--coral)' : 'var(--fg-muted)';
  const bg = isGood
    ? 'rgba(92, 184, 92, 0.12)'
    : isBad
      ? 'rgba(235, 87, 87, 0.12)'
      : 'rgba(255, 255, 255, 0.05)';

  return (
    <span
      className="badge"
      style={{
        color,
        background: bg,
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 7px',
        borderRadius: 4,
      }}
    >
      {formatted}
    </span>
  );
}

function EvolutionHeader({
  summary,
  isMultiple,
}: {
  summary: BiometryEvolutionSummary;
  isMultiple: boolean;
}) {
  const subtitle = isMultiple
    ? `Marco inicial (${formatDate(summary.initialAssessmentDate)}) → Última avaliação (${formatDate(summary.latestAssessmentDate)})`
    : `Marco zero registrado em ${formatDate(summary.initialAssessmentDate)}`;

  return (
    <div
      className="card-h"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid var(--paper-3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            background: 'rgba(168, 204, 82, 0.15)',
            color: 'var(--lime)',
            padding: 6,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconSparkle size={16} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--fg)' }}>
            Inteligência da Evolução Corporal
          </div>
          <div className="sub" style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
            {subtitle}
          </div>
        </div>
      </div>
      <span
        className="badge"
        style={{
          background: 'var(--paper-2)',
          color: 'var(--fg)',
          fontSize: 11,
          padding: '3px 8px',
          borderRadius: 4,
        }}
      >
        {summary.assessmentCount} {summary.assessmentCount === 1 ? 'avaliação' : 'avaliações'}
      </span>
    </div>
  );
}

interface MetricBoxProps {
  title: string;
  value: number | null | undefined;
  unit: string;
  delta: number | null | undefined;
  invertColor?: boolean;
  showDelta?: boolean;
}

function MetricBox({
  title,
  value,
  unit,
  delta,
  invertColor = false,
  showDelta = false,
}: MetricBoxProps) {
  return (
    <div style={{ background: 'var(--paper-2)', padding: 12, borderRadius: 6 }}>
      <div className="eyebrow" style={{ fontSize: 10 }}>
        {title}
      </div>
      <div className="serif" style={{ fontSize: 20, margin: '2px 0' }}>
        {value?.toFixed(1) ?? '—'} <span style={{ fontSize: 12 }}>{unit}</span>
      </div>
      {showDelta && formatDelta(delta, unit, invertColor)}
    </div>
  );
}

function EvolutionMetricsGrid({
  summary,
  isMultiple,
}: {
  summary: BiometryEvolutionSummary;
  isMultiple: boolean;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 12,
        marginBottom: 16,
      }}
    >
      <MetricBox
        title="PESO"
        value={summary.currentWeight}
        unit="kg"
        delta={summary.weightDelta}
        showDelta={isMultiple}
      />
      <MetricBox
        title="GORDURA"
        value={summary.currentBodyFatPercent}
        unit="%"
        delta={summary.bodyFatDelta}
        showDelta={isMultiple}
      />
      <MetricBox
        title="MASSA MAGRA"
        value={summary.currentLeanMassKg}
        unit="kg"
        delta={summary.leanMassDelta}
        invertColor
        showDelta={isMultiple}
      />
      <MetricBox
        title="MASSA GORDA"
        value={summary.currentFatMassKg}
        unit="kg"
        delta={summary.fatMassDelta}
        showDelta={isMultiple}
      />
    </div>
  );
}

function PerimetryDeltasGrid({ deltas }: { deltas: PerimetryDelta[] }) {
  if (!deltas || deltas.length === 0) return null;
  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--paper-3)' }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        CIRCUNFERÊNCIAS CORPORAIS (MARCO INICIAL → ATUAL)
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 10,
        }}
      >
        {deltas.map((p) => (
          <div
            key={p.measureKey}
            style={{
              background: 'var(--paper-2)',
              borderRadius: 6,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg)' }}>{p.label}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                {p.initialCm.toFixed(1)} → {p.currentCm.toFixed(1)} cm
              </div>
            </div>
            {formatDelta(p.deltaCm, 'cm')}
          </div>
        ))}
      </div>
    </div>
  );
}

function EvolutionSynthesisBox({ clinicalSynthesis }: { clinicalSynthesis: string }) {
  return (
    <div
      style={{
        marginTop: 16,
        background: 'rgba(168, 204, 82, 0.06)',
        borderLeft: '3px solid var(--lime)',
        padding: '12px 14px',
        borderRadius: '0 6px 6px 0',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--fg)',
          marginBottom: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>💡 Síntese Clínica da Evolução</span>
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--fg)' }}>
        {clinicalSynthesis}
      </p>
    </div>
  );
}

function EvolutionWhatsAppAction({ whatsappMessage }: { whatsappMessage: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      useToastStore.getState().showSuccess('Mensagem de feedback copiada com sucesso!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      useToastStore.getState().showError('Não foi possível copiar para a área de transferência');
    }
  };

  return (
    <div
      style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
    >
      <button
        type="button"
        className="btn btn-secondary"
        data-testid="btn-copy-biometry-whatsapp"
        onClick={handleCopy}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          padding: '7px 14px',
        }}
      >
        {copied ? (
          <>
            <IconCheck size={14} color="var(--sage)" />
            <span style={{ color: 'var(--sage)', fontWeight: 600 }}>Mensagem Copiada!</span>
          </>
        ) : (
          <>
            <IconCopy size={14} />
            <span>Copiar Mensagem para WhatsApp</span>
          </>
        )}
      </button>
    </div>
  );
}

export function BiometryEvolutionCard({ patientId }: BiometryEvolutionCardProps) {
  const { data: summary, isLoading } = useBiometryEvolutionSummary(patientId);

  if (isLoading || !summary || summary.assessmentCount === 0) {
    return null;
  }

  const isMultiple = summary.assessmentCount >= 2;

  return (
    <div
      className="card"
      data-testid="biometry-evolution-card"
      style={{
        marginBottom: 16,
        border: '1px solid var(--paper-3)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <EvolutionHeader summary={summary} isMultiple={isMultiple} />
      <div className="card-b" style={{ padding: '16px 20px' }}>
        <EvolutionMetricsGrid summary={summary} isMultiple={isMultiple} />
        {isMultiple && <PerimetryDeltasGrid deltas={summary.perimetryDeltas} />}
        <EvolutionSynthesisBox clinicalSynthesis={summary.clinicalSynthesis} />
        {summary.whatsappFeedbackMessage && (
          <EvolutionWhatsAppAction whatsappMessage={summary.whatsappFeedbackMessage} />
        )}
      </div>
    </div>
  );
}
