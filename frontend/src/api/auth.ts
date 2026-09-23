import { apiClient } from './client';
import type { LoginRequest, SignupRequest, AuthResponse, MeResponse } from '../types';

export async function signup(data: SignupRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/signup', data);
  return response.data;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', data);
  return response.data;
}

export async function refreshAuth(): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/refresh');
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function getCurrentUser(): Promise<MeResponse> {
  const response = await apiClient.get<MeResponse>('/auth/me');
  return response.data;
}

export async function completeOnboarding(): Promise<void> {
  await apiClient.post('/auth/onboarding');
}

export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    '/auth/verify-email',
    { token },
  );
  return response.data;
}

export async function resendVerification(
  email?: string,
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    '/auth/resend-verification',
    email ? { email } : {},
  );
  return response.data;
}
