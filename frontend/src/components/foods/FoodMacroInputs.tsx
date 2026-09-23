import { sanitizeNumberInput, parseNumberInput } from '../../utils/numberInput';
import { foodFieldStyle } from './foodValidation';

const MACRO_CONFIG = [
  { key: 'kcal', label: 'Kcal' },
  { key: 'prot', label: 'Prot (g)' },
  { key: 'carb', label: 'Carb (g)' },
  { key: 'fat', label: 'Gord (g)' },
  { key: 'fiber', label: 'Fibra (g)' },
] as const;

interface FoodMacroInputsProps {
  idPrefix: string;
  values: Record<string, string>;
  errors: Record<string, string | undefined>;
  onChange: (key: string, value: string) => void;
  onBlur: (key: string) => void;
}

export function FoodMacroInputs({
  idPrefix,
  values,
  errors,
  onChange,
  onBlur,
}: FoodMacroInputsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
      {MACRO_CONFIG.map(({ key, label }) => {
        const error = errors[key];
        const inputId = `${idPrefix}-${key}`;
        const errorId = `${inputId}-error`;

        return (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="eyebrow" htmlFor={inputId}>
              {label}
            </label>
            <input
              id={inputId}
              value={values[key] ?? ''}
              onChange={(e) => onChange(key, sanitizeNumberInput(e.target.value))}
              onBlur={() => {
                const parsed = parseNumberInput(values[key] ?? '');
                if (parsed != null && !Number.isNaN(parsed)) {
                  onChange(key, String(parsed));
                }
                onBlur(key);
              }}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? errorId : undefined}
              inputMode="decimal"
              style={foodFieldStyle(!!error, true)}
            />
            {error && (
              <p id={errorId} className="text-xs text-coral" role="alert">
                {error}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
