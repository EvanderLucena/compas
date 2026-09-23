import { describe, it, expect, beforeEach } from 'vitest';
import { useAdminWhatsappUIStore } from './adminWhatsappStore';
import type { WhatsAppFleetInstance } from '../types/whatsappFleet';

const mockInstance: WhatsAppFleetInstance = {
  id: 'inst-1',
  name: 'compas-chip-01',
  phoneNumber: '+5511999990001',
  description: 'Chip Principal',
  status: 'CONNECTED',
  maxPatients: 180,
  active: true,
  patientCount: 45,
  nutritionistCount: 3,
  capacityPercentage: 25,
  isNearCapacity: false,
  createdAt: '2026-09-22T00:00:00Z',
};

describe('adminWhatsappStore', () => {
  beforeEach(() => {
    useAdminWhatsappUIStore.getState().closeModal();
    useAdminWhatsappUIStore.getState().setSearchQuery('');
    useAdminWhatsappUIStore.getState().setStatusFilter('ALL');
  });

  it('has initial default state', () => {
    const state = useAdminWhatsappUIStore.getState();
    expect(state.activeModal).toBeNull();
    expect(state.selectedInstance).toBeNull();
    expect(state.qrData).toBeNull();
    expect(state.isPollingQr).toBe(false);
    expect(state.searchQuery).toBe('');
    expect(state.statusFilter).toBe('ALL');
  });

  it('opens and closes create modal', () => {
    useAdminWhatsappUIStore.getState().openCreateModal();
    expect(useAdminWhatsappUIStore.getState().activeModal).toBe('create');
    expect(useAdminWhatsappUIStore.getState().selectedInstance).toBeNull();

    useAdminWhatsappUIStore.getState().closeModal();
    expect(useAdminWhatsappUIStore.getState().activeModal).toBeNull();
  });

  it('opens QR modal with selected instance', () => {
    useAdminWhatsappUIStore.getState().openQrModal(mockInstance);
    expect(useAdminWhatsappUIStore.getState().activeModal).toBe('qr');
    expect(useAdminWhatsappUIStore.getState().selectedInstance).toEqual(mockInstance);
  });

  it('opens migrate modal with source instance', () => {
    useAdminWhatsappUIStore.getState().openMigrateModal(mockInstance);
    expect(useAdminWhatsappUIStore.getState().activeModal).toBe('migrate');
    expect(useAdminWhatsappUIStore.getState().selectedInstance?.id).toBe('inst-1');
  });

  it('opens edit and patients modal', () => {
    useAdminWhatsappUIStore.getState().openEditModal(mockInstance);
    expect(useAdminWhatsappUIStore.getState().activeModal).toBe('edit');

    useAdminWhatsappUIStore.getState().openPatientsModal(mockInstance);
    expect(useAdminWhatsappUIStore.getState().activeModal).toBe('patients');
  });

  it('updates search query and status filter', () => {
    useAdminWhatsappUIStore.getState().setSearchQuery('chip-02');
    expect(useAdminWhatsappUIStore.getState().searchQuery).toBe('chip-02');

    useAdminWhatsappUIStore.getState().setStatusFilter('CONNECTED');
    expect(useAdminWhatsappUIStore.getState().statusFilter).toBe('CONNECTED');
  });

  it('updates QR code response and polling flag', () => {
    const qrData = {
      instanceId: 'inst-1',
      instanceName: 'compas-chip-01',
      qrCodeBase64: 'abc123base64',
      status: 'CONNECTING' as const,
      message: 'QR Code gerado',
    };

    useAdminWhatsappUIStore.getState().setQrData(qrData);
    expect(useAdminWhatsappUIStore.getState().qrData).toEqual(qrData);

    useAdminWhatsappUIStore.getState().setIsPollingQr(true);
    expect(useAdminWhatsappUIStore.getState().isPollingQr).toBe(true);
  });
});
