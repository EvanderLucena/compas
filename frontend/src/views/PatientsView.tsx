import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { usePatientUIStore, usePatients } from '../stores/patientStore';
import { useAuthStore } from '../stores/authStore';
import {
  PatientsHeader,
  PatientsFilterBar,
  PatientsContent,
  PatientsModals,
  usePatientActions,
  usePatientFilters,
} from '../components/patients';
import { mapPatientFromApi } from '../types/patient';
import type { Patient } from '../types/patient';

export function PatientsView() {
  const navigate = useNavigate();
  const {
    searchQuery,
    statusFilter,
    currentPage,
    togglingPatientId,
    setSearchQuery,
    setStatusFilter,
    setCurrentPage,
    setNewPatientModalOpen,
    setTogglingPatientId,
  } = usePatientUIStore();

  const { data, isLoading, isError } = usePatients();
  const [mode, setMode] = useState<'table' | 'grid'>('table');
  const [filterOpen, setFilterOpen] = useState(false);

  const isReadOnly = useAuthStore((s) => Boolean(s.user?.readOnly));
  const openReadOnlyModal = useAuthStore((s) => s.openReadOnlyModal);

  const showInactive = statusFilter === 'inactive';
  const patientsList = useMemo<Patient[]>(() => data?.content.map(mapPatientFromApi) ?? [], [data]);
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const activePats = showInactive ? [] : patientsList;
  const activeFilters = !showInactive && statusFilter !== 'all' ? 1 : 0;

  const {
    createMutation,
    createPatientError,
    setCreatePatientError,
    toggleActive,
    confirmToggle,
    handleCreatePatient,
  } = usePatientActions({
    isReadOnly,
    openReadOnlyModal,
    setTogglingPatientId,
    togglingPatientId,
    patientsList,
    setNewPatientModalOpen,
  });

  const { handleSelectFilter, handleClearFilters, handleToggleInactive, handleSearchChange } =
    usePatientFilters({
      setStatusFilter,
      setCurrentPage,
      setSearchQuery,
      showInactive,
    });

  const handleOpen = useCallback((id: string) => navigate(`/patient/${id}`), [navigate]);

  const handleNewPatientClick = useCallback(() => {
    if (isReadOnly) {
      openReadOnlyModal();
      return;
    }
    setNewPatientModalOpen(true);
  }, [isReadOnly, openReadOnlyModal, setNewPatientModalOpen]);

  if (isError) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--coral)', marginBottom: 16 }}>Erro ao carregar pacientes.</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div>
      <PatientsHeader
        showInactive={showInactive}
        totalElements={totalElements}
        isLoading={isLoading}
        activePats={activePats}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        mode={mode}
        onModeChange={setMode}
        filterOpen={filterOpen}
        activeFilters={activeFilters}
        onToggleFilter={() => setFilterOpen((v) => !v)}
        onToggleInactive={handleToggleInactive}
        onNewPatient={handleNewPatientClick}
      />

      {filterOpen && !showInactive && (
        <PatientsFilterBar
          statusFilter={statusFilter}
          activeFilters={activeFilters}
          onSelectFilter={handleSelectFilter}
          onClearFilters={handleClearFilters}
        />
      )}

      <PatientsContent
        showInactive={showInactive}
        patientsList={patientsList}
        isLoading={isLoading}
        mode={mode}
        currentPage={currentPage}
        totalPages={totalPages}
        onOpen={handleOpen}
        onToggleActive={toggleActive}
        onPageChange={setCurrentPage}
      />

      <PatientsModals
        patientsList={patientsList}
        isCreating={createMutation.isPending}
        createPatientError={createPatientError}
        onClearCreateError={() => setCreatePatientError(null)}
        onCreatePatient={handleCreatePatient}
        onConfirmToggle={confirmToggle}
      />
    </div>
  );
}
