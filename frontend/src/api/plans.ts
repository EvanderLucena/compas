import { apiClient } from './client';
import type { MealPlan } from '../types/plan';

// --- Request Types ---

export interface UpdatePlanRequest {
  title?: string;
  notes?: string;
  kcalTarget?: number;
  protTarget?: number;
  carbTarget?: number;
  fatTarget?: number;
}

export interface AddMealSlotRequest {
  label: string;
  time: string;
}

export interface UpdateMealSlotRequest {
  label?: string;
  time?: string;
}

export interface AddOptionRequest {
  name: string;
}

export interface UpdateOptionRequest {
  name: string;
}

export interface AddFoodItemRequest {
  foodId: string;
  referenceAmount: number;
}

export interface UpdateFoodItemRequest {
  referenceAmount?: number;
  prep?: string;
  kcal?: number;
  prot?: number;
  carb?: number;
  fat?: number;
}

export interface AddExtraRequest {
  name: string;
  quantity: string;
}

export interface UpdateExtraRequest {
  name?: string;
  quantity?: string;
  kcal?: number;
  prot?: number;
  carb?: number;
  fat?: number;
}

// --- API Functions ---

export async function getPlan(patientId: string): Promise<MealPlan> {
  const response = await apiClient.get<{ success: boolean; data: MealPlan }>(
    `/patients/${patientId}/plan`,
  );
  return response.data.data;
}

export async function updatePlan(patientId: string, data: UpdatePlanRequest): Promise<MealPlan> {
  const response = await apiClient.patch<{ success: boolean; data: MealPlan }>(
    `/patients/${patientId}/plan`,
    data,
  );
  return response.data.data;
}

export async function addMealSlot(
  patientId: string,
  data: AddMealSlotRequest,
): Promise<MealPlan['meals'][number]> {
  const response = await apiClient.post<{ success: boolean; data: MealPlan['meals'][number] }>(
    `/patients/${patientId}/plan/meals`,
    data,
  );
  return response.data.data;
}

export async function updateMealSlot(
  patientId: string,
  mealId: string,
  data: UpdateMealSlotRequest,
): Promise<MealPlan['meals'][number]> {
  const response = await apiClient.patch<{ success: boolean; data: MealPlan['meals'][number] }>(
    `/patients/${patientId}/plan/meals/${mealId}`,
    data,
  );
  return response.data.data;
}

export async function deleteMealSlot(patientId: string, mealId: string): Promise<void> {
  await apiClient.delete(`/patients/${patientId}/plan/meals/${mealId}`);
}

export async function addOption(
  patientId: string,
  mealId: string,
  data: AddOptionRequest,
): Promise<MealPlan['meals'][number]['options'][number]> {
  const response = await apiClient.post<{
    success: boolean;
    data: MealPlan['meals'][number]['options'][number];
  }>(`/patients/${patientId}/plan/meals/${mealId}/options`, data);
  return response.data.data;
}

export async function updateOption(
  patientId: string,
  mealId: string,
  optionId: string,
  data: UpdateOptionRequest,
): Promise<MealPlan['meals'][number]['options'][number]> {
  const response = await apiClient.patch<{
    success: boolean;
    data: MealPlan['meals'][number]['options'][number];
  }>(`/patients/${patientId}/plan/meals/${mealId}/options/${optionId}`, data);
  return response.data.data;
}

export async function deleteOption(
  patientId: string,
  mealId: string,
  optionId: string,
): Promise<void> {
  await apiClient.delete(`/patients/${patientId}/plan/meals/${mealId}/options/${optionId}`);
}

export async function addFoodItem(
  patientId: string,
  mealId: string,
  optionId: string,
  data: AddFoodItemRequest,
): Promise<MealPlan['meals'][number]['options'][number]['items'][number]> {
  const response = await apiClient.post<{
    success: boolean;
    data: MealPlan['meals'][number]['options'][number]['items'][number];
  }>(`/patients/${patientId}/plan/meals/${mealId}/options/${optionId}/items`, data);
  return response.data.data;
}

export async function updateFoodItem(
  patientId: string,
  mealId: string,
  optionId: string,
  itemId: string,
  data: UpdateFoodItemRequest,
): Promise<MealPlan['meals'][number]['options'][number]['items'][number]> {
  const response = await apiClient.patch<{
    success: boolean;
    data: MealPlan['meals'][number]['options'][number]['items'][number];
  }>(`/patients/${patientId}/plan/meals/${mealId}/options/${optionId}/items/${itemId}`, data);
  return response.data.data;
}

export async function deleteFoodItem(
  patientId: string,
  mealId: string,
  optionId: string,
  itemId: string,
): Promise<void> {
  await apiClient.delete(
    `/patients/${patientId}/plan/meals/${mealId}/options/${optionId}/items/${itemId}`,
  );
}

export async function addExtra(
  patientId: string,
  data: AddExtraRequest,
): Promise<MealPlan['extras'][number]> {
  const response = await apiClient.post<{
    success: boolean;
    data: MealPlan['extras'][number];
  }>(`/patients/${patientId}/plan/extras`, data);
  return response.data.data;
}

export async function updateExtra(
  patientId: string,
  extraId: string,
  data: UpdateExtraRequest,
): Promise<MealPlan['extras'][number]> {
  const response = await apiClient.patch<{
    success: boolean;
    data: MealPlan['extras'][number];
  }>(`/patients/${patientId}/plan/extras/${extraId}`, data);
  return response.data.data;
}

export async function deleteExtra(patientId: string, extraId: string): Promise<void> {
  await apiClient.delete(`/patients/${patientId}/plan/extras/${extraId}`);
}

export interface AdoptFrequentFoodRequest {
  foodName: string;
  typicalGrams?: number;
  typicalKcal?: number;
  typicalProt?: number;
  typicalCarb?: number;
  typicalFat?: number;
}

export async function adoptFrequentFood(
  patientId: string,
  mealId: string,
  data: AdoptFrequentFoodRequest,
): Promise<MealPlan['meals'][number]['options'][number]> {
  const response = await apiClient.post<{
    success: boolean;
    data: MealPlan['meals'][number]['options'][number];
  }>(`/patients/${patientId}/plan/meals/${mealId}/options/adopt-frequent-food`, data);
  return response.data.data;
}
