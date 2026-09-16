import { apiClient } from './client';
import type {
  Extraction,
  ActivationLink,
  WhatsAppStatus,
  PatchExtractionPayload,
} from '../types/whatsapp';

export async function getExtractions(patientId: string, date?: string): Promise<Extraction[]> {
  const params = date ? { date } : undefined;
  const response = await apiClient.get<{ success: boolean; data: Extraction[] }>(
    `/patients/${patientId}/extractions`,
    { params },
  );
  return response.data.data;
}

export async function patchExtraction(
  patientId: string,
  extractionId: string,
  payload: PatchExtractionPayload,
): Promise<Extraction> {
  const response = await apiClient.patch<{ success: boolean; data: Extraction }>(
    `/patients/${patientId}/extractions/${extractionId}`,
    payload,
  );
  return response.data.data;
}

export async function getActivationLink(patientId: string): Promise<ActivationLink> {
  const response = await apiClient.get<{ success: boolean; data: ActivationLink }>(
    `/patients/${patientId}/activation-link`,
  );
  return response.data.data;
}

export async function getStatus(): Promise<WhatsAppStatus> {
  const response = await apiClient.get<{ success: boolean; data: WhatsAppStatus }>(
    '/whatsapp/status',
  );
  return response.data.data;
}
