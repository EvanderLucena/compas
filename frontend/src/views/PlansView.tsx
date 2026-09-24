import { useState, useEffect, useMemo } from 'react';
import {
  PlanSkeleton,
  PlanHeader,
  PlanMealsSection,
  PlanExtrasTab,
  PlanModals,
  usePlanPdfDownloads,
  ApplyTemplateModal,
  SaveAsTemplateModal,
} from '../components/plan';
import { usePlan, usePlanUIStore, useUpdatePlan } from '../stores/planStore';
import { usePlanTemplateUIStore } from '../stores/planTemplateStore';
import { useAuthStore } from '../stores/authStore';
import type { MealSlot, MealOption } from '../types/plan';

interface PlansViewProps {
  patientId: string;
}

function getActiveMealAndOption(
  meals: MealSlot[],
  activeMealId: string | null,
  activeOptionIndex: number,
): { activeMeal?: MealSlot; activeOpt?: MealOption } {
  const activeMeal = meals.find((m) => m.id === activeMealId) ?? meals[0];
  const activeOpt = activeMeal?.options[activeOptionIndex] ?? activeMeal?.options[0];
  return { activeMeal, activeOpt };
}

export function PlansView({ patientId }: PlansViewProps) {
  const { data: plan, isLoading } = usePlan(patientId);
  const planUI = usePlanUIStore();
  const isReadOnly = useAuthStore((s) => Boolean(s.user?.readOnly));
  const openReadOnlyModal = useAuthStore((s) => s.openReadOnlyModal);

  const templateUI = usePlanTemplateUIStore();

  const [section, setSection] = useState<'meals' | 'extras'>('meals');

  const { downloadingPlan, downloadingGrocery, handleDownloadPlanPdf, handleDownloadGroceryPdf } =
    usePlanPdfDownloads(patientId);

  const updatePlan = useUpdatePlan(patientId);

  const meals = useMemo(() => plan?.meals ?? [], [plan?.meals]);
  const extras = useMemo(() => plan?.extras ?? [], [plan?.extras]);

  const { activeMeal, activeOpt } = getActiveMealAndOption(
    meals,
    planUI.activeMealId,
    planUI.activeOptionIndex,
  );

  useEffect(() => {
    if (meals.length > 0) {
      const activeMealExists = meals.some((m: MealSlot) => m.id === planUI.activeMealId);
      if (!planUI.activeMealId || !activeMealExists) {
        planUI.setActiveMealId(meals[0].id);
        planUI.setActiveOptionIndex(0);
      }
    }
  }, [patientId, meals, planUI]);

  if (isLoading || !plan) {
    return <PlanSkeleton />;
  }

  return (
    <div>
      <PlanHeader
        title={plan.title}
        createdAt={plan.createdAt}
        updatedAt={plan.updatedAt}
        notes={plan.notes}
        kcalTarget={plan.kcalTarget}
        protTarget={plan.protTarget}
        carbTarget={plan.carbTarget}
        fatTarget={plan.fatTarget}
        saveStatus={planUI.saveStatus}
        section={section}
        onSectionChange={setSection}
        onUpdateTitle={(title) => updatePlan.mutate({ title })}
        onSaveTargets={(targets) => updatePlan.mutate(targets)}
        onDownloadPlanPdf={handleDownloadPlanPdf}
        onDownloadGroceryPdf={handleDownloadGroceryPdf}
        downloadingPlan={downloadingPlan}
        downloadingGrocery={downloadingGrocery}
        isReadOnly={isReadOnly}
        onReadOnlyClick={openReadOnlyModal}
        onOpenApplyTemplate={() => templateUI.setApplyModalOpen(true)}
        onOpenSaveTemplate={() => templateUI.setSaveModalOpen(true)}
      />

      {section === 'extras' ? (
        <PlanExtrasTab
          patientId={patientId}
          extras={extras}
          isReadOnly={isReadOnly}
          onReadOnlyClick={openReadOnlyModal}
        />
      ) : (
        <PlanMealsSection
          patientId={patientId}
          plan={plan}
          activeMeal={activeMeal}
          activeOpt={activeOpt}
          isReadOnly={isReadOnly}
          onReadOnlyClick={openReadOnlyModal}
        />
      )}

      <PlanModals
        patientId={patientId}
        activeMeal={activeMeal}
        activeOpt={activeOpt}
        meals={meals}
      />

      {templateUI.applyModalOpen && (
        <ApplyTemplateModal
          patientId={patientId}
          onClose={() => templateUI.setApplyModalOpen(false)}
          isReadOnly={isReadOnly}
          onReadOnlyClick={openReadOnlyModal}
        />
      )}

      {templateUI.saveModalOpen && (
        <SaveAsTemplateModal
          patientId={patientId}
          plan={plan}
          onClose={() => templateUI.setSaveModalOpen(false)}
        />
      )}
    </div>
  );
}
