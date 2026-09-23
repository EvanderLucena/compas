import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadPatientDocument, openPatientDocumentPreview } from './documents';
import { apiClient } from './client';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('documents API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('downloadPatientDocument fetches blob and triggers link download', async () => {
    const dummyBlob = new Blob(['%PDF-1.4 test'], { type: 'application/pdf' });
    vi.mocked(apiClient.get).mockResolvedValue({ data: dummyBlob });

    const createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost/123');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    await downloadPatientDocument('patient-123', 'meal-plan', 'plano-alimentar.pdf');

    expect(apiClient.get).toHaveBeenCalledWith('/patients/patient-123/documents/meal-plan/pdf', {
      responseType: 'blob',
    });
    expect(createObjectURLMock).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/123');
  });

  it('openPatientDocumentPreview fetches blob and calls window.open', async () => {
    const dummyBlob = new Blob(['%PDF-1.4 test'], { type: 'application/pdf' });
    vi.mocked(apiClient.get).mockResolvedValue({ data: dummyBlob });

    const createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost/456');
    window.URL.createObjectURL = createObjectURLMock;

    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    await openPatientDocumentPreview('patient-123', 'grocery-list');

    expect(apiClient.get).toHaveBeenCalledWith('/patients/patient-123/documents/grocery-list/pdf', {
      responseType: 'blob',
    });
    expect(windowOpenSpy).toHaveBeenCalledWith('blob:http://localhost/456', '_blank');
  });
});
