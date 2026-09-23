import { create } from 'zustand';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminWhatsappApi } from '../api/adminWhatsapp';
import type {
  WhatsAppFleetInstance,
  WhatsAppInstanceStatus,
  InstanceQrCodeResponse,
  CreateInstanceRequest,
  UpdateInstanceRequest,
} from '../types/whatsappFleet';
import { useToastStore } from './toastStore';
import { resolveMutationErrorMessage } from './patientStore';

export type FleetModalType = 'create' | 'qr' | 'migrate' | 'edit' | 'patients' | null;

interface AdminWhatsappUIState {
  activeModal: FleetModalType;
  selectedInstance: WhatsAppFleetInstance | null;
  qrData: InstanceQrCodeResponse | null;
  isPollingQr: boolean;
  searchQuery: string;
  statusFilter: WhatsAppInstanceStatus | 'ALL';

  openCreateModal: () => void;
  openQrModal: (instance: WhatsAppFleetInstance) => void;
  openMigrateModal: (instance: WhatsAppFleetInstance) => void;
  openEditModal: (instance: WhatsAppFleetInstance) => void;
  openPatientsModal: (instance: WhatsAppFleetInstance) => void;
  closeModal: () => void;
  setQrData: (data: InstanceQrCodeResponse | null) => void;
  setIsPollingQr: (polling: boolean) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: WhatsAppInstanceStatus | 'ALL') => void;
}

export const useAdminWhatsappUIStore = create<AdminWhatsappUIState>()((set) => ({
  activeModal: null,
  selectedInstance: null,
  qrData: null,
  isPollingQr: false,
  searchQuery: '',
  statusFilter: 'ALL',

  openCreateModal: () => set({ activeModal: 'create', selectedInstance: null }),
  openQrModal: (instance) => set({ activeModal: 'qr', selectedInstance: instance, qrData: null }),
  openMigrateModal: (instance) => set({ activeModal: 'migrate', selectedInstance: instance }),
  openEditModal: (instance) => set({ activeModal: 'edit', selectedInstance: instance }),
  openPatientsModal: (instance) => set({ activeModal: 'patients', selectedInstance: instance }),
  closeModal: () =>
    set({
      activeModal: null,
      selectedInstance: null,
      qrData: null,
      isPollingQr: false,
    }),
  setQrData: (data) => set({ qrData: data }),
  setIsPollingQr: (polling) => set({ isPollingQr: polling }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (status) => set({ statusFilter: status }),
}));

// TanStack Query hook for Fleet Summary KPIs
export function useFleetSummary() {
  return useQuery({
    queryKey: ['admin-whatsapp-summary'],
    queryFn: async () => {
      const response = await adminWhatsappApi.getSummary();
      return response.data;
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

// TanStack Query hook for Fleet Instances list
export function useWhatsAppFleet() {
  return useQuery({
    queryKey: ['admin-whatsapp-instances'],
    queryFn: async () => {
      const response = await adminWhatsappApi.listInstances();
      return response.data;
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

// TanStack Query hook for patients bound to a specific instance
export function useInstancePatients(instanceId?: string | null, page = 0, size = 15) {
  return useQuery({
    queryKey: ['admin-whatsapp-instance-patients', instanceId, page, size],
    queryFn: async () => {
      if (!instanceId) throw new Error('ID da instância é obrigatório');
      const response = await adminWhatsappApi.listInstancePatients(instanceId, page, size);
      return response.data;
    },
    enabled: !!instanceId,
    staleTime: 30_000,
  });
}

// Mutation: Create a new instance / chip
export function useCreateFleetInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateInstanceRequest) => adminWhatsappApi.createInstance(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-instances'] });
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-summary'] });
      useToastStore.getState().showSuccess('Chip/instância cadastrado com sucesso!');
      useAdminWhatsappUIStore.getState().closeModal();
    },
    onError: (error) => {
      useToastStore
        .getState()
        .showError(resolveMutationErrorMessage(error, 'Erro ao criar instância WhatsApp'));
    },
  });
}

// Mutation: Update instance details
export function useUpdateFleetInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateInstanceRequest }) =>
      adminWhatsappApi.updateInstance(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-instances'] });
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-summary'] });
      useToastStore.getState().showSuccess('Instância atualizada com sucesso!');
      useAdminWhatsappUIStore.getState().closeModal();
    },
    onError: (error) => {
      useToastStore
        .getState()
        .showError(resolveMutationErrorMessage(error, 'Erro ao atualizar instância WhatsApp'));
    },
  });
}

// Mutation: Delete an instance
export function useDeleteFleetInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminWhatsappApi.deleteInstance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-instances'] });
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-summary'] });
      useToastStore.getState().showSuccess('Instância removida da frota.');
      useAdminWhatsappUIStore.getState().closeModal();
    },
    onError: (error) => {
      useToastStore
        .getState()
        .showError(resolveMutationErrorMessage(error, 'Erro ao remover instância'));
    },
  });
}

// Mutation: Connect instance (generates or fetches QR code)
export function useConnectFleetInstance() {
  return useMutation({
    mutationFn: (id: string) => adminWhatsappApi.connectInstance(id),
    onError: (error) => {
      useToastStore
        .getState()
        .showError(resolveMutationErrorMessage(error, 'Erro ao obter QR Code de conexão'));
    },
  });
}

// Mutation: Sync instance connection status from Evolution API
export function useSyncFleetInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminWhatsappApi.syncInstance(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-instances'] });
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-summary'] });
      if (res.data?.status === 'CONNECTED') {
        useToastStore.getState().showSuccess('Instância conectada ao WhatsApp!');
      }
    },
  });
}

// Mutation: Restart instance
export function useRestartFleetInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminWhatsappApi.restartInstance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-instances'] });
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-summary'] });
      useToastStore.getState().showSuccess('Instância reiniciada no gateway.');
    },
    onError: (error) => {
      useToastStore
        .getState()
        .showError(resolveMutationErrorMessage(error, 'Erro ao reiniciar instância'));
    },
  });
}

// Mutation: Disconnect instance
export function useDisconnectFleetInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminWhatsappApi.disconnectInstance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-instances'] });
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-summary'] });
      useToastStore.getState().showSuccess('Instância desconectada com sucesso.');
    },
    onError: (error) => {
      useToastStore
        .getState()
        .showError(resolveMutationErrorMessage(error, 'Erro ao desconectar instância'));
    },
  });
}

// Mutation: Migrate all patients from source to target instance
export function useMigrateFleetPatients() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceId, targetId }: { sourceId: string; targetId: string }) =>
      adminWhatsappApi.migratePatients(sourceId, targetId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-instances'] });
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-summary'] });
      useToastStore.getState().showSuccess(res.data?.message || 'Pacientes migrados com sucesso!');
      useAdminWhatsappUIStore.getState().closeModal();
    },
    onError: (error) => {
      useToastStore
        .getState()
        .showError(resolveMutationErrorMessage(error, 'Erro ao migrar pacientes'));
    },
  });
}
