export type WhatsAppInstanceStatus =
  'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'BANNED' | 'DISABLED';

export interface WhatsAppFleetInstance {
  id: string;
  name: string;
  phoneNumber?: string | null;
  description?: string | null;
  status: WhatsAppInstanceStatus;
  qrCodeBase64?: string | null;
  maxPatients: number;
  active: boolean;
  patientCount: number;
  nutritionistCount: number;
  capacityPercentage: number;
  isNearCapacity: boolean;
  lastHeartbeatAt?: string | null;
  disconnectedAt?: string | null;
  createdAt: string;
}

export interface FleetSummary {
  totalInstances: number;
  connectedInstances: number;
  disconnectedInstances: number;
  totalAssignedPatients: number;
  totalCapacity: number;
  alertCount: number;
}

export interface CreateInstanceRequest {
  name: string;
  phoneNumber?: string;
  description?: string;
  maxPatients?: number;
}

export interface UpdateInstanceRequest {
  phoneNumber?: string;
  description?: string;
  maxPatients?: number;
  active?: boolean;
}

export interface InstanceQrCodeResponse {
  instanceId: string;
  instanceName: string;
  qrCodeBase64?: string | null;
  status: WhatsAppInstanceStatus;
  message: string;
}

export interface InstancePatient {
  id: string;
  name: string;
  whatsapp?: string | null;
  nutritionistId: string;
  status: string;
}
