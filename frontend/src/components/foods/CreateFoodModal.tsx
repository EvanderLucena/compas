import { useState } from 'react';
import type { FoodCategoryKey, FoodUnit } from '../../types/food';
import { FOOD_UNIT_SYMBOLS } from '../../types/food';
import { parseNumberInput } from '../../utils/numberInput';
import { useCreateFood } from '../../stores/foodStore';
import { IconCheck } from '../icons';
import { useValidation } from '../../hooks/useValidation';
import { useToastStore } from '../../stores/toastStore';
import { resolveMutationErrorMessage } from '../../stores/patientStore';
import {
  FOOD_FORM_RULES,
  parseFoodMacros,
  hasRequiredFoodFields,
  useFoodSuggestion,
} from './foodValidation';
import { FoodModalWrapper } from './FoodModalWrapper';
import { FoodFormFields } from './FoodFormFields';

function CreateFoodFooter({
  onClose,
  onSubmit,
  isFormValid,
  isPending,
}: {
  onClose: () => void;
  onSubmit: () => void;
  isFormValid: boolean;
  isPending: boolean;
}) {
  return (
    <div
      style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 8,
        background: 'var(--surface-2)',
      }}
    >
      <button type="button" className="btn btn-ghost" onClick={onClose}>
        Cancelar
      </button>
      <button
        type="button"
        data-testid="newfood-submit"
        className="btn btn-primary"
        onClick={onSubmit}
        disabled={!isFormValid || isPending}
        style={{ opacity: isFormValid && !isPending ? 1 : 0.45 }}
      >
        <IconCheck size={13} /> {isPending ? 'Salvando...' : 'Salvar no catálogo'}
      </button>
    </div>
  );
}

export function CreateFoodModal({ onClose }: { onClose: () => void }) {
  const [category, setCategory] = useState<FoodCategoryKey>('PROTEINA');
  const [unit, setUnit] = useState<FoodUnit>('GRAMAS');
  const [prep, setPrep] = useState('');
  const [portionLabel, setPortionLabel] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createFood = useCreateFood();

  const {
    values: form,
    errors,
    set,
    onBlur,
    validateAll,
  } = useValidation(
    {
      name: '',
      referenceAmount: '100',
      kcal: '0',
      prot: '0',
      carb: '0',
      fat: '0',
      fiber: '',
    } as Record<string, string>,
    FOOD_FORM_RULES,
  );

  const { suggestion, setSuggestion } = useFoodSuggestion(form.name);

  const handleCreate = () => {
    setSubmitError(null);
    if (!validateAll()) return;
    const macros = parseFoodMacros(form);
    if (!macros) {
      setSubmitError('Preencha todos os campos obrigatórios de macronutrientes.');
      return;
    }
    createFood.mutate(
      {
        name: form.name.trim(),
        category,
        unit,
        referenceAmount: parseNumberInput(form.referenceAmount),
        ...macros,
        prep: prep || null,
        portionLabel: portionLabel || null,
      },
      {
        onSuccess: () => {
          setSubmitError(null);
          useToastStore.getState().showSuccess('Alimento cadastrado com sucesso');
          onClose();
        },
        onError: (error) => {
          const msg = resolveMutationErrorMessage(
            error,
            'Erro ao cadastrar alimento — tente novamente',
          );
          setSubmitError(msg);
          useToastStore.getState().showError(msg);
        },
      },
    );
  };

  const handleApplySuggestion = () => {
    if (!suggestion) return;
    setCategory(suggestion.category);
    setUnit(suggestion.unit);
    if (suggestion.referenceAmount) {
      set('referenceAmount', String(suggestion.referenceAmount));
    }
    setSuggestion(null);
  };

  const unitSymbol = FOOD_UNIT_SYMBOLS[unit];
  const refLabel = unit === 'UNIDADE' ? 'unidade' : unit === 'ML' ? 'ml' : 'g';
  const isFormValid = hasRequiredFoodFields(form);

  return (
    <FoodModalWrapper title="Novo alimento" titleId="create-food-title" onClose={onClose}>
      <FoodFormFields
        idPrefix="create-food"
        nameTestId="newfood-name"
        namePlaceholder="ex: Frango desfiado"
        submitError={submitError}
        form={form}
        errors={errors}
        category={category}
        onCategoryChange={setCategory}
        unit={unit}
        onUnitChange={setUnit}
        prep={prep}
        onPrepChange={setPrep}
        portionLabel={portionLabel}
        onPortionLabelChange={setPortionLabel}
        onFieldChange={(key, val) => set(key, val)}
        onFieldBlur={(key) => onBlur(key)()}
        unitSymbol={unitSymbol}
        refLabel={refLabel}
        suggestion={suggestion}
        onApplySuggestion={handleApplySuggestion}
      />

      <CreateFoodFooter
        onClose={onClose}
        onSubmit={handleCreate}
        isFormValid={isFormValid}
        isPending={createFood.isPending}
      />
    </FoodModalWrapper>
  );
}
