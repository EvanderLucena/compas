import { create } from 'zustand';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as templateApi from '../api/planTemplates';
import type { SavePlanAsTemplateRequest } from '../api/planTemplates';
import { useToastStore } from './toastStore';

interface PlanTemplateUIState {
  applyModalOpen: boolean;
  saveModalOpen: boolean;
  selectedTemplateId: string | null;
  categoryFilter: string;
  typeFilter: 'all' | 'system' | 'custom';
  setApplyModalOpen: (open: boolean) => void;
  setSaveModalOpen: (open: boolean) => void;
  setSelectedTemplateId: (id: string | null) => void;
  setCategoryFilter: (category: string) => void;
  setTypeFilter: (filter: 'all' | 'system' | 'custom') => void;
}

export const usePlanTemplateUIStore = create<PlanTemplateUIState>()((set) => ({
  applyModalOpen: false,
  saveModalOpen: false,
  selectedTemplateId: null,
  categoryFilter: 'ALL',
  typeFilter: 'all',
  setApplyModalOpen: (open) => set({ applyModalOpen: open }),
  setSaveModalOpen: (open) => set({ saveModalOpen: open }),
  setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
}));

export function usePlanTemplates() {
  return useQuery({
    queryKey: ['plan-templates'],
    queryFn: templateApi.listTemplates,
  });
}

export function useSavePlanAsTemplate(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SavePlanAsTemplateRequest) =>
      templateApi.savePlanAsTemplate(patientId, data),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['plan-templates'] });
      useToastStore.getState().showSuccess(`Modelo "${saved.name}" salvo com sucesso!`);
      usePlanTemplateUIStore.getState().setSaveModalOpen(false);
    },
    onError: () => {
      useToastStore.getState().showError('Erro ao salvar plano como modelo');
    },
  });
}

export function useApplyTemplateToPatient(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => templateApi.applyTemplateToPatient(templateId, patientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', patientId] });
      useToastStore.getState().showSuccess('Modelo aplicado ao paciente com sucesso!');
      usePlanTemplateUIStore.getState().setApplyModalOpen(false);
      usePlanTemplateUIStore.getState().setSelectedTemplateId(null);
    },
    onError: () => {
      useToastStore.getState().showError('Erro ao aplicar modelo ao paciente');
    },
  });
}

export function useDeletePlanTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => templateApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-templates'] });
      useToastStore.getState().showSuccess('Modelo excluído com sucesso!');
    },
    onError: () => {
      useToastStore.getState().showError('Erro ao excluir modelo');
    },
  });
}
