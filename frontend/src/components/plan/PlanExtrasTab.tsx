import { ExtrasSection } from './ExtrasSection';
import { useAddExtra, useUpdateExtra, useDeleteExtra } from '../../stores/planStore';
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
    updateExtra.mutate({ extraId, data });
  };

  const handleAdd = () => {
    if (isReadOnly) {
      onReadOnlyClick();
      return;
    }
    addExtra.mutate({ name: '', quantity: '' });
  };

  const handleDelete = (extraId: string) => {
    if (isReadOnly) {
      onReadOnlyClick();
      return;
    }
    deleteExtra.mutate(extraId);
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
