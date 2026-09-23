import { apiClient } from './client';
import type { ApiResponse } from '../types';
import type {
  WhatsAppFleetInstance,
  FleetSummary,
  CreateInstanceRequest,
  UpdateInstanceRequest,
  InstanceQrCodeResponse,
  InstancePatient,
} from '../types/whatsappFleet';

export const adminWhatsappApi = {
  async listInstances(): Promise<ApiResponse<WhatsAppFleetInstance[]>> {
    const res = await apiClient.get<ApiResponse<WhatsAppFleetInstance[]>>(
      '/admin/whatsapp/instances',
    );
    return res.data;
  },

  async getSummary(): Promise<ApiResponse<FleetSummary>> {
    const res = await apiClient.get<ApiResponse<FleetSummary>>('/admin/whatsapp/summary');
    return res.data;
  },

  async createInstance(req: CreateInstanceRequest): Promise<ApiResponse<WhatsAppFleetInstance>> {
    const res = await apiClient.post<ApiResponse<WhatsAppFleetInstance>>(
      '/admin/whatsapp/instances',
      req,
    );
    return res.data;
  },

  async updateInstance(
    id: string,
    req: UpdateInstanceRequest,
  ): Promise<ApiResponse<WhatsAppFleetInstance>> {
    const res = await apiClient.put<ApiResponse<WhatsAppFleetInstance>>(
      `/admin/whatsapp/instances/${id}`,
      req,
    );
    return res.data;
  },

  async deleteInstance(id: string): Promise<ApiResponse<{ message: string }>> {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/admin/whatsapp/instances/${id}`,
    );
    return res.data;
  },

  async connectInstance(id: string): Promise<ApiResponse<InstanceQrCodeResponse>> {
    const res = await apiClient.post<ApiResponse<InstanceQrCodeResponse>>(
      `/admin/whatsapp/instances/${id}/connect`,
    );
    return res.data;
  },

  async syncInstance(id: string): Promise<ApiResponse<WhatsAppFleetInstance>> {
    const res = await apiClient.post<ApiResponse<WhatsAppFleetInstance>>(
      `/admin/whatsapp/instances/${id}/sync`,
    );
    return res.data;
  },

  async restartInstance(id: string): Promise<ApiResponse<{ message: string }>> {
    const res = await apiClient.post<ApiResponse<{ message: string }>>(
      `/admin/whatsapp/instances/${id}/restart`,
    );
    return res.data;
  },

  async disconnectInstance(id: string): Promise<ApiResponse<{ message: string }>> {
    const res = await apiClient.post<ApiResponse<{ message: string }>>(
      `/admin/whatsapp/instances/${id}/disconnect`,
    );
    return res.data;
  },

  async migratePatients(
    sourceId: string,
    targetId: string,
  ): Promise<ApiResponse<{ message: string; migratedCount: number }>> {
    const res = await apiClient.post<ApiResponse<{ message: string; migratedCount: number }>>(
      `/admin/whatsapp/instances/${sourceId}/migrate`,
      { targetInstanceId: targetId },
    );
    return res.data;
  },

  async listInstancePatients(
    id: string,
    page = 0,
    size = 20,
  ): Promise<
    ApiResponse<{ content: InstancePatient[]; totalPages: number; totalElements: number }>
  > {
    const res = await apiClient.get<
      ApiResponse<{ content: InstancePatient[]; totalPages: number; totalElements: number }>
    >(`/admin/whatsapp/instances/${id}/patients`, { params: { page, size } });
    return res.data;
  },
};
