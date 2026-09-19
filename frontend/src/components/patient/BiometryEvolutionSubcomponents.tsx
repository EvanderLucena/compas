import { IconSparkle } from '../icons';
import { formatDate } from '../../utils/biometryFormatters';
import type { BiometryEvolutionSummary } from '../../types/biometry';

export function DeltaBadge({
  val,
  unit,
  invertColor = false,
}: {
  val: number | null | undefined;
  unit: string;
  invertColor?: boolean;
}) {
  if (val == null) return null;
  const formatted = `${val > 0 ? '+' : ''}${val.toFixed(1)} ${unit}`;
  const isGood = invertColor ? val > 0 : val < 0;
  const isBad = invertColor ? val < 0 : val > 0;
  const color = isGood ? 'var(--sage)' : isBad ? 'var(--coral)' : 'var(--fg-muted)';
  const bg = isGood
    ? 'rgba(92, 184, 92, 0.15)'
    : isBad
      ? 'rgba(235, 87, 87, 0.15)'
      : 'color-mix(in srgb, var(--fg-muted) 15%, transparent)';
  const border = isGood
    ? '1px solid rgba(92, 184, 92, 0.25)'
    : isBad
      ? '1px solid rgba(235, 87, 87, 0.25)'
      : '1px solid var(--border)';

  return (
    <span
      className="badge"
      style={{
        color,
        background: bg,
        border,
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

export function EvolutionHeader({
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
        borderBottom: '1px solid var(--border)',
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
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
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

export function MetricBox({
  title,
  value,
  unit,
  delta,
  invertColor = false,
  showDelta = false,
}: MetricBoxProps) {
  return (
    <div
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        padding: 12,
        borderRadius: 6,
      }}
    >
      <div className="eyebrow" style={{ fontSize: 10, color: 'var(--fg-muted)' }}>
        {title}
      </div>
      <div className="serif" style={{ fontSize: 20, margin: '2px 0', color: 'var(--fg)' }}>
        {value?.toFixed(1) ?? '—'}{' '}
        <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{unit}</span>
      </div>
      {showDelta && <DeltaBadge val={delta} unit={unit} invertColor={invertColor} />}
    </div>
  );
}

export function EvolutionMetricsGrid({
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
