import type { BiometryComparisonData } from '../../types/biometry';

interface BiometryComparisonMetricsGridProps {
  comparison: BiometryComparisonData;
}

function fmtVal(val: number | null | undefined, unit: string = '', decimals: number = 1): string {
  if (val === null || val === undefined) return '—';
  return `${Number(val).toFixed(decimals)} ${unit}`.trim();
}

function fmtDelta(val: number | null | undefined, unit: string = '', decimals: number = 1): string {
  if (val === null || val === undefined) return '—';
  const num = Number(val);
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(decimals)} ${unit}`.trim();
}

interface MetricCardProps {
  title: string;
  targetVal: string;
  baseVal: string;
  deltaText: string;
  isGood: boolean;
  extraLabel?: string;
  extraGood?: boolean;
}

function MetricCard({
  title,
  targetVal,
  baseVal,
  deltaText,
  isGood,
  extraLabel,
  extraGood,
}: MetricCardProps) {
  return (
    <div
      className="card"
      style={{
        padding: '14px 16px',
        backgroundColor: 'var(--paper)',
        border: '1px solid var(--border)',
        borderRadius: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--fg-muted)',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </span>
        {deltaText && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: 4,
              backgroundColor: isGood ? 'var(--sage-dim, rgba(16,185,129,0.15))' : 'var(--paper-3)',
              color: isGood ? 'var(--sage, #10b981)' : 'var(--ink)',
            }}
          >
            {deltaText}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>{targetVal}</span>
        <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>de {baseVal}</span>
      </div>
      {extraLabel && (
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: extraGood ? 'var(--sage)' : 'var(--fg-muted)',
            fontWeight: 500,
          }}
        >
          {extraLabel}
        </div>
      )}
    </div>
  );
}

export function BiometryComparisonMetricsGrid({ comparison }: BiometryComparisonMetricsGridProps) {
  const isWeightLoss = (comparison.weightDelta ?? 0) < 0;
  const isFatLoss = (comparison.fatMassDelta ?? 0) < 0;
  const isLeanGain = (comparison.leanMassDelta ?? 0) > 0;
  const isSkinfoldsDown = (comparison.skinfoldsSumDeltaMm ?? 0) < 0;

  const weightDeltaText =
    comparison.weightDelta !== null && comparison.weightDelta !== undefined
      ? `${fmtDelta(comparison.weightDelta, 'kg')}${comparison.weightDeltaPercent ? ` (${fmtDelta(comparison.weightDeltaPercent, '%')})` : ''}`
      : '';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        padding: '16px 20px',
      }}
    >
      <MetricCard
        title="Peso Total"
        targetVal={fmtVal(comparison.targetWeight, 'kg')}
        baseVal={fmtVal(comparison.baseWeight, 'kg')}
        deltaText={weightDeltaText}
        isGood={isWeightLoss}
      />
      <MetricCard
        title="Gordura Corporal"
        targetVal={fmtVal(comparison.targetBodyFatPercent, '%')}
        baseVal={fmtVal(comparison.baseBodyFatPercent, '%')}
        deltaText={fmtDelta(comparison.bodyFatDelta, '%')}
        isGood={isFatLoss}
        extraLabel={
          comparison.fatMassDelta !== null
            ? fmtDelta(comparison.fatMassDelta, 'kg gordura')
            : undefined
        }
        extraGood={isFatLoss}
      />
      <MetricCard
        title="Massa Magra"
        targetVal={fmtVal(comparison.targetLeanMassKg, 'kg')}
        baseVal={fmtVal(comparison.baseLeanMassKg, 'kg')}
        deltaText={fmtDelta(comparison.leanMassDelta, 'kg')}
        isGood={isLeanGain}
      />
      <MetricCard
        title="Σ Dobras Cutâneas"
        targetVal={fmtVal(comparison.targetSkinfoldsSumMm, 'mm')}
        baseVal={fmtVal(comparison.baseSkinfoldsSumMm, 'mm')}
        deltaText={fmtDelta(comparison.skinfoldsSumDeltaMm, 'mm')}
        isGood={isSkinfoldsDown}
      />
    </div>
  );
}
