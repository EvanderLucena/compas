import { useMemo } from 'react';
import { IconPlus } from '../icons';
import { OptionTab } from './OptionTab';
import { PlanFoodTable } from './PlanFoodTable';
import { PlanOptionTotals } from './PlanOptionTotals';
import type { MealSlot, MealOption, MealFood } from '../../types/plan';

interface PlanActiveMealContentProps {
  activeMeal: MealSlot;
  activeOpt: MealOption;
  activeOptionIndex: number;
  kcalTarget: number;
  protTarget: number;
  carbTarget: number;
  fatTarget: number;
  isReadOnly: boolean;
  onSelectOption: (index: number) => void;
  onAddOption: () => void;
  onReferenceAmountChange: (itemId: string, amount: number) => void;
  onPrepChange: (itemId: string, prep: string) => void;
  onRemoveItem: (item: MealFood) => void;
  onAddFoodClick: () => void;
  onReadOnlyClick: () => void;
}

export function PlanActiveMealContent({
  activeMeal,
  activeOpt,
  activeOptionIndex,
  kcalTarget,
  protTarget,
  carbTarget,
  fatTarget,
  isReadOnly,
  onSelectOption,
  onAddOption,
  onReferenceAmountChange,
  onPrepChange,
  onRemoveItem,
  onAddFoodClick,
  onReadOnlyClick,
}: PlanActiveMealContentProps) {
  const optTotals = useMemo(() => {
    return activeOpt.items.reduce(
      (a, x) => ({
        kcal: a.kcal + (Number(x.kcal) || 0),
        prot: a.prot + (Number(x.prot) || 0),
        carb: a.carb + (Number(x.carb) || 0),
        fat: a.fat + (Number(x.fat) || 0),
        fiber: a.fiber + (Number(x.fiber) || 0),
      }),
      { kcal: 0, prot: 0, carb: 0, fat: 0, fiber: 0 },
    );
  }, [activeOpt.items]);

  const handleAddOptionClick = () => {
    if (isReadOnly) {
      onReadOnlyClick();
      return;
    }
    onAddOption();
  };

  return (
    <div style={{ padding: '20px 24px', background: 'var(--bg)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <div>
          <div className="eyebrow">
            EDITANDO · {activeMeal.label.toUpperCase()} · {activeMeal.time}
          </div>
          <h2
            className="serif"
            style={{
              fontSize: 26,
              margin: '4px 0 0',
              fontWeight: 400,
              letterSpacing: '-0.02em',
            }}
          >
            {activeMeal.options.length} opções equivalentes
          </h2>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {activeMeal.options.map((o, i) => (
          <OptionTab
            key={o.id}
            name={o.name}
            active={activeOptionIndex === i}
            onClick={() => onSelectOption(i)}
            onRename={(_name) => {
              // Double-click rename → update via API
            }}
            onRemove={
              activeMeal.options.length > 1
                ? () => {
                    // Will be wired to useDeleteOption
                  }
                : null
            }
          />
        ))}
        <button
          onClick={handleAddOptionClick}
          style={{
            padding: '7px 12px',
            borderRadius: 6,
            border: '1px dashed var(--border-2)',
            background: 'transparent',
            color: 'var(--fg-muted)',
            fontSize: 12.5,
          }}
        >
          <IconPlus size={12} style={{ verticalAlign: '-2px' }} /> Nova opção
        </button>
      </div>

      <PlanFoodTable
        items={activeOpt.items}
        isReadOnly={isReadOnly}
        onReferenceAmountChange={onReferenceAmountChange}
        onPrepChange={onPrepChange}
        onRemoveItem={onRemoveItem}
        onAddFoodClick={onAddFoodClick}
        onReadOnlyClick={onReadOnlyClick}
      />

      <PlanOptionTotals
        optionName={activeOpt.name}
        totals={optTotals}
        kcalTarget={kcalTarget}
        protTarget={protTarget}
        carbTarget={carbTarget}
        fatTarget={fatTarget}
      />
    </div>
  );
}
