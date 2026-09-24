import { apiClient } from './client';
import type {
  Prescription,
  PrescriptionCatalogItem,
  CreatePrescriptionDTO,
  UpdatePrescriptionDTO,
} from '../types/prescription';

export async function listPrescriptions(patientId: string): Promise<Prescription[]> {
  const response = await apiClient.get<{ success: boolean; data: Prescription[] }>(
    `/patients/${patientId}/prescriptions`,
  );
  return response.data.data;
}

export async function getActivePrescription(patientId: string): Promise<Prescription | null> {
  const response = await apiClient.get<{ success: boolean; data: Prescription | null }>(
    `/patients/${patientId}/prescriptions/active`,
  );
  return response.data.data;
}

export async function getPrescriptionCatalog(
  patientId: string,
): Promise<PrescriptionCatalogItem[]> {
  const response = await apiClient.get<{ success: boolean; data: PrescriptionCatalogItem[] }>(
    `/patients/${patientId}/prescriptions/catalog`,
  );
  return response.data.data;
}

export async function getPrescription(
  patientId: string,
  prescriptionId: string,
): Promise<Prescription> {
  const response = await apiClient.get<{ success: boolean; data: Prescription }>(
    `/patients/${patientId}/prescriptions/${prescriptionId}`,
  );
  return response.data.data;
}

export async function createPrescription(
  patientId: string,
  data: CreatePrescriptionDTO,
): Promise<Prescription> {
  const response = await apiClient.post<{ success: boolean; data: Prescription }>(
    `/patients/${patientId}/prescriptions`,
    data,
  );
  return response.data.data;
}

export async function updatePrescription(
  patientId: string,
  prescriptionId: string,
  data: UpdatePrescriptionDTO,
): Promise<Prescription> {
  const response = await apiClient.put<{ success: boolean; data: Prescription }>(
    `/patients/${patientId}/prescriptions/${prescriptionId}`,
    data,
  );
  return response.data.data;
}

export async function deletePrescription(patientId: string, prescriptionId: string): Promise<void> {
  await apiClient.delete(`/patients/${patientId}/prescriptions/${prescriptionId}`);
}

export async function downloadPrescriptionPdf(
  patientId: string,
  prescriptionId: string,
  filename: string = 'receituario-suplementacao.pdf',
): Promise<void> {
  const response = await apiClient.get<Blob>(
    `/patients/${patientId}/prescriptions/${prescriptionId}/pdf`,
    { responseType: 'blob' },
  );

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
