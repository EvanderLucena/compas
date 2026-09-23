import { STATUS_LABELS, STATUS_COLORS } from '../../types/patient';
import type { PatientStatus } from '../../types/patient';

interface PatientsFilterBarProps {
  statusFilter: string;
  activeFilters: number;
  onSelectFilter: (status: 'all' | PatientStatus) => void;
  onClearFilters: () => void;
}

export function PatientsFilterBar({
  statusFilter,
  activeFilters,
  onSelectFilter,
  onClearFilters,
}: PatientsFilterBarProps) {
  const filterOptions = ['all', 'ontrack', 'warning', 'danger'] as const;

  return (
    <div
      style={{
        display: 'flex',
        gap: 20,
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        padding: '16px 18px',
        marginBottom: 20,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="eyebrow">Status</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {filterOptions.map((key) => {
            const label = key === 'all' ? 'Todos' : STATUS_LABELS[key];
            const color = key === 'all' ? undefined : STATUS_COLORS[key];
            const isSelected = statusFilter === key;

            return (
              <button
                key={key}
                onClick={() => onSelectFilter(key)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 5,
                  fontSize: 12,
                  border: isSelected ? '1px solid var(--fg)' : '1px solid var(--border)',
                  background: isSelected ? 'var(--surface-2)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                {color && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                )}{' '}
                {label}
              </button>
            );
          })}
        </div>
      </div>
      {activeFilters > 0 && (
        <button
          onClick={onClearFilters}
          style={{
            fontSize: 12,
            color: 'var(--fg-muted)',
            padding: '5px 0',
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ✕ Limpar filtros
        </button>
      )}
    </div>
  );
}
