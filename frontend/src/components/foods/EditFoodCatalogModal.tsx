import { useState } from 'react';
import type { Food, FoodCategoryKey, FoodUnit } from '../../types/food';
import { FOOD_UNIT_SYMBOLS, REVERSE_CATEGORY_LABELS } from '../../types/food';
import { parseNumberInput } from '../../utils/numberInput';
import { useUpdateFood, useCreateFood } from '../../stores/foodStore';
import { IconCheck, IconPlus } from '../icons';
import { useValidation } from '../../hooks/useValidation';
import { useToastStore } from '../../stores/toastStore';
import { resolveMutationErrorMessage } from '../../stores/patientStore';
import { FOOD_FORM_RULES, parseFoodMacros, hasRequiredFoodFields } from './foodValidation';
import { FoodModalWrapper } from './FoodModalWrapper';
import { FoodFormFields } from './FoodFormFields';

function TacoBanner() {
  return (
    <div
      style={{
        margin: '16px 20px 0',
        padding: '10px 14px',
        background: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: 6,
        fontSize: 12.5,
        color: 'var(--fg)',
        lineHeight: 1.4,
      }}
    >
      ℹ️ Este é um alimento padrão da <strong>Tabela TACO / IBGE</strong>. Você pode duplicá-lo como
      personalizado para customizar seus valores à vontade.
    </div>
  );
}

interface EditFoodFooterProps {
  isCustom: boolean;
  onClose: () => void;
  onSave: () => void;
  onDuplicate: () => void;
  isFormValid: boolean;
  isSaving: boolean;
  isDuplicating: boolean;
}

function EditFoodFooter({
  isCustom,
  onClose,
  onSave,
  onDuplicate,
  isFormValid,
  isSaving,
  isDuplicating,
}: EditFoodFooterProps) {
  return (
    <div
      style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 8,
        background: 'var(--surface-2)',
      }}
    >
      <button type="button" className="btn btn-ghost" onClick={onClose}>
        {isCustom ? 'Cancelar' : 'Fechar'}
      </button>
      {isCustom ? (
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSave}
          disabled={!isFormValid || isSaving}
          style={{ opacity: isFormValid && !isSaving ? 1 : 0.45 }}
        >
          <IconCheck size={13} /> {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-primary"
          onClick={onDuplicate}
          disabled={isDuplicating}
        >
          <IconPlus size={13} /> {isDuplicating ? 'Duplicando...' : 'Duplicar como personalizado'}
        </button>
      )}
    </div>
  );
}

function useFoodEditMutations({
  food,
  onClose,
  setSubmitError,
}: {
  food: Food;
  onClose: () => void;
  setSubmitError: (msg: string | null) => void;
}) {
  const updateFood = useUpdateFood();
  const createFood = useCreateFood();

  const handleDuplicate = (
    form: Record<string, string>,
    category: FoodCategoryKey,
    unit: FoodUnit,
    prep: string,
  ) => {
    setSubmitError(null);
    const macros = parseFoodMacros(form);
    if (!macros) {
      setSubmitError('Preencha todos os campos obrigatórios de macronutrientes.');
      return;
    }
    createFood.mutate(
      {
        name: `${form.name.trim()} (Personalizado)`,
        category,
        unit,
        referenceAmount: parseNumberInput(form.referenceAmount),
        ...macros,
        prep: prep || null,
        portionLabel: food.portionLabel || null,
      },
      {
        onSuccess: () => {
          setSubmitError(null);
          useToastStore.getState().showSuccess('Alimento duplicado como personalizado!');
          onClose();
        },
        onError: (error) => {
          const msg = resolveMutationErrorMessage(
            error,
            'Erro ao duplicar alimento — tente novamente',
          );
          setSubmitError(msg);
          useToastStore.getState().showError(msg);
        },
      },
    );
  };

  const handleSave = (
    form: Record<string, string>,
    category: FoodCategoryKey,
    unit: FoodUnit,
    prep: string,
  ) => {
    setSubmitError(null);
    const macros = parseFoodMacros(form);
    if (!macros) {
      setSubmitError('Preencha todos os campos obrigatórios de macronutrientes.');
      return;
    }
    updateFood.mutate(
      {
        id: food.id,
        data: {
          name: form.name.trim(),
          category,
          unit,
          referenceAmount: parseNumberInput(form.referenceAmount),
          ...macros,
          prep: prep || null,
        },
      },
      {
        onSuccess: () => {
          setSubmitError(null);
          useToastStore.getState().showSuccess('Alimento atualizado com sucesso');
          onClose();
        },
        onError: (error) => {
          const msg = resolveMutationErrorMessage(
            error,
            'Erro ao atualizar alimento — tente novamente',
          );
          setSubmitError(msg);
          useToastStore.getState().showError(msg);
        },
      },
    );
  };

  return {
    handleDuplicate,
    handleSave,
    isSaving: updateFood.isPending,
    isDuplicating: createFood.isPending,
  };
}

export interface EditFoodCatalogModalProps {
  food: Food;
  onClose: () => void;
}

export function EditFoodCatalogModal({ food, onClose }: EditFoodCatalogModalProps) {
  const [category, setCategory] = useState<FoodCategoryKey>(
    REVERSE_CATEGORY_LABELS[food.category] || (food.category as FoodCategoryKey),
  );
  const [unit, setUnit] = useState<FoodUnit>(food.unit);
  const [prep, setPrep] = useState(food.prep);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { handleDuplicate, handleSave, isSaving, isDuplicating } = useFoodEditMutations({
    food,
    onClose,
    setSubmitError,
  });

  const {
    values: form,
    errors,
    set,
    onBlur,
    validateAll,
  } = useValidation(
    {
      name: food.name,
      referenceAmount: String(food.referenceAmount),
      kcal: String(food.kcal ?? 0),
      prot: String(food.prot ?? 0),
      carb: String(food.carb ?? 0),
      fat: String(food.fat ?? 0),
      fiber: String(food.fiber ?? ''),
    } as Record<string, string>,
    FOOD_FORM_RULES,
  );

  const unitSymbol = FOOD_UNIT_SYMBOLS[unit];
  const refLabel = unit === 'UNIDADE' ? 'unidade' : unit === 'ML' ? 'ml' : 'g';
  const isFormValid = hasRequiredFoodFields(form);

  return (
    <FoodModalWrapper
      title={food.custom ? 'Editar alimento' : 'Detalhes do alimento (Tabela TACO)'}
      ariaLabel="Editar alimento"
      onClose={onClose}
    >
      {!food.custom && <TacoBanner />}

      <FoodFormFields
        idPrefix="edit-catalog"
        submitError={submitError}
        form={form}
        errors={errors}
        category={category}
        onCategoryChange={setCategory}
        unit={unit}
        onUnitChange={setUnit}
        prep={prep}
        onPrepChange={setPrep}
        onFieldChange={(key, val) => set(key, val)}
        onFieldBlur={(key) => onBlur(key)()}
        unitSymbol={unitSymbol}
        refLabel={refLabel}
      />

      <EditFoodFooter
        isCustom={Boolean(food.custom)}
        onClose={onClose}
        onSave={() => {
          if (validateAll()) handleSave(form, category, unit, prep);
        }}
        onDuplicate={() => {
          if (validateAll()) handleDuplicate(form, category, unit, prep);
        }}
        isFormValid={isFormValid}
        isSaving={isSaving}
        isDuplicating={isDuplicating}
      />
    </FoodModalWrapper>
  );
}
