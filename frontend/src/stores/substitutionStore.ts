import { useMutation } from '@tanstack/react-query';
import { calculatePatientSubstitutions, calculateGeneralSubstitutions } from '../api/substitution';
import type { FoodSubstitutionRequest, FoodSubstitutionResponse } from '../types/substitution';
import { useToastStore } from './toastStore';

export function useFoodSubstitutionCalculator(patientId?: string | null) {
  const showToastError = useToastStore((s) => s.showError);

  return useMutation<FoodSubstitutionResponse, Error, FoodSubstitutionRequest>({
    mutationFn: (request) => {
      if (patientId) {
        return calculatePatientSubstitutions(patientId, request);
      }
      return calculateGeneralSubstitutions(request);
    },
    onError: (err) => {
      showToastError(err.message || 'Falha ao calcular substituições de alimentos.');
    },
  });
}
