import { MultiLineChart } from './MultiLineChart';
import { LineChart } from '../viz';
import type { BiometryAssessmentDTO } from '../../types/patient';

interface BiometryEvolutionChartCardProps {
  list: BiometryAssessmentDTO[];
  metric: string;
  onSetMetric: (m: string) => void;
  metricCfg: Record<string, { label: string; unit?: string; color?: string }>;
  fmtDate: (iso: string | null | undefined) => string;
}

export function BiometryEvolutionChartCard({
  list,
  metric,
  onSetMetric,
  metricCfg,
  fmtDate,
}: BiometryEvolutionChartCardProps) {
  const last = list[list.length - 1];
  const chartData = list.map((a) => ({
    date: fmtDate(a.assessmentDate),
    weight: a.weight,
    fat: a.bodyFatPercent ?? 0,
    lean: a.leanMassKg ?? 0,
    water: a.waterPercent ?? 0,
    visceral: a.visceralFatLevel ?? 0,
    bmr: a.bmrKcal ?? 0,
  }));

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-h">
        <div className="title">Evolução · {list.length} avaliações</div>
        <div className="sub">
          {fmtDate(list[0].assessmentDate)} → {fmtDate(last.assessmentDate).toUpperCase()}
        </div>
        <div className="spacer" />
        <div className="seg" style={{ height: 26 }}>
          {Object.keys(metricCfg).map((k) => (
            <button key={k} className={metric === k ? 'active' : ''} onClick={() => onSetMetric(k)}>
              {metricCfg[k].label}
            </button>
          ))}
        </div>
      </div>
      <div className="card-b">
        {metric === 'all' ? (
          <MultiLineChart
            data={chartData}
            metrics={[
              { key: 'weight', color: 'var(--ink-contrast)', label: 'Peso', unit: 'kg' },
              { key: 'fat', color: 'var(--carb)', label: 'Gordura', unit: '%' },
              { key: 'lean', color: 'var(--sage-dim)', label: 'Massa', unit: 'kg' },
              { key: 'water', color: 'var(--sky)', label: 'Água', unit: '%' },
            ]}
          />
        ) : (
          <LineChart
            data={chartData}
            width={900}
            height={200}
            yKey={metric}
            color={metricCfg[metric].color}
            fill="rgba(11,12,10,0.05)"
            unit={metricCfg[metric].unit || ''}
          />
        )}
      </div>
    </div>
  );
}
