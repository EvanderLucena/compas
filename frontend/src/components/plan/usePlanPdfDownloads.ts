import { useState } from 'react';
import { downloadPatientDocument } from '../../api/documents';
import { useToastStore } from '../../stores/toastStore';

export function usePlanPdfDownloads(patientId: string) {
  const [downloadingPlan, setDownloadingPlan] = useState(false);
  const [downloadingGrocery, setDownloadingGrocery] = useState(false);

  const handleDownloadPlanPdf = async () => {
    try {
      setDownloadingPlan(true);
      await downloadPatientDocument(patientId, 'meal-plan', `plano-alimentar-${patientId}.pdf`);
      useToastStore.getState().showSuccess('Plano alimentar em PDF baixado com sucesso!');
    } catch {
      useToastStore.getState().showError('Erro ao baixar o PDF do plano alimentar.');
    } finally {
      setDownloadingPlan(false);
    }
  };

  const handleDownloadGroceryPdf = async () => {
    try {
      setDownloadingGrocery(true);
      await downloadPatientDocument(patientId, 'grocery-list', `lista-compras-${patientId}.pdf`);
      useToastStore.getState().showSuccess('Lista de compras em PDF baixada com sucesso!');
    } catch {
      useToastStore.getState().showError('Erro ao baixar o PDF da lista de compras.');
    } finally {
      setDownloadingGrocery(false);
    }
  };

  return {
    downloadingPlan,
    downloadingGrocery,
    handleDownloadPlanPdf,
    handleDownloadGroceryPdf,
  };
}
