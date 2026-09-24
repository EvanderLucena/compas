import type { BiometryComparisonData } from '../../types/biometry';

interface BiometryComparisonDualBarChartProps {
  comparison: BiometryComparisonData;
}

interface MetricBarData {
  key: string;
  label: string;
  unit: string;
  baseVal: number;
  targetVal: number;
}

interface BarItemProps {
  item: MetricBarData;
  maxVal: number;
}

function MetricBarItem({ item, maxVal }: BarItemProps) {
  const basePct = Math.min(Math.round((item.baseVal / maxVal) * 100), 100);
  const targetPct = Math.min(Math.round((item.targetVal / maxVal) * 100), 100);
  const delta = item.targetVal - item.baseVal;
  const sign = delta > 0 ? '+' : '';

  const isPositiveShift = item.key === 'fat' || item.key === 'skinfolds' ? delta < 0 : delta > 0;
  const deltaColor =
    delta === 0 ? 'var(--fg-muted)' : isPositiveShift ? 'var(--sage)' : 'var(--coral)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{item.label}</span>
        <span style={{ color: 'var(--fg-muted)', fontSize: 11 }}>
          {item.baseVal} {item.unit} →{' '}
          <strong style={{ color: 'var(--ink)' }}>
            {item.targetVal} {item.unit}
          </strong>
          {item.baseVal > 0 && (
            <span style={{ marginLeft: 8, color: deltaColor, fontWeight: 600 }}>
              ({sign}
              {delta.toFixed(1)} {item.unit})
            </span>
          )}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div
          style={{
            height: 10,
            width: '100%',
            backgroundColor: 'var(--paper-2)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${basePct}%`,
              backgroundColor: 'var(--border, #cbd5e1)',
              borderRadius: 3,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
        <div
          style={{
            height: 10,
            width: '100%',
            backgroundColor: 'var(--paper-2)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${targetPct}%`,
              backgroundColor: 'var(--sage, #10b981)',
              borderRadius: 3,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function DualBarChartLegend({
  baseDate,
  targetDate,
}: {
  baseDate: string | null;
  targetDate: string | null;
}) {
  return (
    <div style={{ display: 'flex', gap: 16, fontSize: 12, alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 2,
            backgroundColor: 'var(--border, #cbd5e1)',
            display: 'inline-block',
          }}
        />
        <span style={{ color: 'var(--fg-muted)' }}>Base ({baseDate ?? 'Inicial'})</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 2,
            backgroundColor: 'var(--sage, #10b981)',
            display: 'inline-block',
          }}
        />
        <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
          Retorno ({targetDate ?? 'Atual'})
        </span>
      </div>
    </div>
  );
}

function getVal(v: number | null | undefined): number {
  return v ?? 0;
}

function buildComparisonMetricItems(comparison: BiometryComparisonData): MetricBarData[] {
  const items: MetricBarData[] = [
    {
      key: 'weight',
      label: 'Peso',
      unit: 'kg',
      baseVal: getVal(comparison.baseWeight),
      targetVal: getVal(comparison.targetWeight),
    },
    {
      key: 'lean',
      label: 'Massa Magra',
      unit: 'kg',
      baseVal: getVal(comparison.baseLeanMassKg),
      targetVal: getVal(comparison.targetLeanMassKg),
    },
    {
      key: 'fat',
      label: 'Massa Gorda',
      unit: 'kg',
      baseVal: getVal(comparison.baseFatMassKg),
      targetVal: getVal(comparison.targetFatMassKg),
    },
    {
      key: 'water',
      label: 'Água Corporal',
      unit: '%',
      baseVal: getVal(comparison.baseWaterPercent),
      targetVal: getVal(comparison.targetWaterPercent),
    },
  ];

  if (comparison.baseSkinfoldsSumMm || comparison.targetSkinfoldsSumMm) {
    items.push({
      key: 'skinfolds',
      label: 'Σ Dobras',
      unit: 'mm',
      baseVal: getVal(comparison.baseSkinfoldsSumMm),
      targetVal: getVal(comparison.targetSkinfoldsSumMm),
    });
  }

  return items;
}

export function BiometryComparisonDualBarChart({
  comparison,
}: BiometryComparisonDualBarChartProps) {
  const items = buildComparisonMetricItems(comparison);
  const maxVal = Math.max(...items.flatMap((i) => [i.baseVal, i.targetVal]), 10);

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: 'var(--paper)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
          Comparativo Visual de Composição Corporal
        </span>
        <DualBarChartLegend baseDate={comparison.baseDate} targetDate={comparison.targetDate} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {items.map((item) => (
          <MetricBarItem key={item.key} item={item} maxVal={maxVal} />
        ))}
      </div>
    </div>
  );
}
