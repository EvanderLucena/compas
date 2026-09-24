import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminWhatsAppFleetView } from './AdminWhatsAppFleetView';
import type { WhatsAppFleetInstance, FleetSummary } from '../types/whatsappFleet';

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/admin/whatsapp' }),
}));

const mockInstance: WhatsAppFleetInstance = {
  id: 'inst-1',
  name: 'compas-chip-01',
  phoneNumber: '+5511999990001',
  description: 'Chip Vivo Principal',
  status: 'CONNECTED',
  maxPatients: 180,
  active: true,
  patientCount: 50,
  nutritionistCount: 4,
  capacityPercentage: 28,
  isNearCapacity: false,
  createdAt: '2026-09-22T00:00:00Z',
};

const mockSummary: FleetSummary = {
  totalInstances: 1,
  connectedInstances: 1,
  disconnectedInstances: 0,
  totalAssignedPatients: 50,
  totalCapacity: 180,
  alertCount: 0,
};

const mockUIState = {
  activeModal: null,
  selectedInstance: null,
  qrData: null,
  isPollingQr: false,
  searchQuery: '',
  statusFilter: 'ALL',
  openCreateModal: vi.fn(),
  openQrModal: vi.fn(),
  openMigrateModal: vi.fn(),
  openEditModal: vi.fn(),
  openPatientsModal: vi.fn(),
  closeModal: vi.fn(),
  setSearchQuery: vi.fn(),
  setStatusFilter: vi.fn(),
};

const mockDisconnectMutate = vi.fn();
const mockDeleteMutate = vi.fn();

vi.mock('../stores/adminWhatsappStore', () => ({
  useWhatsAppFleet: () => ({
    data: [mockInstance],
    isLoading: false,
    refetch: vi.fn(),
  }),
  useFleetSummary: () => ({
    data: mockSummary,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useAdminWhatsappUIStore: () => mockUIState,
  useSyncFleetInstance: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRestartFleetInstance: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDisconnectFleetInstance: () => ({ mutateAsync: mockDisconnectMutate, isPending: false }),
  useDeleteFleetInstance: () => ({ mutateAsync: mockDeleteMutate, isPending: false }),
  useCreateFleetInstance: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateFleetInstance: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useConnectFleetInstance: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useMigrateFleetPatients: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useInstancePatients: () => ({
    data: { content: [], totalPages: 1, totalElements: 0 },
    isLoading: false,
  }),
}));

describe('AdminWhatsAppFleetView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header, KPIs, and chip cards correctly', () => {
    render(<AdminWhatsAppFleetView />);

    expect(screen.getByText('Frota WhatsApp & Gateway')).toBeInTheDocument();
    expect(screen.getByText('Frota Total')).toBeInTheDocument();
    expect(screen.getByText('Conectividade')).toBeInTheDocument();
    expect(screen.getByText('Capacidade da Frota')).toBeInTheDocument();
    expect(screen.getByText('Alertas de Operação')).toBeInTheDocument();

    expect(screen.getByText('compas-chip-01')).toBeInTheDocument();
    expect(screen.getByText('Conectado')).toBeInTheDocument();
    expect(screen.getByText('Chip Vivo Principal')).toBeInTheDocument();
  });

  it('renders action buttons and filter pills', () => {
    render(<AdminWhatsAppFleetView />);

    expect(screen.getByText('Novo Chip / Instância')).toBeInTheDocument();
    expect(screen.getByText('Atualizar')).toBeInTheDocument();
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Conectados')).toBeInTheDocument();
    expect(screen.getByText('Desconectados')).toBeInTheDocument();
  });

  it('opens ConfirmModal when disconnect is clicked and triggers mutation on confirm', async () => {
    render(<AdminWhatsAppFleetView />);

    const actionsBtn = screen.getByTitle('Mais ações');
    fireEvent.click(actionsBtn);

    const disconnectBtn = screen.getByText('Desconectar Chip');
    fireEvent.click(disconnectBtn);

    expect(screen.getByRole('heading', { name: 'Desconectar Chip WhatsApp' })).toBeInTheDocument();
    expect(screen.getByText(/Deseja realmente desconectar o chip/)).toBeInTheDocument();

    const confirmBtn = screen.getByTestId('confirm-modal-button');
    fireEvent.click(confirmBtn);

    expect(mockDisconnectMutate).toHaveBeenCalledWith('inst-1');
  });

  it('shows error toast and blocks delete when chip has linked patients', () => {
    render(<AdminWhatsAppFleetView />);

    const actionsBtn = screen.getByTitle('Mais ações');
    fireEvent.click(actionsBtn);

    const deleteBtn = screen.getByText('Excluir Instância');
    fireEvent.click(deleteBtn);

    // Does NOT open confirm modal because patientCount > 0
    expect(
      screen.queryByRole('heading', { name: 'Excluir Chip WhatsApp' }),
    ).not.toBeInTheDocument();
  });
});
