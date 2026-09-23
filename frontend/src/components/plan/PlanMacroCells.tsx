interface DailyMacroProps {
  label: string;
  value: string;
  sub?: string;
  color: string;
}

export function DailyMacro({ label, value, sub, color }: DailyMacroProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 82 }}>
      <div className="eyebrow">{label}</div>
      <div
        className="mono tnum"
        style={{ fontSize: 22, fontWeight: 500, color, letterSpacing: '-0.02em', marginTop: 2 }}
      >
        {value}
      </div>
      {sub && (
        <div className="mono" style={{ fontSize: 10, color: 'var(--fg-subtle)' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

interface TotalCellProps {
  label: string;
  actual: number;
  target: number;
  unit?: string;
  color?: string;
}

export function TotalCell({ label, actual, target, unit = '', color }: TotalCellProps) {
  const pct = target > 0 ? actual / target : 0;
  const ok = pct >= 0.9 && pct <= 1.1;

  return (
    <div>
      <div className="eyebrow">
        {label} · {target}
        {unit}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 3 }}>
        <div
          className="mono tnum"
          style={{ fontSize: 18, fontWeight: 500, color: color || 'var(--fg)' }}
        >
          {actual}
          {unit}
        </div>
        {target > 0 && (
          <div
            className="mono tnum"
            style={{ fontSize: 11, color: ok ? 'var(--sage-dim)' : 'var(--amber)' }}
          >
            {pct >= 1 ? '+' : ''}
            {Math.round((pct - 1) * 100)}%
          </div>
        )}
      </div>
    </div>
  );
}
