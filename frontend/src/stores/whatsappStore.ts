import { create } from 'zustand';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as whatsappApi from '../api/whatsapp';
import type { Extraction, PatchExtractionPayload } from '../types/whatsapp';
import type { TimelineEvent, TimelineMacro } from '../types/patient';
import { useToastStore } from './toastStore';
import { resolveMutationErrorMessage } from './patientStore';

/** UI state for WhatsApp features */
interface WhatsAppUIState {
  activationModalOpen: boolean;
  setActivationModalOpen: (open: boolean) => void;
}

export const useWhatsAppUIStore = create<WhatsAppUIState>()((set) => ({
  activationModalOpen: false,
  setActivationModalOpen: (open) => set({ activationModalOpen: open }),
}));

/**
 * Map Extraction[] to TimelineEvent[] for Timeline component compatibility.
 * Produces items with kind='log' so Timeline shows them.
 */
export function mapExtractionsToTimelineEvents(extractions: Extraction[]): TimelineEvent[] {
  return extractions.map((ex) => {
    const items = ex.items.map((item) => item.name);
    const macros: TimelineMacro = {
      kcal: Math.round(ex.totalKcal),
      prot: Math.round(ex.totalProt),
      carb: Math.round(ex.totalCarb),
      fat: Math.round(ex.totalFat),
    };

    // Format time from ISO string
    const date = new Date(ex.extractedAt);
    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return {
      time,
      meal: ex.mealLabel || 'Refeição',
      label: ex.extractionRaw.slice(0, 60) + (ex.extractionRaw.length > 60 ? '...' : ''),
      kind: 'log' as const,
      items,
      macros,
      hasMessage: true,
      extractionId: ex.id,
      rawItems: ex.items,
    };
  });
}

/** TanStack Query hook for extractions by date (defaults to today) */
export function useExtractions(patientId: string | null, date?: string) {
  const isToday = !date || date === new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['whatsapp-extractions', patientId, date ?? 'today'],
    queryFn: () => {
      if (!patientId) throw new Error('Patient ID is required');
      return whatsappApi.getExtractions(patientId, date);
    },
    enabled: !!patientId,
    staleTime: isToday ? 10_000 : 5 * 60_000,
    refetchInterval: isToday ? 15_000 : false,
    refetchOnWindowFocus: isToday,
  });
}

/** TanStack Query hook for PATCH extraction with optimistic update */
export function usePatchExtraction(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      extractionId,
      payload,
    }: {
      extractionId: string;
      payload: PatchExtractionPayload;
    }) => whatsappApi.patchExtraction(patientId, extractionId, payload),

    // Optimistic update: update the cache immediately
    onMutate: async ({ extractionId, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['whatsapp-extractions', patientId] });

      const previousExtractions = queryClient.getQueryData<Extraction[]>([
        'whatsapp-extractions',
        patientId,
      ]);

      if (previousExtractions) {
        const updated = previousExtractions.map((ex) => {
          if (ex.id === extractionId) {
            return {
              ...ex,
              items: payload.items.map((item, i) => ({
                name: item.name,
                kcal: item.kcal,
                prot: item.prot,
                carb: item.carb,
                fat: item.fat,
                grams: item.grams ?? null,
                sortOrder: i,
              })),
              totalKcal: payload.items.reduce((sum, item) => sum + item.kcal, 0),
              totalProt: payload.items.reduce((sum, item) => sum + item.prot, 0),
              totalCarb: payload.items.reduce((sum, item) => sum + item.carb, 0),
              totalFat: payload.items.reduce((sum, item) => sum + item.fat, 0),
            };
          }
          return ex;
        });
        queryClient.setQueryData(['whatsapp-extractions', patientId], updated);
      }

      return { previousExtractions };
    },

    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousExtractions) {
        queryClient.setQueryData(['whatsapp-extractions', patientId], context.previousExtractions);
      }
      useToastStore
        .getState()
        .showError(resolveMutationErrorMessage(error, 'Erro ao salvar correção — tente novamente'));
    },

    onSuccess: () => {
      // Invalidate to get server-truth data
      queryClient.invalidateQueries({ queryKey: ['whatsapp-extractions', patientId] });
      useToastStore.getState().showSuccess('Extração corrigida com sucesso.');
    },
  });
}

/** TanStack Query hook for activation link */
export function useActivationLink(patientId: string | null) {
  return useQuery({
    queryKey: ['whatsapp-activation-link', patientId],
    queryFn: () => {
      if (!patientId) throw new Error('Patient ID is required');
      return whatsappApi.getActivationLink(patientId);
    },
    enabled: !!patientId,
    staleTime: 5 * 60_000, // 5 minutes — status doesn't change frequently
    retry: 1,
  });
}

/** TanStack Query hook for WhatsApp status (used by HomeView KPIs) */
export function useWhatsAppStatus() {
  return useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: whatsappApi.getStatus,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}
