import { PlanMealSidebar } from './PlanMealSidebar';
import { PlanActiveMealContent } from './PlanActiveMealContent';
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
import type { MealPlan, MealSlot, MealOption } from '../../types/plan';

interface PlanMealsSectionProps {
  patientId: string;
  plan: MealPlan;
  activeMeal?: MealSlot;
  activeOpt?: MealOption;
  isReadOnly: boolean;
  onReadOnlyClick: () => void;
}

export function PlanMealsSection({
  patientId,
  plan,
  activeMeal,
  activeOpt,
  isReadOnly,
  onReadOnlyClick,
}: PlanMealsSectionProps) {
  const planUI = usePlanUIStore();
  const updateMealSlot = useUpdateMealSlot(patientId);
  const addOption = useAddOption(patientId);
  const updateOption = useUpdateOption(patientId);
  const deleteOption = useDeleteOption(patientId);
  const updateFoodItem = useUpdateFoodItem(patientId);

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
          planUI.setActiveOptionIndex(0);
        },
        onError: (err) => {
          const msg = resolveMutationErrorMessage(err, 'Erro ao remover opção');
          useToastStore.getState().showError(msg);
        },
      },
    );
  };

  return (
    <div
      className="plans-grid"
      style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 620 }}
    >
      <PlanMealSidebar
        meals={plan.meals}
        activeMealId={activeMeal?.id ?? null}
        isReadOnly={isReadOnly}
        onSelectMeal={(mealId) => {
          planUI.setActiveMealId(mealId);
          planUI.setActiveOptionIndex(0);
        }}
        onRenameMeal={(mealId, label) => updateMealSlot.mutate({ mealId, data: { label } })}
        onRemoveMeal={(mealId) => planUI.setPendingDeleteMealId(mealId)}
        onAddMealClick={() => planUI.setAddMealModalOpen(true)}
        onReadOnlyClick={onReadOnlyClick}
      />

      {activeMeal && activeOpt && (
        <PlanActiveMealContent
          activeMeal={activeMeal}
          activeOpt={activeOpt}
          activeOptionIndex={planUI.activeOptionIndex}
          kcalTarget={plan.kcalTarget}
          protTarget={plan.protTarget}
          carbTarget={plan.carbTarget}
          fatTarget={plan.fatTarget}
          isReadOnly={isReadOnly}
          onSelectOption={(idx) => planUI.setActiveOptionIndex(idx)}
          onAddOption={() =>
            addOption.mutate({
              mealId: activeMeal.id,
              data: { name: `Opção ${activeMeal.options.length + 1} · Cópia` },
            })
          }
          onRenameOption={handleRenameOption}
          onRemoveOption={handleRemoveOption}
          onReferenceAmountChange={(itemId, referenceAmount) =>
            updateFoodItem.mutate({
              mealId: activeMeal.id,
              optionId: activeOpt.id,
              itemId,
              data: { referenceAmount },
            })
          }
          onPrepChange={(itemId, prep) =>
            updateFoodItem.mutate({
              mealId: activeMeal.id,
              optionId: activeOpt.id,
              itemId,
              data: { prep },
            })
          }
          onRemoveItem={(item) =>
            planUI.setPendingDeleteItem({
              mealId: activeMeal.id,
              optionId: activeOpt.id,
              itemId: item.id,
              name: item.foodName,
            })
          }
          onAddFoodClick={() => planUI.setAddFoodModalOpen(true)}
          onReadOnlyClick={onReadOnlyClick}
        />
      )}
    </div>
  );
}
