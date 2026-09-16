import { Ring } from './Ring';
import type { MacroTarget } from '../../types/patient';

interface MacroRingsProps {
  macros: MacroTarget;
  size?: number;
  className?: string;
}

export function MacroRings({ macros, size = 64, className }: MacroRingsProps) {
  const items = [
    { key: 'kcal', label: 'Kcal', color: 'var(--ink-contrast)', data: macros.kcal, unit: '' },
    { key: 'prot', label: 'Prot.', color: 'var(--sage)', data: macros.prot, unit: 'g' },
    { key: 'carb', label: 'Carb.', color: 'var(--amber)', data: macros.carb, unit: 'g' },
    { key: 'fat', label: 'Gord.', color: 'var(--sky)', data: macros.fat, unit: 'g' },
  ];

  return (
    <div
      className={className}
      style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}
    >
      {items.map((it) => {
        const pct = it.data.target > 0 ? it.data.actual / it.data.target : 0;
        return (
          <div
            key={it.key}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          >
            <Ring
              size={size}
              stroke={5}
              value={pct}
              color={it.color}
              label={`${Math.round(pct * 100)}%`}
            />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{it.label}</div>
              <div className="mono tnum" style={{ fontSize: 11.5 }}>
                {it.data.actual}
                {it.unit || ''} / {it.data.target > 0 ? `${it.data.target}${it.unit || ''}` : '—'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
