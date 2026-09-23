import { useState, useCallback } from 'react';
import type { ComponentProps } from 'react';
import {
  useCreatePatient,
  useDeactivatePatient,
  useReactivatePatient,
  resolveMutationErrorMessage,
} from '../../stores/patientStore';
import { useToastStore } from '../../stores/toastStore';
import type { NewPatientModal } from './NewPatientModal';
import type { Patient } from '../../types/patient';

type CreatePatientData = Parameters<
  NonNullable<ComponentProps<typeof NewPatientModal>['onSave']>
>[0];

interface UsePatientActionsParams {
  isReadOnly: boolean;
  openReadOnlyModal: () => void;
  setTogglingPatientId: (id: string | null) => void;
  togglingPatientId: string | null;
  patientsList: Patient[];
  setNewPatientModalOpen: (open: boolean) => void;
}

export function usePatientActions({
  isReadOnly,
  openReadOnlyModal,
  setTogglingPatientId,
  togglingPatientId,
  patientsList,
  setNewPatientModalOpen,
}: UsePatientActionsParams) {
  const createMutation = useCreatePatient();
  const deactivateMutation = useDeactivatePatient();
  const reactivateMutation = useReactivatePatient();
  const [createPatientError, setCreatePatientError] = useState<string | null>(null);

  const toggleActive = useCallback(
    (id: string) => {
      if (isReadOnly) {
        openReadOnlyModal();
        return;
      }
      setTogglingPatientId(id);
    },
    [isReadOnly, openReadOnlyModal, setTogglingPatientId],
  );

  const confirmToggle = useCallback(() => {
    if (!togglingPatientId) return;
    const patient = patientsList.find((p) => p.id === togglingPatientId);
    if (!patient) return;
    if (patient.active) {
      deactivateMutation.mutate(togglingPatientId, {
        onSuccess: () => setTogglingPatientId(null),
      });
    } else {
      reactivateMutation.mutate(togglingPatientId, {
        onSuccess: () => setTogglingPatientId(null),
      });
    }
  }, [
    togglingPatientId,
    patientsList,
    deactivateMutation,
    reactivateMutation,
    setTogglingPatientId,
  ]);

  const handleCreatePatient = useCallback(
    (data: CreatePatientData) => {
      setCreatePatientError(null);
      createMutation.mutate(data, {
        onSuccess: () => {
          useToastStore.getState().showSuccess('Paciente cadastrado com sucesso');
          setCreatePatientError(null);
          setNewPatientModalOpen(false);
        },
        onError: (err) => {
          const msg = resolveMutationErrorMessage(
            err,
            'Erro ao cadastrar paciente — tente novamente',
          );
          setCreatePatientError(msg);
          useToastStore.getState().showError(msg);
        },
      });
    },
    [createMutation, setNewPatientModalOpen],
  );

  return {
    createMutation,
    createPatientError,
    setCreatePatientError,
    toggleActive,
    confirmToggle,
    handleCreatePatient,
  };
}
