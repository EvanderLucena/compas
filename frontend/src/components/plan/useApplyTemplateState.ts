import { useState, useMemo } from 'react';
import {
  usePlanTemplates,
  useApplyTemplateToPatient,
  useDeletePlanTemplate,
  usePlanTemplateUIStore,
} from '../../stores/planTemplateStore';
import type { PlanTemplateResponse } from '../../api/planTemplates';

export function useApplyTemplateState(
  patientId: string,
  isReadOnly: boolean,
  onReadOnlyClick?: () => void,
) {
  const { data: templates = [], isLoading } = usePlanTemplates();
  const applyMutation = useApplyTemplateToPatient(patientId);
  const deleteMutation = useDeletePlanTemplate();

  const {
    selectedTemplateId,
    setSelectedTemplateId,
    categoryFilter,
    setCategoryFilter,
    typeFilter,
    setTypeFilter,
  } = usePlanTemplateUIStore();

  const [confirmApply, setConfirmApply] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<PlanTemplateResponse | null>(null);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (typeFilter === 'system' && !t.isSystem) return false;
      if (typeFilter === 'custom' && t.isSystem) return false;
      if (categoryFilter !== 'ALL' && t.category.toUpperCase() !== categoryFilter.toUpperCase()) {
        return false;
      }
      return true;
    });
  }, [templates, typeFilter, categoryFilter]);

  const activeTemplate = useMemo(() => {
    if (selectedTemplateId) {
      const found = templates.find((t) => t.id === selectedTemplateId);
      if (found) return found;
    }
    return filteredTemplates[0] || null;
  }, [templates, selectedTemplateId, filteredTemplates]);

  const handleApply = () => {
    if (isReadOnly) {
      onReadOnlyClick?.();
      return;
    }
    if (!activeTemplate) return;
    if (!confirmApply) {
      setConfirmApply(true);
      return;
    }
    applyMutation.mutate(activeTemplate.id);
  };

  const confirmDelete = () => {
    if (!templateToDelete) return;
    deleteMutation.mutate(templateToDelete.id, {
      onSuccess: () => {
        if (selectedTemplateId === templateToDelete.id) {
          setSelectedTemplateId(null);
        }
        setTemplateToDelete(null);
      },
    });
  };

  return {
    filteredTemplates,
    activeTemplate,
    isLoading,
    typeFilter,
    setTypeFilter,
    categoryFilter,
    setCategoryFilter,
    setSelectedTemplateId,
    confirmApply,
    setConfirmApply,
    handleApply,
    templateToDelete,
    setTemplateToDelete,
    confirmDelete,
    isApplying: applyMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
