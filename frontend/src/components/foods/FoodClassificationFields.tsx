import type { FoodCategoryKey, FoodUnit } from '../../types/food';
import {
  FOOD_CATEGORIES,
  FOOD_CATEGORY_LABELS,
  FOOD_UNIT_KEYS,
  FOOD_UNIT_LABELS,
} from '../../types/food';
import { sanitizeNumberInput } from '../../utils/numberInput';
import { foodFieldStyle } from './foodValidation';

export interface FoodClassificationFieldsProps {
  idPrefix: string;
  category: FoodCategoryKey;
  onCategoryChange: (c: FoodCategoryKey) => void;
  unit: FoodUnit;
  onUnitChange: (u: FoodUnit) => void;
  referenceAmount: string;
  onReferenceAmountChange: (val: string) => void;
  onReferenceAmountBlur: () => void;
  error?: string;
  refLabel: string;
}

export function FoodClassificationFields({
  idPrefix,
  category,
  onCategoryChange,
  unit,
  onUnitChange,
  referenceAmount,
  onReferenceAmountChange,
  onReferenceAmountBlur,
  error,
  refLabel,
}: FoodClassificationFieldsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label className="eyebrow" htmlFor={`${idPrefix}-category`}>
          Categoria
        </label>
        <select
          id={`${idPrefix}-category`}
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as FoodCategoryKey)}
          style={{
            padding: '8px 10px',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: 13,
            background: 'var(--surface)',
            color: 'var(--fg)',
            width: '100%',
          }}
        >
          {FOOD_CATEGORIES.filter((c) => c !== 'Todos').map((c) => (
            <option key={c} value={c}>
              {FOOD_CATEGORY_LABELS[c as FoodCategoryKey]}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label className="eyebrow" htmlFor={`${idPrefix}-unit`}>
          Unidade
        </label>
        <select
          id={`${idPrefix}-unit`}
          value={unit}
          onChange={(e) => onUnitChange(e.target.value as FoodUnit)}
          style={{
            padding: '8px 10px',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: 13,
            background: 'var(--surface)',
            color: 'var(--fg)',
            width: '100%',
          }}
        >
          {FOOD_UNIT_KEYS.map((u) => (
            <option key={u} value={u}>
              {FOOD_UNIT_LABELS[u]}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label className="eyebrow" htmlFor={`${idPrefix}-ref`}>
          Referência ({refLabel})
        </label>
        <input
          id={`${idPrefix}-ref`}
          value={referenceAmount}
          onChange={(e) => onReferenceAmountChange(sanitizeNumberInput(e.target.value))}
          onBlur={onReferenceAmountBlur}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${idPrefix}-ref-error` : undefined}
          inputMode="decimal"
          style={foodFieldStyle(!!error, true)}
        />
        {error && (
          <p id={`${idPrefix}-ref-error`} className="text-xs text-coral" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
