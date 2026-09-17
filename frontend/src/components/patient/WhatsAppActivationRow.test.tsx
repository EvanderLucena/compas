import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WhatsAppActivationRow } from './WhatsAppActivationRow';
import type { Patient } from '../../types/patient';

const mockMutateDeactivate = vi.fn();
const mockMutateReactivate = vi.fn();

vi.mock('../../stores/whatsappStore', () => ({
  useActivationLink: vi.fn(),
}));

vi.mock('../../stores/patientStore', () => ({
  useDeactivatePatient: () => ({
    mutate: mockMutateDeactivate,
    isPending: false,
  }),
  useReactivatePatient: () => ({
    mutate: mockMutateReactivate,
    isPending: false,
  }),
}));

vi.mock('../../stores/toastStore', () => ({
  useToastStore: vi.fn((selector) =>
    selector({
      showSuccess: vi.fn(),
      showError: vi.fn(),
    }),
  ),
}));

import { useActivationLink } from '../../stores/whatsappStore';

const basePatient: Patient = {
  id: 'p-123',
  name: 'Ana Silva',
  initials: 'AS',
  age: 30,
  birthDate: '1996-01-01',
  sex: 'F',
  heightCm: 165,
  whatsapp: '11999998888',
  objective: 'Emagrecimento',
  status: 'ontrack',
  adherence: 92,
  weight: 65,
  weightDelta: -1.5,
  tag: 'retorno 7d',
  active: true,
};

describe('WhatsAppActivationRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders active AI state and allows pausing AI access', () => {
    vi.mocked(useActivationLink).mockReturnValue({
      data: { link: 'https://wa.me/test', isActivated: true },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useActivationLink>);

    render(
      <WhatsAppActivationRow
        patient={basePatient}
        patientId={basePatient.id}
        onEditPatient={vi.fn()}
      />,
    );

    expect(screen.getByText('WhatsApp: Ativado')).toBeInTheDocument();
    expect(screen.getByText('IA Ativa')).toBeInTheDocument();

    const pauseBtn = screen.getByRole('button', { name: /Pausar IA/i });
    expect(pauseBtn).toBeInTheDocument();

    fireEvent.click(pauseBtn);
    expect(mockMutateDeactivate).toHaveBeenCalledWith(basePatient.id, expect.any(Object));
  });

  it('renders paused AI state and allows reactivating AI access', () => {
    vi.mocked(useActivationLink).mockReturnValue({
      data: { link: 'https://wa.me/test', isActivated: true },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useActivationLink>);

    const pausedPatient = { ...basePatient, active: false };

    render(
      <WhatsAppActivationRow
        patient={pausedPatient}
        patientId={pausedPatient.id}
        onEditPatient={vi.fn()}
      />,
    );

    expect(screen.getByText('IA Pausada')).toBeInTheDocument();

    const reactivateBtn = screen.getByRole('button', { name: /Reativar IA/i });
    expect(reactivateBtn).toBeInTheDocument();

    fireEvent.click(reactivateBtn);
    expect(mockMutateReactivate).toHaveBeenCalledWith(pausedPatient.id, expect.any(Object));
  });

  it('renders state when phone is not registered', () => {
    vi.mocked(useActivationLink).mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useActivationLink>);

    const noPhonePatient = { ...basePatient, whatsapp: '' };

    render(
      <WhatsAppActivationRow
        patient={noPhonePatient}
        patientId={noPhonePatient.id}
        onEditPatient={vi.fn()}
      />,
    );

    expect(screen.getByText('WhatsApp: Número não cadastrado')).toBeInTheDocument();
    expect(screen.getByText('IA Ativa')).toBeInTheDocument();
  });
});
