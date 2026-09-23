import { IconPlus } from '../icons';
import { MealSlotRow } from './MealSlotRow';
import type { MealSlot } from '../../types/plan';

interface PlanMealSidebarProps {
  meals: MealSlot[];
  activeMealId: string | null;
  isReadOnly: boolean;
  onSelectMeal: (mealId: string) => void;
  onRenameMeal: (mealId: string, label: string) => void;
  onRemoveMeal: (mealId: string) => void;
  onAddMealClick: () => void;
  onReadOnlyClick: () => void;
}

export function PlanMealSidebar({
  meals,
  activeMealId,
  isReadOnly,
  onSelectMeal,
  onRenameMeal,
  onRemoveMeal,
  onAddMealClick,
  onReadOnlyClick,
}: PlanMealSidebarProps) {
  const canRemove = meals.length > 1;

  const handleAddClick = () => {
    if (isReadOnly) {
      onReadOnlyClick();
      return;
    }
    onAddMealClick();
  };

  return (
    <div style={{ borderRight: '1px solid var(--border)', padding: '16px 14px' }}>
      <div className="eyebrow" style={{ padding: '0 6px 10px' }}>
        ESTRUTURA DO DIA
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {meals.map((m) => (
          <MealSlotRow
            key={m.id}
            meal={m}
            isActive={activeMealId === m.id}
            canRemove={canRemove}
            isReadOnly={isReadOnly}
            onSelect={() => onSelectMeal(m.id)}
            onRename={(label) => onRenameMeal(m.id, label)}
            onRemove={() => onRemoveMeal(m.id)}
            onReadOnlyClick={onReadOnlyClick}
          />
        ))}
        <button
          data-testid="add-meal-btn"
          onClick={handleAddClick}
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            border: '1px dashed var(--border-2)',
            color: 'var(--fg-muted)',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 13,
            marginTop: 4,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <IconPlus size={13} /> Adicionar refeição
        </button>
      </div>
    </div>
  );
}
