import { useState, useMemo } from 'react';
import { IconX } from '../icons';
import type { MealSlot } from '../../types/plan';

interface MealSlotRowProps {
  meal: MealSlot;
  isActive: boolean;
  canRemove: boolean;
  isReadOnly: boolean;
  onSelect: () => void;
  onRename: (label: string) => void;
  onRemove: () => void;
  onReadOnlyClick: () => void;
}

function calculateMealTotals(options: MealSlot['options']) {
  return options.reduce(
    (a, opt) => {
      const optT = opt.items.reduce(
        (s, x) => ({
          kcal: s.kcal + (Number(x.kcal) || 0),
          prot: s.prot + (Number(x.prot) || 0),
          carb: s.carb + (Number(x.carb) || 0),
          fat: s.fat + (Number(x.fat) || 0),
          fiber: s.fiber + (Number(x.fiber) || 0),
        }),
        { kcal: 0, prot: 0, carb: 0, fat: 0, fiber: 0 },
      );
      return {
        kcal: a.kcal + optT.kcal,
        prot: a.prot + optT.prot,
        carb: a.carb + optT.carb,
        fat: a.fat + optT.fat,
        fiber: a.fiber + optT.fiber,
      };
    },
    { kcal: 0, prot: 0, carb: 0, fat: 0, fiber: 0 },
  );
}

interface MealSlotLabelEditorProps {
  value: string;
  isActive: boolean;
  onChange: (val: string) => void;
  onFinish: () => void;
  onCancel: () => void;
}

function MealSlotLabelEditor({
  value,
  isActive,
  onChange,
  onFinish,
  onCancel,
}: MealSlotLabelEditorProps) {
  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onFinish}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onFinish();
        else if (e.key === 'Escape') onCancel();
        e.stopPropagation();
      }}
      onClick={(e) => e.stopPropagation()}
      style={{
        fontSize: 13,
        fontWeight: isActive ? 600 : 500,
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid var(--fg)',
        outline: 'none',
        color: 'var(--fg)',
        width: 120,
        padding: '0 0 1px',
        fontFamily: 'var(--font-ui)',
      }}
    />
  );
}

export function MealSlotRow({
  meal,
  isActive,
  canRemove,
  isReadOnly,
  onSelect,
  onRename,
  onRemove,
  onReadOnlyClick,
}: MealSlotRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [labelValue, setLabelValue] = useState('');

  const totals = useMemo(() => calculateMealTotals(meal.options), [meal.options]);

  const handleFinishEditing = () => {
    if (labelValue.trim() && labelValue.trim() !== meal.label) {
      onRename(labelValue.trim());
    }
    setIsEditing(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReadOnly) {
      onReadOnlyClick();
      return;
    }
    setIsEditing(true);
    setLabelValue(meal.label);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
        style={{
          padding: '12px 14px',
          borderRadius: 6,
          border: isActive ? '1px solid var(--fg)' : '1px solid transparent',
          background: isActive ? 'var(--surface)' : 'transparent',
          textAlign: 'left',
          transition: 'all 0.12s',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          {isEditing ? (
            <MealSlotLabelEditor
              value={labelValue}
              isActive={isActive}
              onChange={setLabelValue}
              onFinish={handleFinishEditing}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <span
              style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, cursor: 'text' }}
              onDoubleClick={handleDoubleClick}
              title="Duplo clique para renomear"
            >
              {meal.label}
            </span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="mono tnum" style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
              {meal.time}
            </span>
            {canRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isReadOnly) {
                    onReadOnlyClick();
                    return;
                  }
                  onRemove();
                }}
                style={{
                  color: 'var(--fg-subtle)',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  lineHeight: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--coral)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fg-subtle)')}
              >
                <IconX size={12} />
              </button>
            )}
          </div>
        </div>
        <div
          style={{ display: 'flex', gap: 10, fontSize: 10.5, color: 'var(--fg-muted)' }}
          className="mono tnum"
        >
          <span>{totals.kcal || 0}kcal</span>
          <span>P{totals.prot || 0}</span>
          <span>C{totals.carb || 0}</span>
          <span>G{totals.fat || 0}</span>
        </div>
      </div>
    </div>
  );
}
