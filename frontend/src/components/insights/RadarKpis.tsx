import type { RadarSummary } from '../../types/clinicalRadar';

function AggStat({
  label,
  value,
  badge,
  badgeColor,
}: {
  label: string;
  value: string | number;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div className="card" style={{ padding: '16px 18px', position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 6,
        }}
      >
        <div className="eyebrow">{label}</div>
        {badge && (
          <span
            className="mono"
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 12,
              background: badgeColor
                ? `color-mix(in srgb, ${badgeColor} 15%, transparent)`
                : 'var(--surface-2)',
              color: badgeColor || 'var(--fg-muted)',
              border: badgeColor ? 'none' : '1px solid var(--border)',
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div
        className="mono tnum"
        style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-0.02em' }}
      >
        {value}
      </div>
    </div>
  );
}

export function RadarKpis({ summary }: { summary: RadarSummary }) {
  return (
    <div
      className="insights-stats-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14,
        marginBottom: 24,
      }}
    >
      <AggStat label="Pacientes na carteira" value={summary.totalPatients} />
      <AggStat
        label="Atenção Recomendada"
        value={summary.requiringAttentionCount}
        badge={summary.requiringAttentionCount > 0 ? 'Prioridade' : 'Estável'}
        badgeColor={summary.requiringAttentionCount > 0 ? 'var(--coral)' : 'var(--sage)'}
      />
      <AggStat
        label="Sinais de Dificuldade"
        value={summary.strugglingCount}
        badge={summary.strugglingCount > 0 ? 'Atenção' : 'Excelente'}
        badgeColor={summary.strugglingCount > 0 ? 'var(--amber)' : 'var(--sage)'}
      />
      <AggStat
        label="Refeições registradas hoje"
        value={summary.todayExtractionsCount}
        badge="Tempo real"
        badgeColor="var(--sky)"
      />
    </div>
  );
}
