import type { FoodCategoryKey, FoodUnit } from '../../types/food';
import { FOOD_CATEGORY_LABELS, FOOD_UNIT_LABELS } from '../../types/food';
import { parseNumberInput } from '../../utils/numberInput';
import { foodFieldStyle } from './foodValidation';
import type { FoodSuggestionData } from './foodValidation';
import { FoodClassificationFields } from './FoodClassificationFields';
import { FoodMacroInputs } from './FoodMacroInputs';
import { FoodErrorBanner } from './FoodErrorBanner';

interface FoodNameFieldProps {
  idPrefix: string;
  nameTestId?: string;
  namePlaceholder?: string;
  name: string;
  error?: string;
  isPortionPresent: boolean;
  onNameChange: (val: string) => void;
  onNameBlur: () => void;
  suggestion?: FoodSuggestionData | null;
  onApplySuggestion?: () => void;
}

function FoodNameField({
  idPrefix,
  nameTestId,
  namePlaceholder,
  name,
  error,
  isPortionPresent,
  onNameChange,
  onNameBlur,
  suggestion,
  onApplySuggestion,
}: FoodNameFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label className="eyebrow" htmlFor={`${idPrefix}-name`}>
        Nome {isPortionPresent ? 'do alimento' : ''}
      </label>
      <input
        data-testid={nameTestId}
        id={`${idPrefix}-name`}
        placeholder={namePlaceholder}
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onBlur={onNameBlur}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${idPrefix}-name-error` : undefined}
        style={foodFieldStyle(Boolean(error))}
      />
      {error && (
        <p id={`${idPrefix}-name-error`} className="text-xs text-coral" role="alert">
          {error}
        </p>
      )}
      {suggestion && onApplySuggestion && (
        <div
          data-testid="food-suggestion-pill"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: 'var(--fg-muted)',
            background: 'var(--surface-2)',
            padding: '6px 10px',
            borderRadius: 6,
            cursor: 'pointer',
            border: '1px solid var(--border)',
          }}
          onClick={onApplySuggestion}
        >
          <span>💡 Sugestão automática:</span>
          <strong style={{ color: 'var(--fg)' }}>
            {FOOD_CATEGORY_LABELS[suggestion.category]} • {FOOD_UNIT_LABELS[suggestion.unit]}
          </strong>
          <span style={{ color: 'var(--lime)', marginLeft: 'auto', fontWeight: 600 }}>Aplicar</span>
        </div>
      )}
    </div>
  );
}

interface FoodFormFieldsProps {
  idPrefix: string;
  nameTestId?: string;
  namePlaceholder?: string;
  submitError: string | null;
  form: Record<string, string>;
  errors: Record<string, string | undefined>;
  category: FoodCategoryKey;
  onCategoryChange: (c: FoodCategoryKey) => void;
  unit: FoodUnit;
  onUnitChange: (u: FoodUnit) => void;
  prep: string;
  onPrepChange: (p: string) => void;
  portionLabel?: string;
  onPortionLabelChange?: (p: string) => void;
  onFieldChange: (key: string, val: string) => void;
  onFieldBlur: (key: string) => void;
  unitSymbol: string;
  refLabel: string;
  suggestion?: FoodSuggestionData | null;
  onApplySuggestion?: () => void;
}

export function FoodFormFields({
  idPrefix,
  nameTestId,
  namePlaceholder,
  submitError,
  form,
  errors,
  category,
  onCategoryChange,
  unit,
  onUnitChange,
  prep,
  onPrepChange,
  portionLabel,
  onPortionLabelChange,
  onFieldChange,
  onFieldBlur,
  unitSymbol,
  refLabel,
  suggestion,
  onApplySuggestion,
}: FoodFormFieldsProps) {
  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <FoodErrorBanner error={submitError} />

      <FoodNameField
        idPrefix={idPrefix}
        nameTestId={nameTestId}
        namePlaceholder={namePlaceholder}
        name={form.name}
        error={errors.name}
        isPortionPresent={portionLabel !== undefined}
        onNameChange={(val) => onFieldChange('name', val)}
        onNameBlur={() => onFieldBlur('name')}
        suggestion={suggestion}
        onApplySuggestion={onApplySuggestion}
      />

      <FoodClassificationFields
        idPrefix={idPrefix}
        category={category}
        onCategoryChange={onCategoryChange}
        unit={unit}
        onUnitChange={onUnitChange}
        referenceAmount={form.referenceAmount}
        onReferenceAmountChange={(val) => onFieldChange('referenceAmount', val)}
        onReferenceAmountBlur={() => {
          const parsed = parseNumberInput(form.referenceAmount);
          if (parsed != null && !Number.isNaN(parsed)) {
            onFieldChange('referenceAmount', String(parsed));
          }
          onFieldBlur('referenceAmount');
        }}
        error={errors.referenceAmount}
        refLabel={refLabel}
      />

      <div className="divider">
        <span>
          Valores por {form.referenceAmount || '?'}
          {unitSymbol}
        </span>
      </div>

      <FoodMacroInputs
        idPrefix={idPrefix}
        values={form}
        errors={errors}
        onChange={onFieldChange}
        onBlur={onFieldBlur}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label className="eyebrow" htmlFor={`${idPrefix}-prep`}>
          Preparo sugerido
        </label>
        <input
          id={`${idPrefix}-prep`}
          value={prep}
          onChange={(e) => onPrepChange(e.target.value)}
          placeholder="ex: grelhado, cozido no vapor"
          style={foodFieldStyle(false)}
        />
      </div>

      {portionLabel !== undefined && onPortionLabelChange && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label className="eyebrow" htmlFor={`${idPrefix}-portion`}>
            Descrição da porção
          </label>
          <input
            id={`${idPrefix}-portion`}
            value={portionLabel}
            onChange={(e) => onPortionLabelChange(e.target.value)}
            placeholder="ex: 1 unidade · 100g"
            style={foodFieldStyle(false)}
          />
        </div>
      )}
    </div>
  );
}
