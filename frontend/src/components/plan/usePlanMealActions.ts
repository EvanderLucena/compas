import {
  usePlanUIStore,
  useUpdateMealSlot,
  useAddOption,
  useUpdateOption,
  useDeleteOption,
  useUpdateFoodItem,
} from '../../stores/planStore';
import { useToastStore } from '../../stores/toastStore';
import { resolveMutationErrorMessage } from '../../stores/patientStore';
import type { MealSlot, MealOption } from '../../types/plan';

export function usePlanMealActions(
  patientId: string,
  activeMeal?: MealSlot,
  activeOpt?: MealOption,
) {
  const updateMealSlot = useUpdateMealSlot(patientId);
  const addOption = useAddOption(patientId);
  const updateOption = useUpdateOption(patientId);
  const deleteOption = useDeleteOption(patientId);
  const updateFoodItem = useUpdateFoodItem(patientId);

  const handleRenameMeal = (mealId: string, label: string) => {
    updateMealSlot.mutate(
      { mealId, data: { label } },
      {
        onSuccess: () => {
          useToastStore.getState().showSuccess('Refeição renomeada com sucesso');
        },
        onError: (err) => {
          const msg = resolveMutationErrorMessage(err, 'Erro ao renomear refeição');
          useToastStore.getState().showError(msg);
        },
      },
    );
  };

  const handleRenameOption = (optionId: string, name: string) => {
    if (!activeMeal) return;
    updateOption.mutate(
      { mealId: activeMeal.id, optionId, data: { name } },
      {
        onSuccess: () => {
          useToastStore.getState().showSuccess('Opção renomeada com sucesso');
        },
        onError: (err) => {
          const msg = resolveMutationErrorMessage(err, 'Erro ao renomear opção');
          useToastStore.getState().showError(msg);
        },
      },
    );
  };

  const handleRemoveOption = (optionId: string) => {
    if (!activeMeal) return;
    deleteOption.mutate(
      { mealId: activeMeal.id, optionId },
      {
        onSuccess: () => {
          useToastStore.getState().showSuccess('Opção removida');
          usePlanUIStore.getState().setActiveOptionIndex(0);
        },
        onError: (err) => {
          const msg = resolveMutationErrorMessage(err, 'Erro ao remover opção');
          useToastStore.getState().showError(msg);
        },
      },
    );
  };

  const handleAddOption = () => {
    if (!activeMeal) return;
    addOption.mutate(
      {
        mealId: activeMeal.id,
        data: { name: `Opção ${activeMeal.options.length + 1} · Cópia` },
      },
      {
        onSuccess: () => {
          useToastStore.getState().showSuccess('Opção criada com sucesso');
        },
        onError: (err) => {
          const msg = resolveMutationErrorMessage(err, 'Erro ao criar nova opção');
          useToastStore.getState().showError(msg);
        },
      },
    );
  };

  const handleUpdateFoodReferenceAmount = (itemId: string, referenceAmount: number) => {
    if (!activeMeal || !activeOpt) return;
    updateFoodItem.mutate(
      {
        mealId: activeMeal.id,
        optionId: activeOpt.id,
        itemId,
        data: { referenceAmount },
      },
      {
        onError: (err) => {
          const msg = resolveMutationErrorMessage(err, 'Erro ao atualizar quantidade do alimento');
          useToastStore.getState().showError(msg);
        },
      },
    );
  };

  const handleUpdateFoodPrep = (itemId: string, prep: string) => {
    if (!activeMeal || !activeOpt) return;
    updateFoodItem.mutate(
      {
        mealId: activeMeal.id,
        optionId: activeOpt.id,
        itemId,
        data: { prep },
      },
      {
        onError: (err) => {
          const msg = resolveMutationErrorMessage(err, 'Erro ao atualizar forma de preparo');
          useToastStore.getState().showError(msg);
        },
      },
    );
  };

  return {
    handleRenameMeal,
    handleRenameOption,
    handleRemoveOption,
    handleAddOption,
    handleUpdateFoodReferenceAmount,
    handleUpdateFoodPrep,
  };
}
