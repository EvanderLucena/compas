import { useCallback } from 'react';
import type { PatientStatus } from '../../types/patient';

interface UsePatientFiltersParams {
  setStatusFilter: (status: 'all' | 'inactive' | PatientStatus) => void;
  setCurrentPage: (page: number) => void;
  setSearchQuery: (q: string) => void;
  showInactive: boolean;
}

export function usePatientFilters({
  setStatusFilter,
  setCurrentPage,
  setSearchQuery,
  showInactive,
}: UsePatientFiltersParams) {
  const handleSelectFilter = useCallback(
    (key: 'all' | PatientStatus) => {
      setStatusFilter(key);
      setCurrentPage(0);
    },
    [setStatusFilter, setCurrentPage],
  );

  const handleClearFilters = useCallback(() => {
    setStatusFilter('all');
    setSearchQuery('');
    setCurrentPage(0);
  }, [setStatusFilter, setSearchQuery, setCurrentPage]);

  const handleToggleInactive = useCallback(() => {
    setStatusFilter(showInactive ? 'all' : 'inactive');
    setSearchQuery('');
    setCurrentPage(0);
  }, [showInactive, setStatusFilter, setSearchQuery, setCurrentPage]);

  const handleSearchChange = useCallback(
    (q: string) => {
      setSearchQuery(q);
      setCurrentPage(0);
    },
    [setSearchQuery, setCurrentPage],
  );

  return {
    handleSelectFilter,
    handleClearFilters,
    handleToggleInactive,
    handleSearchChange,
  };
}
