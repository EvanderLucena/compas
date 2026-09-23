import { useState } from 'react';
import { AddFoodModal } from './AddFoodModal';
import { AddMealModal } from './AddMealModal';
import { PlanDeleteModal } from './PlanDeleteModal';
import {
  usePlanUIStore,
  useAddMealSlot,
  useDeleteMealSlot,
  useAddFoodItem,
  useDeleteFoodItem,
} from '../../stores/planStore';
import { useToastStore } from '../../stores/toastStore';
import { resolveMutationErrorMessage } from '../../stores/patientStore';
import type { MealSlot, MealOption } from '../../types/plan';

interface PlanModalsProps {
  patientId: string;
  activeMeal?: MealSlot;
  activeOpt?: MealOption;
  meals: MealSlot[];
}

export function PlanModals({ patientId, activeMeal, activeOpt, meals }: PlanModalsProps) {
  const planUI = usePlanUIStore();
  const addFoodItem = useAddFoodItem(patientId);
  const addMealSlot = useAddMealSlot(patientId);
  const deleteFoodItem = useDeleteFoodItem(patientId);
  const deleteMealSlot = useDeleteMealSlot(patientId);

  const [addFoodError, setAddFoodError] = useState<string | null>(null);
  const [addMealError, setAddMealError] = useState<string | null>(null);

  const handleAddFood = (data: { foodId: string; referenceAmount: number }) => {
    if (!activeMeal || !activeOpt) return;
    setAddFoodError(null);
    addFoodItem.mutate(
      {
        mealId: activeMeal.id,
        optionId: activeOpt.id,
        data: { foodId: data.foodId, referenceAmount: data.referenceAmount },
      },
      {
        onSuccess: () => {
          useToastStore.getState().showSuccess('Alimento adicionado à refeição');
          setAddFoodError(null);
          planUI.setAddFoodModalOpen(false);
        },
        onError: (err) => {
          const msg = resolveMutationErrorMessage(err, 'Erro ao adicionar alimento à refeição');
          setAddFoodError(msg);
          useToastStore.getState().showError(msg);
        },
      },
    );
  };

  const handleAddMeal = (data: { label: string; time: string }) => {
    setAddMealError(null);
    addMealSlot.mutate(
      { label: data.label, time: data.time },
      {
        onSuccess: () => {
          useToastStore.getState().showSuccess('Refeição criada com sucesso');
          setAddMealError(null);
          planUI.setAddMealModalOpen(false);
        },
        onError: (err) => {
          const msg = resolveMutationErrorMessage(err, 'Erro ao criar refeição');
          setAddMealError(msg);
          useToastStore.getState().showError(msg);
        },
      },
    );
  };

  const handleDeleteFood = () => {
    if (planUI.pendingDeleteItem) {
      deleteFoodItem.mutate({
        mealId: planUI.pendingDeleteItem.mealId,
        optionId: planUI.pendingDeleteItem.optionId,
        itemId: planUI.pendingDeleteItem.itemId,
      });
      planUI.setPendingDeleteItem(null);
    }
  };

  const handleDeleteMeal = () => {
    if (planUI.pendingDeleteMealId) {
      deleteMealSlot.mutate(planUI.pendingDeleteMealId);
      planUI.setPendingDeleteMealId(null);
    }
  };

  return (
    <>
      {planUI.addFoodModalOpen && activeMeal && activeOpt && (
        <AddFoodModal
          onClose={() => {
            setAddFoodError(null);
            planUI.setAddFoodModalOpen(false);
          }}
          isSubmitting={addFoodItem.isPending}
          error={addFoodError}
          onAdd={handleAddFood}
        />
      )}
      {planUI.addMealModalOpen && (
        <AddMealModal
          onClose={() => {
            setAddMealError(null);
            planUI.setAddMealModalOpen(false);
          }}
          isSubmitting={addMealSlot.isPending}
          error={addMealError}
          onAdd={handleAddMeal}
        />
      )}
      {planUI.pendingDeleteItem && (
        <PlanDeleteModal
          name={planUI.pendingDeleteItem.name}
          onClose={() => planUI.setPendingDeleteItem(null)}
          onConfirm={handleDeleteFood}
        />
      )}
      {planUI.pendingDeleteMealId && (
        <PlanDeleteModal
          name={meals.find((m) => m.id === planUI.pendingDeleteMealId)?.label || 'esta refeição'}
          onClose={() => planUI.setPendingDeleteMealId(null)}
          onConfirm={handleDeleteMeal}
        />
      )}
    </>
  );
}
