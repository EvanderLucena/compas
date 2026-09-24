export type PrescriptionStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export type PrescriptionCategory =
  'SUPPLEMENT' | 'VITAMIN_MINERAL' | 'PHYTOTHERAPY' | 'MANIPULATED' | 'HABIT' | 'OTHER';

export interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  name: string;
  category: PrescriptionCategory;
  categoryLabel: string;
  dosage: string;
  form: string;
  timing: string;
  duration: string;
  isContinuous: boolean;
  instructions?: string | null;
  displayOrder: number;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  title: string;
  notes?: string | null;
  status: PrescriptionStatus;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
  items: PrescriptionItem[];
  totalItems: number;
  formattedSummary: string;
  whatsappMessage: string;
}

export interface PrescriptionCatalogItem {
  id: string;
  name: string;
  category: PrescriptionCategory;
  categoryLabel: string;
  defaultDosage: string;
  defaultForm: string;
  defaultTiming: string;
  defaultDuration: string;
  isContinuous: boolean;
  instructions: string;
  clinicalPurpose: string;
}

export interface PrescriptionItemInput {
  name: string;
  category: PrescriptionCategory;
  dosage: string;
  form: string;
  timing: string;
  duration?: string;
  isContinuous?: boolean;
  instructions?: string;
  displayOrder?: number;
}

export interface CreatePrescriptionDTO {
  title: string;
  notes?: string;
  status?: PrescriptionStatus;
  items: PrescriptionItemInput[];
}

export interface UpdatePrescriptionDTO {
  title: string;
  notes?: string;
  status?: PrescriptionStatus;
  items: PrescriptionItemInput[];
}
