import { useState } from 'react';
import { useAddFoodItem, useDeleteFoodItem } from '../../stores/planStore';
import { useToastStore } from '../../stores/toastStore';
import { resolveMutationErrorMessage } from '../../stores/patientStore';
import type { MealSlot, MealOption, MealFood } from '../../types/plan';
import type { FoodSubstitutionItem } from '../../types/substitution';

export function usePlanFoodSubstitution(
  patientId: string,
  activeMeal?: MealSlot,
  activeOpt?: MealOption,
) {
  const [substitutingFood, setSubstitutingFood] = useState<MealFood | null>(null);
  const addFoodItem = useAddFoodItem(patientId);
  const deleteFoodItem = useDeleteFoodItem(patientId);

  const openSubstitutionModal = (item: MealFood) => {
    setSubstitutingFood(item);
  };

  const closeSubstitutionModal = () => {
    setSubstitutingFood(null);
  };

  const handleApplySubstitution = (targetSub: FoodSubstitutionItem) => {
    if (!activeMeal || !activeOpt || !substitutingFood) return;

    const sourceItem = substitutingFood;
    const portion = targetSub.suggestedAmount;

    addFoodItem.mutate(
      {
        mealId: activeMeal.id,
        optionId: activeOpt.id,
        data: {
          foodId: targetSub.foodId,
          referenceAmount: portion,
        },
      },
      {
        onSuccess: () => {
          deleteFoodItem.mutate(
            {
              mealId: activeMeal.id,
              optionId: activeOpt.id,
              itemId: sourceItem.id,
            },
            {
              onSuccess: () => {
                useToastStore.getState().showSuccess(`Alimento substituído por ${targetSub.name}!`);
                setSubstitutingFood(null);
              },
              onError: (err) => {
                const msg = resolveMutationErrorMessage(
                  err,
                  'Alimento adicionado, mas falhou ao remover o anterior',
                );
                useToastStore.getState().showError(msg);
                setSubstitutingFood(null);
              },
            },
          );
        },
        onError: (err) => {
          const msg = resolveMutationErrorMessage(err, 'Erro ao adicionar alimento substituto');
          useToastStore.getState().showError(msg);
        },
      },
    );
  };

  return {
    substitutingFood,
    openSubstitutionModal,
    closeSubstitutionModal,
    handleApplySubstitution,
    isApplying: addFoodItem.isPending || deleteFoodItem.isPending,
  };
}
