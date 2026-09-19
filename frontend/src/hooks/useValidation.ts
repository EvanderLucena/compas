import { useState, useCallback, type ChangeEvent } from 'react';
import { parseNumberInput } from '../utils/numberInput';

export type ValidationRule = {
  required?: boolean;
  requiredMessage?: string;
  min?: number;
  minMessage?: string;
  max?: number;
  maxMessage?: string;
  minLength?: number;
  minLengthMessage?: string;
  maxLength?: number;
  maxLengthMessage?: string;
  pattern?: RegExp;
  patternMessage?: string;
  custom?: (value: string) => string | undefined;
};

export type FieldRules = Record<string, ValidationRule>;

function validateField(value: string, rules: ValidationRule): string | undefined {
  const trimmedValue = value.trim();

  if (rules.required && !trimmedValue) {
    return rules.requiredMessage || 'Campo obrigatório.';
  }
  if (!trimmedValue && !rules.required) return undefined;

  const hasNumericBounds = rules.min !== undefined || rules.max !== undefined;
  const parsedNumber = hasNumericBounds ? parseNumberInput(trimmedValue) : undefined;
  if (hasNumericBounds && !Number.isFinite(parsedNumber)) {
    return 'Valor numérico inválido.';
  }

  if (rules.minLength && trimmedValue.length < rules.minLength) {
    return rules.minLengthMessage || `Mínimo de ${rules.minLength} caracteres.`;
  }
  if (rules.maxLength && trimmedValue.length > rules.maxLength) {
    return rules.maxLengthMessage || `Máximo de ${rules.maxLength} caracteres.`;
  }
  if (rules.min !== undefined) {
    if ((parsedNumber as number) < rules.min) {
      return rules.minMessage || `Valor mínimo: ${rules.min}.`;
    }
  }
  if (rules.max !== undefined) {
    if ((parsedNumber as number) > rules.max) {
      return rules.maxMessage || `Valor máximo: ${rules.max}.`;
    }
  }
  if (rules.pattern && !rules.pattern.test(trimmedValue)) {
    return rules.patternMessage || 'Formato inválido.';
  }
  if (rules.custom) {
    return rules.custom(value);
  }
  return undefined;
}

export function useValidation<T extends Record<string, string>>(
  initialValues: T,
  rules: FieldRules,
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const set = useCallback(
    (field: string, value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }) as T);
      if (touched[field]) {
        const fieldRules = rules[field];
        if (fieldRules) {
          const error = validateField(value, fieldRules);
          setErrors((prev) => {
            const next = { ...prev };
            if (error) {
              next[field] = error;
            } else {
              delete next[field];
            }
            return next;
          });
        }
      }
    },
    [rules, touched],
  );

  const setField = useCallback(
    (field: string, value: string) => {
      set(field, value);
    },
    [set],
  );

  const handleInputChange = useCallback(
    (field: string) =>
      (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        set(field, e.target.value);
      },
    [set],
  );

  const onBlur = useCallback(
    (field: string) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const fieldRules = rules[field];
      const value = values[field] ?? '';
      if (fieldRules) {
        const error = validateField(value, fieldRules);
        setErrors((prev) => {
          const next = { ...prev };
          if (error) {
            next[field] = error;
          } else {
            delete next[field];
          }
          return next;
        });
      }
    },
    [rules, values],
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};
    let valid = true;

    for (const field of Object.keys(rules)) {
      newTouched[field] = true;
      const value = values[field] ?? '';
      const error = validateField(value, rules[field]);
      if (error) {
        newErrors[field] = error;
        valid = false;
      }
    }

    setErrors(newErrors);
    setTouched((prev) => ({ ...prev, ...newTouched }));
    return valid;
  }, [rules, values]);

  const reset = useCallback((newValues?: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...newValues }) as T);
    setErrors({});
    setTouched({});
  }, []);

  const getFieldProps = useCallback(
    (field: string) => ({
      value: values[field] ?? '',
      onChange: handleInputChange(field),
      onBlur: onBlur(field),
      'aria-invalid': errors[field] ? ('true' as const) : undefined,
      'aria-describedby': errors[field] ? `${field}-error` : undefined,
    }),
    [values, handleInputChange, onBlur, errors],
  );

  const getErrorProps = useCallback(
    (field: string) => ({
      id: `${field}-error`,
      role: 'alert' as const,
    }),
    [],
  );

  const hasErrors = Object.keys(errors).length > 0;
  const canSubmit = !Object.keys(rules).some(
    (field) => rules[field]?.required && !(values[field] ?? '').trim(),
  );

  return {
    values,
    errors,
    touched,
    set: setField,
    handleInputChange,
    onBlur,
    validateAll,
    reset,
    getFieldProps,
    getErrorProps,
    hasErrors,
    canSubmit,
  };
}
