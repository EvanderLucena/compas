import { apiClient } from './client';
import type {
  FoodListApiResponse,
  FoodApiResponse,
  FoodCategoryKey,
  FoodUnit,
} from '../types/food';

export interface ListFoodsParams {
  page?: number;
  size?: number;
  search?: string;
  category?: FoodCategoryKey;
}

export interface CreateFoodRequest {
  name: string;
  category: FoodCategoryKey;
  unit: FoodUnit;
  referenceAmount: number;
  kcal: number;
  prot: number;
  carb: number;
  fat: number;
  fiber?: number | null;
  prep?: string | null;
  portionLabel?: string | null;
}

export type UpdateFoodRequest = Partial<CreateFoodRequest>;

export async function listFoods(params: ListFoodsParams = {}): Promise<FoodListApiResponse> {
  const response = await apiClient.get<{ success: boolean; data: FoodListApiResponse }>('/foods', {
    params,
  });
  return response.data.data;
}

export async function createFood(data: CreateFoodRequest): Promise<FoodApiResponse> {
  const response = await apiClient.post<{ success: boolean; data: FoodApiResponse }>(
    '/foods',
    data,
  );
  return response.data.data;
}

export async function updateFood(id: string, data: UpdateFoodRequest): Promise<FoodApiResponse> {
  const response = await apiClient.patch<{ success: boolean; data: FoodApiResponse }>(
    `/foods/${id}`,
    data,
  );
  return response.data.data;
}

export async function deleteFood(id: string): Promise<void> {
  await apiClient.delete(`/foods/${id}`);
}

export interface FoodSuggestion {
  category: FoodCategoryKey;
  unit: FoodUnit;
  referenceAmount: number;
  confidence: number;
  success: boolean;
}

export async function suggestFood(name: string): Promise<FoodSuggestion> {
  const response = await apiClient.get<{ success: boolean; data: FoodSuggestion }>(
    '/foods/suggest',
    {
      params: { name },
    },
  );
  return response.data.data;
}
