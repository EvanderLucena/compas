import { apiClient } from './client';
import type { ClinicalRadarData } from '../types/clinicalRadar';

export async function getClinicalRadar(): Promise<ClinicalRadarData> {
  const response = await apiClient.get<{ success: boolean; data: ClinicalRadarData }>(
    '/clinical-radar',
  );
  return response.data.data;
}

export async function resolveAttentionItem(messageId: string): Promise<void> {
  await apiClient.post(`/clinical-radar/attention/${messageId}/resolve`);
}
