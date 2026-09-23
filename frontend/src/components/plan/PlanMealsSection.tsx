import { PlanMealSidebar } from './PlanMealSidebar';
import { PlanActiveMealContent } from './PlanActiveMealContent';
import {
  usePlanUIStore,
  useUpdateMealSlot,
  useAddOption,
  useUpdateFoodItem,
} from '../../stores/planStore';
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
  const updateFoodItem = useUpdateFoodItem(patientId);

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
