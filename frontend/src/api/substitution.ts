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

function sanitizeSubstitutionRequest(request: FoodSubstitutionRequest): FoodSubstitutionRequest {
  const isUuid =
    typeof request.foodId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(request.foodId);
  return {
    ...request,
    foodId: isUuid ? request.foodId : undefined,
  };
}

export async function calculatePatientSubstitutions(
  patientId: string,
  request: FoodSubstitutionRequest,
): Promise<FoodSubstitutionResponse> {
  const res = await apiClient.post<ApiEnvelope<FoodSubstitutionResponse>>(
    `/patients/${patientId}/food-substitutions`,
    sanitizeSubstitutionRequest(request),
  );
  return res.data.data;
}

export async function calculateGeneralSubstitutions(
  request: FoodSubstitutionRequest,
): Promise<FoodSubstitutionResponse> {
  const res = await apiClient.post<ApiEnvelope<FoodSubstitutionResponse>>(
    '/food-substitutions/calculate',
    sanitizeSubstitutionRequest(request),
  );
  return res.data.data;
}
