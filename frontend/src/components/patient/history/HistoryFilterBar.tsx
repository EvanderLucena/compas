import type { TimelineCategory } from '../../../types/timeline';
import { IconSearch, IconPlus } from '../../icons';

interface HistoryFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: TimelineCategory;
  onSelectCategory: (category: TimelineCategory) => void;
  counts: Record<TimelineCategory, number>;
  onOpenAddNote: () => void;
}

const CATEGORIES: { key: TimelineCategory; label: string }[] = [
  { key: 'ALL', label: 'Todos' },
  { key: 'CONSULTATION', label: 'Consultas' },
  { key: 'PLAN', label: 'Planos' },
  { key: 'BIOMETRY', label: 'Biometria' },
  { key: 'MEAL', label: 'WhatsApp / Refeições' },
  { key: 'PRESCRIPTION', label: 'Prescrições' },
  { key: 'GOAL', label: 'Metas' },
  { key: 'NOTE', label: 'Anotações' },
];

function CategoryPills({
  selectedCategory,
  onSelectCategory,
  counts,
}: {
  selectedCategory: TimelineCategory;
  onSelectCategory: (category: TimelineCategory) => void;
  counts: Record<TimelineCategory, number>;
}) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingBottom: 4 }}
    >
      {CATEGORIES.map((cat) => {
        const count = counts[cat.key] ?? 0;
        const isSelected = selectedCategory === cat.key;
        if (cat.key !== 'ALL' && count === 0) return null;

        return (
          <button
            key={cat.key}
            type="button"
            onClick={() => onSelectCategory(cat.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: isSelected ? 600 : 400,
              border: isSelected ? '1px solid var(--fg)' : '1px solid var(--border)',
              backgroundColor: isSelected ? 'var(--fg)' : 'var(--surface, #ffffff)',
              color: isSelected ? 'var(--paper, #ffffff)' : 'var(--fg-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{cat.label}</span>
            <span
              className="mono tnum"
              style={{
                fontSize: 10.5,
                padding: '1px 5px',
                borderRadius: 10,
                backgroundColor: isSelected
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'var(--surface-2, rgba(0, 0, 0, 0.05))',
                color: isSelected ? '#ffffff' : 'var(--fg-subtle)',
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function HistoryFilterBar({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  counts,
  onOpenAddNote,
}: HistoryFilterBarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 420 }}>
          <div
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--fg-subtle)',
              pointerEvents: 'none',
              display: 'flex',
            }}
          >
            <IconSearch size={14} />
          </div>
          <input
            type="text"
            className="input"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por termo no histórico..."
            style={{ paddingLeft: 32, fontSize: 13, height: 36, width: '100%' }}
          />
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={onOpenAddNote}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12.5,
            height: 36,
            padding: '0 14px',
          }}
        >
          <IconPlus size={14} />
          Nova Anotação
        </button>
      </div>

      <CategoryPills
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        counts={counts}
      />
    </div>
  );
}
