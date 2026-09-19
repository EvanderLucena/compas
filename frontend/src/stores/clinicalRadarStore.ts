import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as clinicalRadarApi from '../api/clinicalRadar';
import type { ClinicalRadarData } from '../types/clinicalRadar';
import { useToastStore } from './toastStore';

export const CLINICAL_RADAR_QUERY_KEY = ['clinical-radar'] as const;

export function useClinicalRadar() {
  return useQuery<ClinicalRadarData>({
    queryKey: CLINICAL_RADAR_QUERY_KEY,
    queryFn: clinicalRadarApi.getClinicalRadar,
    refetchInterval: 15_000,
  });
}

export function useResolveAttention() {
  const queryClient = useQueryClient();
  const showSuccess = useToastStore((s) => s.showSuccess);
  const showError = useToastStore((s) => s.showError);

  return useMutation({
    mutationFn: clinicalRadarApi.resolveAttentionItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLINICAL_RADAR_QUERY_KEY });
      showSuccess('Alerta marcado como resolvido!');
    },
    onError: () => {
      showError('Não foi possível atualizar o alerta.');
    },
  });
}
