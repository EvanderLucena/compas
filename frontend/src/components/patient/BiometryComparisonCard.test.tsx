import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BiometryComparisonCard } from './BiometryComparisonCard';
import type { BiometryAssessmentDTO } from '../../types/patient';
import type { BiometryComparisonData } from '../../types/biometry';

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();

vi.mock('../../stores/clinicalStore', () => ({
  useBiometryComparison: vi.fn(),
}));

vi.mock('../../stores/toastStore', () => ({
  useToastStore: {
    getState: () => ({
      showSuccess: mockShowSuccess,
      showError: mockShowError,
    }),
  },
}));

import { useBiometryComparison } from '../../stores/clinicalStore';

describe('BiometryComparisonCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAssessments: BiometryAssessmentDTO[] = [
    {
      id: 'a1',
      assessmentDate: '2025-01-10',
      weight: 80,
      bodyFatPercent: 20,
      leanMassKg: 64,
      waterPercent: 55,
      visceralFatLevel: 5,
      bmrKcal: 1600,
      notes: 'Avaliação inicial',
      skinfolds: [],
      perimetry: [],
    },
    {
      id: 'a2',
      assessmentDate: '2025-02-10',
      weight: 78,
      bodyFatPercent: 17,
      leanMassKg: 64.74,
      waterPercent: 57,
      visceralFatLevel: 4,
      bmrKcal: 1620,
      notes: 'Primeiro retorno',
      skinfolds: [],
      perimetry: [],
    },
  ];

  const mockComparisonData: BiometryComparisonData = {
    baseAssessmentId: 'a1',
    targetAssessmentId: 'a2',
    baseDate: '2025-01-10',
    targetDate: '2025-02-10',
    daysBetween: 31,
    baseWeight: 80,
    targetWeight: 78,
    weightDelta: -2,
    weightDeltaPercent: -2.5,
    baseBodyFatPercent: 20,
    targetBodyFatPercent: 17,
    bodyFatDelta: -3,
    baseLeanMassKg: 64,
    targetLeanMassKg: 64.74,
    leanMassDelta: 0.74,
    baseFatMassKg: 16,
    targetFatMassKg: 13.26,
    fatMassDelta: -2.74,
    baseWaterPercent: 55,
    targetWaterPercent: 57,
    waterDelta: 2,
    baseVisceralFat: 5,
    targetVisceralFat: 4,
    visceralFatDelta: -1,
    baseBmrKcal: 1600,
    targetBmrKcal: 1620,
    bmrDeltaKcal: 20,
    baseSkinfoldsSumMm: 120,
    targetSkinfoldsSumMm: 105,
    skinfoldsSumDeltaMm: -15,
    skinfoldsSumDeltaPercent: -12.5,
    skinfoldDeltas: [
      {
        measureKey: 'triceps',
        label: 'Tríceps',
        initialMm: 15,
        currentMm: 12,
        deltaMm: -3,
        deltaPercent: -20,
      },
    ],
    baseWaistHipRatio: 0.85,
    targetWaistHipRatio: 0.81,
    waistHipRatioDelta: -0.04,
    perimetryDeltas: [
      {
        measureKey: 'cintura',
        label: 'Cintura',
        initialCm: 85,
        currentCm: 81,
        deltaCm: -4,
      },
    ],
    clinicalClassification: 'RECOMPOSICAO_CORPORAL',
    clinicalSynthesis:
      'Evolução altamente favorável: redução de 2.7 kg de gordura e ganho de 0.7 kg de massa magra.',
    whatsappFeedbackMessage: 'Olá, Ana! Parabéns pela sua recomposição corporal!',
  };

  const fmtDate = (iso: string | null | undefined) => iso ?? '—';

  it('renders loading state when comparison is loading', () => {
    vi.mocked(useBiometryComparison).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useBiometryComparison>);

    render(
      <BiometryComparisonCard patientId="p1" assessments={mockAssessments} fmtDate={fmtDate} />,
    );

    expect(screen.getByText('Calculando comparativo biométrico...')).toBeDefined();
  });

  it('renders comparison data with metrics, classification, and table', () => {
    vi.mocked(useBiometryComparison).mockReturnValue({
      data: mockComparisonData,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useBiometryComparison>);

    render(
      <BiometryComparisonCard patientId="p1" assessments={mockAssessments} fmtDate={fmtDate} />,
    );

    expect(screen.getByText('Comparativo Evolutivo Biométrico')).toBeDefined();
    expect(screen.getByText('Intervalo: 31 dias')).toBeDefined();
    expect(screen.getByText('Recomposição Corporal (+ Massa / - Gordura)')).toBeDefined();
    expect(
      screen.getByText(
        'Evolução altamente favorável: redução de 2.7 kg de gordura e ganho de 0.7 kg de massa magra.',
      ),
    ).toBeDefined();

    // Metric cards
    expect(screen.getByText('Peso Total')).toBeDefined();
    expect(screen.getAllByText('78.0 kg').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Σ Dobras Cutâneas')).toBeDefined();
  });

  it('allows swapping assessments and copying synthesis', async () => {
    vi.mocked(useBiometryComparison).mockReturnValue({
      data: mockComparisonData,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useBiometryComparison>);

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(
      <BiometryComparisonCard patientId="p1" assessments={mockAssessments} fmtDate={fmtDate} />,
    );

    // Swap button
    const swapBtn = screen.getByLabelText('Inverter ordem das avaliações');
    fireEvent.click(swapBtn);

    // Copy synthesis button
    const copyBtn = screen.getByText('Copiar');
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        mockComparisonData.clinicalSynthesis,
      );
      expect(mockShowSuccess).toHaveBeenCalledWith(
        'Síntese clínica copiada para a área de transferência!',
      );
    });
  });
});
