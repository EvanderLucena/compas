interface BioCellProps {
  label: string;
  value: number;
  unit?: string;
  sub?: string;
  delta?: number;
  good?: boolean;
}

export function BioCell({ label, value, unit, sub, delta, good }: BioCellProps) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 3 }}>
        <div
          className="mono tnum"
          style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em' }}
        >
          {value}
        </div>
        {unit && <div style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>{unit}</div>}
      </div>
      {delta !== undefined && (
        <div
          className="mono tnum"
          style={{
            fontSize: 10.5,
            color: good ? 'var(--sage-dim)' : 'var(--fg-muted)',
            marginTop: 1,
          }}
        >
          {delta > 0 ? '+' : ''}
          {delta} vs. anterior
        </div>
      )}
      {sub && (
        <div className="mono" style={{ fontSize: 10, color: 'var(--fg-subtle)', marginTop: 1 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
