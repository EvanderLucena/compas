import { apiClient } from './client';
import type { PatientApiResponse, PatientListApiResponse, PatientStatus } from '../types/patient';

export interface CreatePatientRequest {
  name: string;
  birthDate?: string;
  sex?: string;
  heightCm?: number;
  whatsapp?: string;
  objective: string;
  weight?: number;
  terms: boolean;
}

export interface UpdatePatientRequest {
  name?: string;
  birthDate?: string;
  sex?: string;
  heightCm?: number;
  whatsapp?: string;
  objective?: string;
  status?: PatientStatus;
  weight?: number;
  weightDelta?: number;
  adherence?: number;
  tag?: string;
}

interface ListParams {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  objective?: string;
  active?: boolean;
}

export async function listPatients(params: ListParams = {}): Promise<PatientListApiResponse> {
  const response = await apiClient.get<{ success: boolean; data: PatientListApiResponse }>(
    '/patients',
    { params },
  );
  return response.data.data;
}

export async function createPatient(data: CreatePatientRequest): Promise<PatientApiResponse> {
  const response = await apiClient.post<{ success: boolean; data: PatientApiResponse }>(
    '/patients',
    data,
  );
  return response.data.data;
}

export async function getPatient(id: string): Promise<PatientApiResponse> {
  const response = await apiClient.get<{ success: boolean; data: PatientApiResponse }>(
    `/patients/${id}`,
  );
  return response.data.data;
}

export async function updatePatient(
  id: string,
  data: UpdatePatientRequest,
): Promise<PatientApiResponse> {
  const response = await apiClient.patch<{ success: boolean; data: PatientApiResponse }>(
    `/patients/${id}`,
    {
      ...data,
      status: data.status ? data.status.toUpperCase() : undefined,
    },
  );
  return response.data.data;
}

export async function deactivatePatient(id: string): Promise<PatientApiResponse> {
  const response = await apiClient.patch<{ success: boolean; data: PatientApiResponse }>(
    `/patients/${id}/deactivate`,
  );
  return response.data.data;
}

export async function reactivatePatient(id: string): Promise<PatientApiResponse> {
  const response = await apiClient.patch<{ success: boolean; data: PatientApiResponse }>(
    `/patients/${id}/reactivate`,
  );
  return response.data.data;
}

export async function getConsumptionPatterns(
  id: string,
): Promise<import('../types/patient').PatientConsumptionPatterns> {
  const response = await apiClient.get<{
    success: boolean;
    data: import('../types/patient').PatientConsumptionPatterns;
  }>(`/patients/${id}/consumption-patterns`);
  return response.data.data;
}

export async function evaluateAdherence(
  id: string,
): Promise<{ suggestedStatus: PatientStatus; clinicalInsight: string }> {
  const response = await apiClient.post<{
    success: boolean;
    data: { suggestedStatus: PatientStatus; clinicalInsight: string };
  }>(`/patients/${id}/evaluate-adherence`);
  return response.data.data;
}
