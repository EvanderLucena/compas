import { useMutation } from '@tanstack/react-query';
import { calculatePatientSubstitutions, calculateGeneralSubstitutions } from '../api/substitution';
import type { FoodSubstitutionRequest, FoodSubstitutionResponse } from '../types/substitution';
import { useToastStore } from './toastStore';

export function useFoodSubstitutionCalculator(patientId?: string | null) {
  const showToastError = useToastStore((s) => s.showError);
  const isUuid =
    typeof patientId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientId);

  return useMutation<FoodSubstitutionResponse, Error, FoodSubstitutionRequest>({
    mutationFn: async (request) => {
      if (isUuid && patientId) {
        try {
          return await calculatePatientSubstitutions(patientId, request);
        } catch {
          return await calculateGeneralSubstitutions(request);
        }
      }
      return calculateGeneralSubstitutions(request);
    },
    onError: (err) => {
      showToastError(err.message || 'Falha ao calcular substituições de alimentos.');
    },
  });
}
