import { apiClient } from './client';

export type DocumentType = 'meal-plan' | 'grocery-list' | 'biometry';

/**
 * Download a generated patient document PDF.
 * Uses blob response to stream the PDF directly from the authenticated API.
 */
export async function downloadPatientDocument(
  patientId: string,
  type: DocumentType,
  fallbackFilename: string,
): Promise<void> {
  const response = await apiClient.get<Blob>(`/patients/${patientId}/documents/${type}/pdf`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fallbackFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Open a generated patient document PDF directly in a new browser tab for preview/printing.
 */
export async function openPatientDocumentPreview(
  patientId: string,
  type: DocumentType,
): Promise<void> {
  const response = await apiClient.get<Blob>(`/patients/${patientId}/documents/${type}/pdf`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const previewUrl = window.URL.createObjectURL(blob);
  window.open(previewUrl, '_blank');
}
