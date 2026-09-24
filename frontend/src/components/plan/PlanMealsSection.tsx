import { PlanMealSidebar } from './PlanMealSidebar';
import { PlanActiveMealContent } from './PlanActiveMealContent';
import { FoodSubstitutionModal } from './FoodSubstitutionModal';
import { usePlanUIStore } from '../../stores/planStore';
import { usePlanMealActions } from './usePlanMealActions';
import { usePlanFoodSubstitution } from './usePlanFoodSubstitution';
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
  const {
    handleRenameMeal,
    handleRenameOption,
    handleRemoveOption,
    handleAddOption,
    handleUpdateFoodReferenceAmount,
    handleUpdateFoodPrep,
  } = usePlanMealActions(patientId, activeMeal, activeOpt);
  const {
    substitutingFood,
    openSubstitutionModal,
    closeSubstitutionModal,
    handleApplySubstitution,
    isApplying,
  } = usePlanFoodSubstitution(patientId, activeMeal, activeOpt);

  return (
    <>
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
          onRenameMeal={handleRenameMeal}
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
            onAddOption={handleAddOption}
            onRenameOption={handleRenameOption}
            onRemoveOption={handleRemoveOption}
            onReferenceAmountChange={handleUpdateFoodReferenceAmount}
            onPrepChange={handleUpdateFoodPrep}
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
            onSubstituteClick={openSubstitutionModal}
          />
        )}
      </div>

      {substitutingFood && (
        <FoodSubstitutionModal
          isOpen={Boolean(substitutingFood)}
          onClose={closeSubstitutionModal}
          sourceFood={substitutingFood}
          patientId={patientId}
          onApplySubstitution={handleApplySubstitution}
          isReadOnly={isReadOnly}
          isApplying={isApplying}
        />
      )}
    </>
  );
}
