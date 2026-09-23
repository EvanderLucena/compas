import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HomeView } from './HomeView';
import type { PatientApiResponse } from '../types/patient';

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

let mockUser = { id: 'u1', name: 'Dra. Camila Santos', email: 'camila@nutri.com' };
vi.mock('../stores/authStore', () => ({
  useAuthStore: (selector: (s: { user: typeof mockUser | null }) => unknown) =>
    selector({ user: mockUser }),
}));

let mockPatientsData: { content: PatientApiResponse[]; totalElements: number } | null = null;
let mockIsPatientsLoading = false;
let mockIsPatientsError = false;

vi.mock('../stores/patientStore', () => ({
  usePatients: () => ({
    data: mockPatientsData,
    isLoading: mockIsPatientsLoading,
    isError: mockIsPatientsError,
  }),
}));

let mockDashboardData: {
  kpis: {
    activePatients: number;
    averageAdherence: number;
    assessedInLast30Days: number;
    onTrackPatients: number;
    attentionPatients: number;
    criticalPatients: number;
  };
} | null = null;
let mockIsDashboardLoading = false;
let mockIsDashboardError = false;

vi.mock('../stores/clinicalStore', () => ({
  useDashboard: () => ({
    data: mockDashboardData,
    isLoading: mockIsDashboardLoading,
    isError: mockIsDashboardError,
  }),
}));

let mockWhatsappStatus: {
  extractionsToday: number;
  activePatientsCount: number;
} | null = null;
let mockIsWhatsappLoading = false;

vi.mock('../stores/whatsappStore', () => ({
  useWhatsAppStatus: () => ({
    data: mockWhatsappStatus,
    isLoading: mockIsWhatsappLoading,
  }),
}));

describe('HomeView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 'u1', name: 'Camila Santos', email: 'camila@nutri.com' };
    mockPatientsData = {
      content: [
        {
          id: 'p1',
          name: 'Ana Silva',
          initials: 'AS',
          age: 28,
          birthDate: '1995-05-12',
          sex: 'F',
          heightCm: 165,
          whatsapp: '11999998888',
          objective: 'Hipertrofia',
          status: 'ONTRACK',
          adherence: 92,
          weight: 62.5,
          weightDelta: -2.5,
          tag: 'G1',
          active: true,
        },
      ],
      totalElements: 1,
    };
    mockIsPatientsLoading = false;
    mockIsPatientsError = false;
    mockDashboardData = {
      kpis: {
        activePatients: 1,
        averageAdherence: 92,
        assessedInLast30Days: 1,
        onTrackPatients: 1,
        attentionPatients: 0,
        criticalPatients: 0,
      },
    };
    mockIsDashboardLoading = false;
    mockIsDashboardError = false;
    mockWhatsappStatus = {
      extractionsToday: 4,
      activePatientsCount: 1,
    };
    mockIsWhatsappLoading = false;
  });

  it('renders loading state when patients or dashboard is loading', () => {
    mockIsPatientsLoading = true;
    render(<HomeView />);
    expect(screen.getByText('Carregando painel...')).toBeInTheDocument();
  });

  it('renders error state when patients or dashboard fails', () => {
    mockIsPatientsError = true;
    render(<HomeView />);
    expect(screen.getByText('Erro ao carregar dados do painel.')).toBeInTheDocument();
  });

  it('renders empty state when no patients or KPIs are present', () => {
    mockPatientsData = { content: [], totalElements: 0 };
    mockDashboardData = null;
    render(<HomeView />);
    expect(screen.getByText('Sem dados agregados disponíveis')).toBeInTheDocument();
  });

  it('renders dashboard with greeting, KPIs and patient cards', () => {
    render(<HomeView />);
    expect(screen.getByText('Bom dia, Camila.')).toBeInTheDocument();
    expect(screen.getByText('1 on-track')).toBeInTheDocument();
    expect(screen.getByText('Pacientes ativos')).toBeInTheDocument();
    expect(screen.getByText('Adesão média')).toBeInTheDocument();
    expect(screen.getAllByText('92%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
  });

  it('navigates to patient page when patient card is clicked', () => {
    render(<HomeView />);
    const card = screen.getByTestId('home-patient-card-p1');
    fireEvent.click(card);
    expect(mockNavigate).toHaveBeenCalledWith('/patient/p1');
  });
});
