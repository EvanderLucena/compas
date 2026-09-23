import type React from 'react';
import { useState, useEffect } from 'react';
import { parseNumberInput } from '../../utils/numberInput';
import { suggestFood } from '../../api/foods';
import type { FoodCategoryKey, FoodUnit } from '../../types/food';

export interface FoodSuggestionData {
  category: FoodCategoryKey;
  unit: FoodUnit;
  referenceAmount: number;
}

function macroRule(requiredMessage: string) {
  return {
    required: true,
    requiredMessage,
    min: 0,
    minMessage: 'Valor não pode ser negativo.',
    custom: (v: string) => {
      const n = parseNumberInput(v);
      if (n == null || !Number.isFinite(n)) return 'Valor numérico inválido.';
      if (n < 0) return 'Valor não pode ser negativo.';
      return undefined;
    },
  };
}

export const FOOD_FORM_RULES = {
  name: {
    required: true,
    requiredMessage: 'Nome do alimento é obrigatório.',
    minLength: 2,
    minLengthMessage: 'Nome deve ter pelo menos 2 caracteres.',
  },
  referenceAmount: {
    required: true,
    requiredMessage: 'Quantidade de referência é obrigatória.',
    custom: (v: string) => {
      const n = parseNumberInput(v);
      if (!n || n <= 0) return 'Referência deve ser maior que zero.';
      return undefined;
    },
  },
  kcal: macroRule('Calorias são obrigatórias.'),
  prot: macroRule('Proteína é obrigatória.'),
  carb: macroRule('Carboidrato é obrigatório.'),
  fat: macroRule('Gordura é obrigatória.'),
  fiber: {
    custom: (v: string) => {
      if (!v.trim()) return undefined;
      const n = parseNumberInput(v);
      if (n == null || !Number.isFinite(n)) return 'Valor numérico inválido.';
      if (n < 0) return 'Valor não pode ser negativo.';
      return undefined;
    },
  },
};

export function foodFieldStyle(hasError: boolean, mono = false): React.CSSProperties {
  return {
    padding: '8px 10px',
    border: `1px solid ${hasError ? 'var(--coral)' : 'var(--border)'}`,
    borderRadius: 6,
    fontSize: 13,
    background: 'var(--surface)',
    outline: 'none',
    color: 'var(--fg)',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)',
  };
}

export function parseFoodMacros(form: Record<string, string>): {
  kcal: number;
  prot: number;
  carb: number;
  fat: number;
  fiber?: number;
} | null {
  const kcal = parseNumberInput(form.kcal);
  const prot = parseNumberInput(form.prot);
  const carb = parseNumberInput(form.carb);
  const fat = parseNumberInput(form.fat);
  if (kcal == null || prot == null || carb == null || fat == null) {
    return null;
  }
  const fiberVal = form.fiber?.trim() ? parseNumberInput(form.fiber) : undefined;
  return {
    kcal,
    prot,
    carb,
    fat,
    fiber: fiberVal ?? undefined,
  };
}

export function hasRequiredFoodFields(form: Record<string, string>): boolean {
  const fields = ['name', 'referenceAmount', 'kcal', 'prot', 'carb', 'fat'];
  return fields.every((k) => Boolean(form[k]?.trim()));
}

export function useFoodSuggestion(name: string) {
  const [suggestion, setSuggestion] = useState<FoodSuggestionData | null>(null);

  useEffect(() => {
    if (!name || name.trim().length < 3) {
      setSuggestion(null);
      return;
    }
    let isCancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await suggestFood(name.trim());
        if (!isCancelled && res?.success) {
          setSuggestion({
            category: res.category,
            unit: res.unit,
            referenceAmount: res.referenceAmount,
          });
        }
      } catch {
        // silent
      }
    }, 450);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [name]);

  return { suggestion, setSuggestion };
}
