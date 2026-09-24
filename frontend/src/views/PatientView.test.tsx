import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PatientView } from './PatientView';
import type { PatientApiResponse } from '../types/patient';

vi.mock('react-router', () => ({
  useParams: () => ({ id: '7805d613-efc1-4afb-8371-f0bbcab157fe' }),
  Link: ({
    to,
    children,
    className,
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

let mockPatientData: PatientApiResponse | null = null;
let mockIsLoading = false;
let mockIsError = false;
let mockError: unknown = null;
const mockRefetch = vi.fn();

vi.mock('../stores/patientStore', () => ({
  usePatient: () => ({
    data: mockPatientData,
    isLoading: mockIsLoading,
    isError: mockIsError,
    error: mockError,
    refetch: mockRefetch,
  }),
  useDeactivatePatient: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useReactivatePatient: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('../stores/whatsappStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../stores/whatsappStore')>();
  return {
    ...actual,
    useActivationLink: () => ({
      data: null,
      isLoading: false,
    }),
    useExtractions: () => ({
      data: [],
      isLoading: false,
    }),
    useTimeline: () => ({
      data: [],
      isLoading: false,
    }),
  };
});

vi.mock('../stores/clinicalStore', () => ({
  usePatientBiometry: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('../stores/planStore', () => ({
  usePlan: () => ({
    data: null,
    isLoading: false,
  }),
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: (
    selector: (s: {
      user: { readOnly?: boolean } | null;
      openReadOnlyModal: () => void;
    }) => unknown,
  ) => selector({ user: { readOnly: false }, openReadOnlyModal: vi.fn() }),
}));

function renderPatientView() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PatientView />
    </QueryClientProvider>,
  );
}

describe('PatientView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPatientData = null;
    mockIsLoading = false;
    mockIsError = false;
    mockError = null;
  });

  it('renders loading state when fetching patient data', () => {
    mockIsLoading = true;
    renderPatientView();
    expect(screen.getByText('Carregando paciente...')).toBeInTheDocument();
  });

  it('renders 404 not found message and back button when patient is not found (status 404)', () => {
    mockIsError = true;
    mockError = { status: 404 };
    renderPatientView();

    expect(screen.getByText('Paciente não encontrado')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Este paciente não foi encontrado ou você não possui permissão para acessá-lo.',
      ),
    ).toBeInTheDocument();

    const backLink = screen.getByRole('link', { name: 'Voltar para lista de pacientes' });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/patients');
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
  });

  it('renders generic error message and retry button on network/server error', () => {
    mockIsError = true;
    mockError = { status: 500, message: 'Internal Server Error' };
    renderPatientView();

    expect(screen.getByText('Erro ao carregar paciente')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Não foi possível carregar os dados do paciente. Verifique sua conexão e tente novamente.',
      ),
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: 'Tentar novamente' });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalledTimes(1);

    const backLink = screen.getByRole('link', { name: 'Voltar para lista de pacientes' });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/patients');
  });

  it('renders empty patient state when data is null and not loading/error', () => {
    mockPatientData = null;
    mockIsLoading = false;
    mockIsError = false;
    renderPatientView();

    expect(screen.getByText('Sem dados reais deste paciente no momento.')).toBeInTheDocument();
    const backLink = screen.getByRole('link', { name: 'Voltar para lista de pacientes' });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/patients');
  });

  it('renders patient view header and tabs when patient is loaded successfully', () => {
    mockPatientData = {
      id: '7805d613-efc1-4afb-8371-f0bbcab157fe',
      name: 'Evander',
      initials: 'E',
      age: 33,
      birthDate: '1993-02-26',
      sex: 'M',
      heightCm: 186,
      whatsapp: '18998167781',
      objective: 'EMAGRECIMENTO',
      status: 'ONTRACK',
      adherence: 80,
      weight: 82.2,
      weightDelta: -4.3,
      tag: 'Atleta',
      active: true,
      aiAdherenceInsight: 'Boa adesão ao plano.',
    };

    renderPatientView();
    expect(screen.getByText('Evander')).toBeInTheDocument();
    expect(screen.getByText('Hoje')).toBeInTheDocument();
    expect(screen.getByText('Plano')).toBeInTheDocument();
    expect(screen.getByText('Biometria')).toBeInTheDocument();
  });
});
