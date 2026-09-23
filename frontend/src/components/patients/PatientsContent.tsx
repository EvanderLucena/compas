import { PatientTable } from './PatientTable';
import { PatientGrid } from './PatientGrid';
import { Pagination } from './Pagination';
import type { Patient } from '../../types/patient';

interface PatientsContentProps {
  showInactive: boolean;
  patientsList: Patient[];
  isLoading: boolean;
  mode: 'table' | 'grid';
  currentPage: number;
  totalPages: number;
  onOpen: (id: string) => void;
  onToggleActive: (id: string) => void;
  onPageChange: (page: number) => void;
}

export function PatientsContent({
  showInactive,
  patientsList,
  isLoading,
  mode,
  currentPage,
  totalPages,
  onOpen,
  onToggleActive,
  onPageChange,
}: PatientsContentProps) {
  if (showInactive && patientsList.length === 0 && !isLoading) {
    return (
      <div
        style={{
          padding: '60px 0',
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--fg-subtle)',
        }}
      >
        Nenhum paciente inativo no momento.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        style={{
          padding: '40px 0',
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--fg-subtle)',
        }}
      >
        Carregando...
      </div>
    );
  }

  return (
    <>
      {mode === 'table' || showInactive ? (
        <PatientTable patients={patientsList} onOpen={onOpen} onToggleActive={onToggleActive} />
      ) : (
        <PatientGrid patients={patientsList} onOpen={onOpen} onToggleActive={onToggleActive} />
      )}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
    </>
  );
}
