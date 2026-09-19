import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BiometryEvolutionCard } from './BiometryEvolutionCard';
import type { BiometryEvolutionSummary } from '../../types/biometry';

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();

vi.mock('../../stores/clinicalStore', () => ({
  useBiometryEvolutionSummary: vi.fn(),
}));

vi.mock('../../stores/toastStore', () => ({
  useToastStore: {
    getState: () => ({
      showSuccess: mockShowSuccess,
      showError: mockShowError,
    }),
  },
}));

import { useBiometryEvolutionSummary } from '../../stores/clinicalStore';

describe('BiometryEvolutionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when loading or when no assessments exist', () => {
    vi.mocked(useBiometryEvolutionSummary).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useBiometryEvolutionSummary>);

    const { container } = render(<BiometryEvolutionCard patientId="p1" />);
    expect(container.firstChild).toBeNull();

    vi.mocked(useBiometryEvolutionSummary).mockReturnValue({
      data: { assessmentCount: 0 } as BiometryEvolutionSummary,
      isLoading: false,
    } as unknown as ReturnType<typeof useBiometryEvolutionSummary>);

    const { container: emptyContainer } = render(<BiometryEvolutionCard patientId="p1" />);
    expect(emptyContainer.firstChild).toBeNull();
  });

  it('renders single assessment baseline (marco zero)', () => {
    const singleSummary: BiometryEvolutionSummary = {
      assessmentCount: 1,
      initialAssessmentDate: '2025-01-10',
      latestAssessmentDate: '2025-01-10',
      initialWeight: 80,
      currentWeight: 80,
      weightDelta: 0,
      initialBodyFatPercent: 20,
      currentBodyFatPercent: 20,
      bodyFatDelta: 0,
      initialLeanMassKg: 64,
      currentLeanMassKg: 64,
      leanMassDelta: 0,
      initialFatMassKg: 16,
      currentFatMassKg: 16,
      fatMassDelta: 0,
      perimetryDeltas: [],
      clinicalSynthesis: 'Marco zero estabelecido como ponto de partida.',
      whatsappFeedbackMessage: 'Olá! Primeira avaliação registrada com sucesso.',
    };

    vi.mocked(useBiometryEvolutionSummary).mockReturnValue({
      data: singleSummary,
      isLoading: false,
    } as unknown as ReturnType<typeof useBiometryEvolutionSummary>);

    render(<BiometryEvolutionCard patientId="p1" />);

    expect(screen.getByTestId('biometry-evolution-card')).toBeInTheDocument();
    expect(screen.getByText('Inteligência da Evolução Corporal')).toBeInTheDocument();
    expect(screen.getByText('1 avaliação')).toBeInTheDocument();
    expect(screen.getByText(/Marco zero registrado em/)).toBeInTheDocument();
    expect(screen.getByText('Marco zero estabelecido como ponto de partida.')).toBeInTheDocument();
  });

  it('renders comparative metrics, deltas, circumferences, and copies feedback message', async () => {
    const multiSummary: BiometryEvolutionSummary = {
      assessmentCount: 2,
      initialAssessmentDate: '2025-01-10',
      latestAssessmentDate: '2025-02-10',
      initialWeight: 85,
      currentWeight: 81,
      weightDelta: -4,
      initialBodyFatPercent: 25,
      currentBodyFatPercent: 20,
      bodyFatDelta: -5,
      initialLeanMassKg: 63.8,
      currentLeanMassKg: 64.8,
      leanMassDelta: 1,
      initialFatMassKg: 21.2,
      currentFatMassKg: 16.2,
      fatMassDelta: -5,
      perimetryDeltas: [
        {
          measureKey: 'cintura',
          label: 'Cintura',
          initialCm: 90,
          currentCm: 85,
          deltaCm: -5,
        },
      ],
      clinicalSynthesis:
        'Excelente recomposição corporal com perda de gordura e redução de cintura.',
      whatsappFeedbackMessage: 'Olá, Evander! Parabéns pelos -5kg de gordura eliminados!',
    };

    vi.mocked(useBiometryEvolutionSummary).mockReturnValue({
      data: multiSummary,
      isLoading: false,
    } as unknown as ReturnType<typeof useBiometryEvolutionSummary>);

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(<BiometryEvolutionCard patientId="p1" />);

    expect(screen.getByTestId('biometry-evolution-card')).toBeInTheDocument();
    expect(screen.getByText('2 avaliações')).toBeInTheDocument();
    expect(screen.getByText(/Excelente recomposição corporal/)).toBeInTheDocument();
    expect(screen.getByText('Cintura')).toBeInTheDocument();
    expect(screen.getByText('90.0 → 85.0 cm')).toBeInTheDocument();

    const copyBtn = screen.getByTestId('btn-copy-biometry-whatsapp');
    expect(copyBtn).toBeInTheDocument();

    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'Olá, Evander! Parabéns pelos -5kg de gordura eliminados!',
    );

    await waitFor(() => {
      expect(screen.getByText('Mensagem Copiada!')).toBeInTheDocument();
    });
    expect(mockShowSuccess).toHaveBeenCalledWith('Mensagem de feedback copiada com sucesso!');
  });
});
