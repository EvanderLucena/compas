import type { ComponentProps } from 'react';
import { usePatientUIStore } from '../../stores/patientStore';
import { NewPatientModal } from './NewPatientModal';
import { EditPatientModal } from './EditPatientModal';
import { TogglePatientModal } from './TogglePatientModal';
import type { Patient } from '../../types/patient';

type CreatePatientData = Parameters<
  NonNullable<ComponentProps<typeof NewPatientModal>['onSave']>
>[0];

interface PatientsModalsProps {
  patientsList: Patient[];
  isCreating: boolean;
  createPatientError: string | null;
  onClearCreateError: () => void;
  onCreatePatient: (data: CreatePatientData) => void;
  onConfirmToggle: () => void;
}

export function PatientsModals({
  patientsList,
  isCreating,
  createPatientError,
  onClearCreateError,
  onCreatePatient,
  onConfirmToggle,
}: PatientsModalsProps) {
  const {
    newPatientModalOpen,
    setNewPatientModalOpen,
    editingPatientId,
    setEditingPatientId,
    togglingPatientId,
    setTogglingPatientId,
  } = usePatientUIStore();

  const editingPatient = editingPatientId
    ? patientsList.find((p) => p.id === editingPatientId)
    : null;
  const togglingPatient = togglingPatientId
    ? patientsList.find((p) => p.id === togglingPatientId)
    : null;

  return (
    <>
      <NewPatientModal
        open={newPatientModalOpen}
        onClose={() => {
          onClearCreateError();
          setNewPatientModalOpen(false);
        }}
        isSubmitting={isCreating}
        errorMessage={createPatientError}
        onSave={onCreatePatient}
      />
      {editingPatient && (
        <EditPatientModal
          patient={editingPatient}
          open={Boolean(editingPatientId)}
          onClose={() => setEditingPatientId(null)}
        />
      )}
      {togglingPatient && (
        <TogglePatientModal
          name={togglingPatient.name}
          activating={!togglingPatient.active}
          onClose={() => setTogglingPatientId(null)}
          onConfirm={onConfirmToggle}
        />
      )}
    </>
  );
}
