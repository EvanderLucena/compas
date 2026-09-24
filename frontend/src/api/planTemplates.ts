import { apiClient } from './client';
import type { MealPlan } from '../types/plan';

export interface PlanTemplateItem {
  foodId: string | null;
  foodName: string;
  referenceAmount: number;
  unit: string;
  kcal: number;
  prot: number;
  carb: number;
  fat: number;
  prep: string | null;
  sortOrder: number;
}

export interface PlanTemplateOption {
  name: string;
  sortOrder: number;
  items: PlanTemplateItem[];
}

export interface PlanTemplateMeal {
  label: string;
  time: string;
  sortOrder: number;
  options: PlanTemplateOption[];
}

export interface PlanTemplateExtra {
  name: string;
  quantity: string;
  kcal: number;
  prot: number;
  carb: number;
  fat: number;
  sortOrder: number;
}

export interface PlanTemplateResponse {
  id: string;
  nutritionistId: string | null;
  name: string;
  description: string | null;
  category: string;
  isSystem: boolean;
  kcalTarget: number;
  protTarget: number;
  carbTarget: number;
  fatTarget: number;
  meals: PlanTemplateMeal[];
  extras: PlanTemplateExtra[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanTemplateRequest {
  name: string;
  description?: string;
  category?: string;
  kcalTarget: number;
  protTarget?: number;
  carbTarget?: number;
  fatTarget?: number;
  meals?: PlanTemplateMeal[];
  extras?: PlanTemplateExtra[];
}

export interface SavePlanAsTemplateRequest {
  name: string;
  description?: string;
  category?: string;
}

export async function listTemplates(): Promise<PlanTemplateResponse[]> {
  const response = await apiClient.get<{ success: boolean; data: PlanTemplateResponse[] }>(
    '/plan-templates',
  );
  return response.data.data;
}

export async function getTemplate(id: string): Promise<PlanTemplateResponse> {
  const response = await apiClient.get<{ success: boolean; data: PlanTemplateResponse }>(
    `/plan-templates/${id}`,
  );
  return response.data.data;
}

export async function createTemplate(
  data: CreatePlanTemplateRequest,
): Promise<PlanTemplateResponse> {
  const response = await apiClient.post<{ success: boolean; data: PlanTemplateResponse }>(
    '/plan-templates',
    data,
  );
  return response.data.data;
}

export async function savePlanAsTemplate(
  patientId: string,
  data: SavePlanAsTemplateRequest,
): Promise<PlanTemplateResponse> {
  const response = await apiClient.post<{ success: boolean; data: PlanTemplateResponse }>(
    `/plan-templates/save-from-patient/${patientId}`,
    data,
  );
  return response.data.data;
}

export async function applyTemplateToPatient(
  templateId: string,
  patientId: string,
): Promise<MealPlan> {
  const response = await apiClient.post<{ success: boolean; data: MealPlan }>(
    `/plan-templates/${templateId}/apply-to-patient/${patientId}`,
  );
  return response.data.data;
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiClient.delete(`/plan-templates/${id}`);
}
