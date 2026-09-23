import { ExtrasSection } from './ExtrasSection';
import { useAddExtra, useUpdateExtra, useDeleteExtra } from '../../stores/planStore';
import { useToastStore } from '../../stores/toastStore';
import { resolveMutationErrorMessage } from '../../stores/patientStore';
import type { PlanExtra } from '../../types/plan';

interface PlanExtrasTabProps {
  patientId: string;
  extras: PlanExtra[];
  isReadOnly: boolean;
  onReadOnlyClick: () => void;
}

export function PlanExtrasTab({
  patientId,
  extras,
  isReadOnly,
  onReadOnlyClick,
}: PlanExtrasTabProps) {
  const addExtra = useAddExtra(patientId);
  const updateExtra = useUpdateExtra(patientId);
  const deleteExtra = useDeleteExtra(patientId);

  const handleUpdate = (extraId: string, data: { name?: string; quantity?: string }) => {
    if (isReadOnly) {
      onReadOnlyClick();
      return;
    }
    updateExtra.mutate(
      { extraId, data },
      {
        onError: (err) => {
          const msg = resolveMutationErrorMessage(err, 'Erro ao atualizar item extra');
          useToastStore.getState().showError(msg);
        },
      },
    );
  };

  const handleAdd = () => {
    if (isReadOnly) {
      onReadOnlyClick();
      return;
    }
    addExtra.mutate(
      { name: '', quantity: '' },
      {
        onSuccess: () => {
          useToastStore.getState().showSuccess('Item extra adicionado com sucesso');
        },
        onError: (err) => {
          const msg = resolveMutationErrorMessage(err, 'Erro ao adicionar item extra');
          useToastStore.getState().showError(msg);
        },
      },
    );
  };

  const handleDelete = (extraId: string) => {
    if (isReadOnly) {
      onReadOnlyClick();
      return;
    }
    deleteExtra.mutate(extraId, {
      onSuccess: () => {
        useToastStore.getState().showSuccess('Item extra excluído com sucesso');
      },
      onError: (err) => {
        const msg = resolveMutationErrorMessage(err, 'Erro ao excluir item extra');
        useToastStore.getState().showError(msg);
      },
    });
  };

  return (
    <ExtrasSection
      extras={extras}
      onUpdateExtra={handleUpdate}
      onAddExtra={handleAdd}
      onDeleteExtra={handleDelete}
    />
  );
}
