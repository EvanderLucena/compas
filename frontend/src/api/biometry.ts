import { apiClient } from './client';
import type {
  BiometryAssessmentDTO,
  CreateBiometryAssessmentRequest,
  UpdateBiometryAssessmentRequest,
  HistoryEpisodeListItem,
  HistorySnapshot,
} from '../types/patient';
import type { BiometryEvolutionSummary, BiometryComparisonData } from '../types/biometry';

export async function listBiometryAssessments(patientId: string): Promise<BiometryAssessmentDTO[]> {
  const response = await apiClient.get<{ success: boolean; data: BiometryAssessmentDTO[] }>(
    `/patients/${patientId}/biometry`,
  );
  return response.data.data;
}

export async function createBiometryAssessment(
  patientId: string,
  data: CreateBiometryAssessmentRequest,
): Promise<BiometryAssessmentDTO> {
  const response = await apiClient.post<{ success: boolean; data: BiometryAssessmentDTO }>(
    `/patients/${patientId}/biometry`,
    data,
  );
  return response.data.data;
}

export async function updateBiometryAssessment(
  patientId: string,
  assessmentId: string,
  data: UpdateBiometryAssessmentRequest,
): Promise<BiometryAssessmentDTO> {
  const response = await apiClient.patch<{ success: boolean; data: BiometryAssessmentDTO }>(
    `/patients/${patientId}/biometry/${assessmentId}`,
    data,
  );
  return response.data.data;
}

export async function listHistoryEpisodes(patientId: string): Promise<HistoryEpisodeListItem[]> {
  const response = await apiClient.get<{ success: boolean; data: HistoryEpisodeListItem[] }>(
    `/patients/${patientId}/biometry/history/episodes`,
  );
  return response.data.data;
}

export async function getHistorySnapshot(
  patientId: string,
  episodeId: string,
): Promise<HistorySnapshot> {
  const response = await apiClient.get<{ success: boolean; data: HistorySnapshot }>(
    `/patients/${patientId}/biometry/history/episodes/${episodeId}`,
  );
  return response.data.data;
}

export async function getBiometryEvolutionSummary(
  patientId: string,
): Promise<BiometryEvolutionSummary> {
  const response = await apiClient.get<{ success: boolean; data: BiometryEvolutionSummary }>(
    `/patients/${patientId}/biometry/evolution-summary`,
  );
  return response.data.data;
}

export async function getBiometryComparison(
  patientId: string,
  baseId?: string,
  targetId?: string,
): Promise<BiometryComparisonData> {
  const params = new URLSearchParams();
  if (baseId) params.append('baseId', baseId);
  if (targetId) params.append('targetId', targetId);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const response = await apiClient.get<{ success: boolean; data: BiometryComparisonData }>(
    `/patients/${patientId}/biometry/compare${qs}`,
  );
  return response.data.data;
}
