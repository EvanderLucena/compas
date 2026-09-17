import { apiClient } from './client';
import type { NutritionistProfile, UpdateProfileRequest, ChangePasswordRequest } from '../types';

export async function getProfile(): Promise<NutritionistProfile> {
  const response = await apiClient.get<{ success: boolean; data: NutritionistProfile }>(
    '/nutritionist/profile',
  );
  return response.data.data;
}

export async function updateProfile(data: UpdateProfileRequest): Promise<NutritionistProfile> {
  const response = await apiClient.put<{ success: boolean; data: NutritionistProfile }>(
    '/nutritionist/profile',
    data,
  );
  return response.data.data;
}

export async function changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
  const response = await apiClient.post<{ success: boolean; data: { message: string } }>(
    '/nutritionist/change-password',
    data,
  );
  return response.data.data;
}
