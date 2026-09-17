import { create } from 'zustand';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as patientApi from '../api/patients';
import type { ApiResponse, FieldError } from '../types';
import type { PatientStatus, ObjectiveOption } from '../types/patient';
import { useToastStore } from './toastStore';

// Zustand store for client-side UI state (filters, modals, selection)
interface PatientUIState {
  searchQuery: string;
  statusFilter: PatientStatus | 'all' | 'inactive';
  objectiveFilter: ObjectiveOption | 'all';
  currentPage: number;
  pageSize: number;
  newPatientModalOpen: boolean;
  editingPatientId: string | null;
  togglingPatientId: string | null;
  setSearchQuery: (q: string) => void;
  setStatusFilter: (f: PatientStatus | 'all' | 'inactive') => void;
  setObjectiveFilter: (o: ObjectiveOption | 'all') => void;
  setCurrentPage: (p: number) => void;
  setNewPatientModalOpen: (open: boolean) => void;
  setEditingPatientId: (id: string | null) => void;
  setTogglingPatientId: (id: string | null) => void;
}

export const usePatientUIStore = create<PatientUIState>()((set) => ({
  searchQuery: '',
  statusFilter: 'all',
  objectiveFilter: 'all',
  currentPage: 0,
  pageSize: 10,
  newPatientModalOpen: false,
  editingPatientId: null,
  togglingPatientId: null,
  setSearchQuery: (q) => set({ searchQuery: q, currentPage: 0 }),
  setStatusFilter: (f) => set({ statusFilter: f, currentPage: 0 }),
  setObjectiveFilter: (o) => set({ objectiveFilter: o, currentPage: 0 }),
  setCurrentPage: (p) => set({ currentPage: p }),
  setNewPatientModalOpen: (open) => set({ newPatientModalOpen: open }),
  setEditingPatientId: (id) => set({ editingPatientId: id }),
  setTogglingPatientId: (id) => set({ togglingPatientId: id }),
}));

type ApiErrorPayload = ApiResponse<null> & { errors?: FieldError[] };

function pickErrorMessage(payload: ApiErrorPayload | undefined): string | undefined {
  if (!payload) return undefined;
  const fieldMessage = payload.errors?.[0]?.message;
  if (fieldMessage) return fieldMessage;
  return payload.message;
}

export function resolveMutationErrorMessage(error: unknown, fallbackMessage: string) {
  if (!error || typeof error !== 'object') {
    return fallbackMessage;
  }
  const apiError = error as ApiErrorPayload & {
    response?: { data?: ApiErrorPayload };
  };
  return pickErrorMessage(apiError.response?.data) ?? pickErrorMessage(apiError) ?? fallbackMessage;
}

// TanStack Query hook for patient list
export function usePatients() {
  const { searchQuery, statusFilter, objectiveFilter, currentPage, pageSize } = usePatientUIStore();

  const active = statusFilter === 'inactive' ? false : statusFilter === 'all' ? undefined : true;

  return useQuery({
    queryKey: ['patients', searchQuery, statusFilter, objectiveFilter, currentPage, pageSize],
    queryFn: () =>
      patientApi.listPatients({
        page: currentPage,
        size: pageSize,
        search: searchQuery || undefined,
        status:
          statusFilter !== 'all' && statusFilter !== 'inactive'
            ? statusFilter.toUpperCase()
            : undefined,
        objective: objectiveFilter !== 'all' ? objectiveFilter : undefined,
        active,
      }),
    retry: 1,
    placeholderData: (previousData) => previousData,
  });
}

// TanStack Query hook for single patient
export function usePatient(id: string | null) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: () => {
      if (!id) throw new Error('Patient ID is required');
      return patientApi.getPatient(id);
    },
    enabled: !!id,
  });
}

// Mutation hook for create
export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patientApi.createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
    onError: (error) => {
      useToastStore
        .getState()
        .showError(resolveMutationErrorMessage(error, 'Erro ao criar paciente — tente novamente'));
    },
  });
}

// Mutation hook for update
export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: patientApi.UpdatePatientRequest }) =>
      patientApi.updatePatient(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
    },
    onError: () => {
      useToastStore.getState().showError('Erro ao atualizar paciente — tente novamente');
    },
  });
}

// Mutation hook for deactivate
export function useDeactivatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patientApi.deactivatePatient,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
    },
    onError: () => {
      useToastStore.getState().showError('Erro ao desativar paciente — tente novamente');
    },
  });
}

// Mutation hook for reactivate
export function useReactivatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patientApi.reactivatePatient,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
    },
    onError: () => {
      useToastStore.getState().showError('Erro ao reativar paciente — tente novamente');
    },
  });
}
