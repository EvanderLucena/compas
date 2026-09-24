import { apiClient } from './client';
import type { FoodSubstitutionRequest, FoodSubstitutionResponse } from '../types/substitution';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export async function calculatePatientSubstitutions(
  patientId: string,
  request: FoodSubstitutionRequest,
): Promise<FoodSubstitutionResponse> {
  const res = await apiClient.post<ApiEnvelope<FoodSubstitutionResponse>>(
    `/api/v1/patients/${patientId}/food-substitutions`,
    request,
  );
  return res.data.data;
}

export async function calculateGeneralSubstitutions(
  request: FoodSubstitutionRequest,
): Promise<FoodSubstitutionResponse> {
  const res = await apiClient.post<ApiEnvelope<FoodSubstitutionResponse>>(
    '/api/v1/food-substitutions/calculate',
    request,
  );
  return res.data.data;
}
