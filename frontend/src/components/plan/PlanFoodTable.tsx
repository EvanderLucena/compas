import { IconPlus } from '../icons';
import { PlanFoodRow } from './PlanFoodRow';
import type { MealFood } from '../../types/plan';

interface PlanFoodTableProps {
  items: MealFood[];
  isReadOnly: boolean;
  onReferenceAmountChange: (itemId: string, amount: number) => void;
  onPrepChange: (itemId: string, prep: string) => void;
  onRemoveItem: (item: MealFood) => void;
  onAddFoodClick: () => void;
  onReadOnlyClick: () => void;
}

const TABLE_HEADERS = [
  'Alimento',
  'Quantidade',
  'Unidade',
  'Preparo',
  'Kcal',
  'Prot',
  'Carb',
  'Gord',
  'Fibra',
  '',
];

export function PlanFoodTable({
  items,
  isReadOnly,
  onReferenceAmountChange,
  onPrepChange,
  onRemoveItem,
  onAddFoodClick,
  onReadOnlyClick,
}: PlanFoodTableProps) {
  const handleAddClick = () => {
    if (isReadOnly) {
      onReadOnlyClick();
      return;
    }
    onAddFoodClick();
  };

  return (
    <div className="card">
      <div
        className="plans-food-table"
        style={{
          display: 'grid',
          gridTemplateColumns: '2.2fr 0.8fr 0.6fr 1.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 28px',
          gap: 10,
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {TABLE_HEADERS.map((h, i) => (
          <div
            key={i}
            className="eyebrow"
            style={{
              fontSize: 10,
              textAlign: i >= 4 && i <= 8 ? 'right' : i === 1 || i === 2 ? 'center' : 'left',
            }}
          >
            {h}
          </div>
        ))}
      </div>
      {items.map((it) => (
        <PlanFoodRow
          key={it.id}
          item={it}
          isLast={it.id === items[items.length - 1]?.id}
          onReferenceAmountChange={(referenceAmount) =>
            onReferenceAmountChange(it.id, referenceAmount)
          }
          onPrepChange={(prep) => onPrepChange(it.id, prep)}
          onRemove={() => {
            if (isReadOnly) {
              onReadOnlyClick();
              return;
            }
            onRemoveItem(it);
          }}
        />
      ))}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface-2)',
          display: 'flex',
          gap: 16,
        }}
      >
        <button onClick={handleAddClick} style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
          <IconPlus size={12} style={{ verticalAlign: '-2px' }} /> Adicionar Alimento
        </button>
      </div>
    </div>
  );
}
