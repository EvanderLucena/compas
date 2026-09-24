import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as rxApi from '../api/prescription';
import type { CreatePrescriptionDTO, UpdatePrescriptionDTO } from '../types/prescription';
import { useToastStore } from './toastStore';

export function usePrescriptions(patientId: string | null) {
  return useQuery({
    queryKey: ['prescriptions', patientId],
    queryFn: () => {
      if (!patientId) throw new Error('Patient ID is required');
      return rxApi.listPrescriptions(patientId);
    },
    enabled: !!patientId,
  });
}

export function useActivePrescription(patientId: string | null) {
  return useQuery({
    queryKey: ['active-prescription', patientId],
    queryFn: () => {
      if (!patientId) throw new Error('Patient ID is required');
      return rxApi.getActivePrescription(patientId);
    },
    enabled: !!patientId,
  });
}

export function usePrescriptionCatalog(patientId: string | null) {
  return useQuery({
    queryKey: ['prescription-catalog', patientId],
    queryFn: () => {
      if (!patientId) throw new Error('Patient ID is required');
      return rxApi.getPrescriptionCatalog(patientId);
    },
    enabled: !!patientId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useCreatePrescription(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePrescriptionDTO) => rxApi.createPrescription(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions', patientId] });
      queryClient.invalidateQueries({ queryKey: ['active-prescription', patientId] });
      useToastStore.getState().showSuccess('Prescrição criada com sucesso!');
    },
    onError: () => {
      useToastStore.getState().showError('Falha ao salvar prescrição. Tente novamente.');
    },
  });
}

export function useUpdatePrescription(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      prescriptionId,
      data,
    }: {
      prescriptionId: string;
      data: UpdatePrescriptionDTO;
    }) => rxApi.updatePrescription(patientId, prescriptionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions', patientId] });
      queryClient.invalidateQueries({ queryKey: ['active-prescription', patientId] });
      useToastStore.getState().showSuccess('Prescrição atualizada com sucesso!');
    },
    onError: () => {
      useToastStore.getState().showError('Falha ao atualizar prescrição. Tente novamente.');
    },
  });
}

export function useDeletePrescription(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prescriptionId: string) => rxApi.deletePrescription(patientId, prescriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions', patientId] });
      queryClient.invalidateQueries({ queryKey: ['active-prescription', patientId] });
      useToastStore.getState().showSuccess('Prescrição excluída.');
    },
    onError: () => {
      useToastStore.getState().showError('Falha ao excluir prescrição.');
    },
  });
}
