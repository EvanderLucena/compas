import { useState } from 'react';
import type { MealFood } from '../../types/plan';
import { FOOD_UNIT_SYMBOLS } from '../../types/food';
import { EditableCell, RefInput } from './PlanFoodInputCells';

interface PlanFoodRowProps {
  item: MealFood;
  isLast: boolean;
  isReadOnly?: boolean;
  onReadOnlyClick?: () => void;
  onReferenceAmountChange: (referenceAmount: number) => void;
  onPrepChange: (prep: string) => void;
  onRemove: () => void;
  onSubstitute?: () => void;
}

function MacroReadonly({
  value,
  color,
  opacity,
}: {
  value: string;
  color: string;
  opacity: number;
}) {
  return (
    <input
      readOnly
      value={value}
      style={{
        padding: '5px 7px',
        border: '1px solid transparent',
        borderRadius: 5,
        fontSize: 12.5,
        background: 'var(--surface-2)',
        outline: 'none',
        color,
        width: '100%',
        fontFamily: 'var(--font-mono)',
        textAlign: 'right',
        opacity,
        transition: 'opacity 0.2s',
      }}
    />
  );
}

function RemoveButton({ onRemove }: { onRemove: () => void }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center' }}>
      <button
        data-testid="plan-food-remove-btn"
        onClick={onRemove}
        title="Remover"
        style={{
          color: 'var(--fg-subtle)',
          display: 'grid',
          placeItems: 'center',
          width: 22,
          height: 22,
          borderRadius: 4,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--coral)';
          e.currentTarget.style.background = 'var(--coral-dim)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--fg-subtle)';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <span style={{ fontSize: 13, lineHeight: 1 }}>×</span>
      </button>
    </div>
  );
}

function SubstituteButton({ onSubstitute }: { onSubstitute: () => void }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center' }}>
      <button
        type="button"
        data-testid="plan-food-substitute-btn"
        onClick={onSubstitute}
        title="Substituições inteligentes TACO"
        style={{
          color: 'var(--fg-subtle)',
          display: 'grid',
          placeItems: 'center',
          width: 22,
          height: 22,
          borderRadius: 4,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: 12,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--lime-dark, #047857)';
          e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--fg-subtle)';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        🔄
      </button>
    </div>
  );
}

function PlanFoodRowGrid({ children, isLast }: { children: React.ReactNode; isLast: boolean }) {
  return (
    <div
      className="plans-food-row"
      style={{
        display: 'grid',
        gridTemplateColumns: '2.2fr 0.8fr 0.6fr 1.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 52px',
        gap: 10,
        padding: '8px 16px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        alignItems: 'center',
        background: 'var(--surface)',
      }}
    >
      {children}
    </div>
  );
}

function FoodNameCell({ name }: { name: string }) {
  return (
    <div
      title={name}
      style={{
        padding: '5px 7px',
        fontSize: 12.5,
        color: 'var(--fg)',
        background: 'var(--surface-2)',
        borderRadius: 5,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {name}
    </div>
  );
}

function UnitSymbol({ unitSymbol }: { unitSymbol: string }) {
  return (
    <div
      className="mono"
      style={{
        padding: '5px 7px',
        fontSize: 11,
        color: 'var(--fg-muted)',
        background: 'var(--surface-2)',
        borderRadius: 5,
        textAlign: 'center',
      }}
    >
      {unitSymbol}
    </div>
  );
}

function MacroCells({ item, opacity }: { item: MealFood; opacity: number }) {
  return (
    <>
      <MacroReadonly value={String(item.kcal)} color="var(--fg)" opacity={opacity} />
      <MacroReadonly value={String(item.prot)} color="var(--sage-dim)" opacity={opacity} />
      <MacroReadonly value={String(item.carb)} color="var(--carb)" opacity={opacity} />
      <MacroReadonly value={String(item.fat)} color="var(--sky)" opacity={opacity} />
      <MacroReadonly value={String(item.fiber ?? 0)} color="var(--lime-dim)" opacity={opacity} />
    </>
  );
}

export function PlanFoodRow({
  item,
  isLast,
  isReadOnly,
  onReadOnlyClick,
  onReferenceAmountChange,
  onPrepChange,
  onRemove,
  onSubstitute,
}: PlanFoodRowProps) {
  const [macroFlash, setMacroFlash] = useState(false);
  const unitSymbol = FOOD_UNIT_SYMBOLS[item.unit as keyof typeof FOOD_UNIT_SYMBOLS] || 'g';

  const handleRefBlur = (newRef: number) => {
    if (isReadOnly) {
      onReadOnlyClick?.();
      return;
    }
    if (newRef !== item.referenceAmount) {
      setMacroFlash(true);
      onReferenceAmountChange(newRef);
      setTimeout(() => setMacroFlash(false), 200);
    }
  };

  const handlePrepChange = (prep: string) => {
    if (isReadOnly) {
      onReadOnlyClick?.();
      return;
    }
    onPrepChange(prep);
  };

  const handleRemove = () => {
    if (isReadOnly) {
      onReadOnlyClick?.();
      return;
    }
    onRemove();
  };

  const handleSubstitute = () => {
    if (isReadOnly) {
      onReadOnlyClick?.();
      return;
    }
    onSubstitute?.();
  };

  return (
    <PlanFoodRowGrid isLast={isLast}>
      <FoodNameCell name={item.foodName} />
      <RefInput
        value={item.referenceAmount}
        onBlur={handleRefBlur}
        testId="plan-food-ref-input"
        isReadOnly={isReadOnly}
        onReadOnlyClick={onReadOnlyClick}
      />
      <UnitSymbol unitSymbol={unitSymbol} />
      <EditableCell
        value={item.prep ?? ''}
        color="var(--fg-muted)"
        isNum={false}
        testId="plan-food-prep-input"
        onChange={handlePrepChange}
        isReadOnly={isReadOnly}
        onReadOnlyClick={onReadOnlyClick}
      />
      <MacroCells item={item} opacity={macroFlash ? 0.5 : 1} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
        {onSubstitute && <SubstituteButton onSubstitute={handleSubstitute} />}
        <RemoveButton onRemove={handleRemove} />
      </div>
    </PlanFoodRowGrid>
  );
}
