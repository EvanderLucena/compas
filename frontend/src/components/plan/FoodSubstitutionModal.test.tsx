import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FoodSubstitutionModal } from './FoodSubstitutionModal';
import * as subStore from '../../stores/substitutionStore';
import type { MealFood } from '../../types/plan';
import type { FoodSubstitutionResponse } from '../../types/substitution';

type SubCalculatorReturn = ReturnType<typeof subStore.useFoodSubstitutionCalculator>;

vi.mock('../../stores/substitutionStore', () => ({
  useFoodSubstitutionCalculator: vi.fn(),
}));

const mockSourceFood: MealFood = {
  id: 'item-1',
  foodId: 'f1',
  foodName: 'Peito de frango grelhado',
  referenceAmount: 100,
  unit: 'g',
  prep: 'Grelhado com azeite',
  kcal: 159,
  prot: 32,
  carb: 0,
  fat: 2.5,
  fiber: 0,
};

const mockResponse: FoodSubstitutionResponse = {
  sourceFoodName: 'Peito de frango grelhado',
  sourceAmount: 100,
  sourceUnit: 'g',
  sourceKcal: 159,
  sourceProt: 32,
  sourceCarb: 0,
  sourceFat: 2.5,
  dominantMacro: 'PROTEINA',
  whatsappMessage: '🥗 Substituições para Peito de frango: 120g de Tilápia',
  substitutions: [
    {
      foodId: 'f2',
      name: 'Filé de tilápia grelhado',
      category: 'Pescados',
      unit: 'g',
      suggestedAmount: 120,
      householdPortion: '1 filé médio (120g)',
      kcal: 156,
      prot: 31.2,
      carb: 0,
      fat: 3.1,
      fiber: 0,
      deltaKcal: -3,
      deltaProt: -0.8,
      deltaCarb: 0,
      deltaFat: 0.6,
      isPatientHabit: true,
      habitCount: 5,
      habitBadge: 'Consumo Frequente (5x)',
      matchScore: 98,
      clinicalReason: 'Isoproteico e de fácil digestão',
    },
    {
      foodId: 'f3',
      name: 'Ovo de galinha cozido',
      category: 'Ovos',
      unit: 'unidade',
      suggestedAmount: 2,
      householdPortion: '2 unidades',
      kcal: 142,
      prot: 26,
      carb: 1,
      fat: 10,
      fiber: 0,
      deltaKcal: -17,
      deltaProt: -6,
      deltaCarb: 1,
      deltaFat: 7.5,
      isPatientHabit: false,
      habitCount: 0,
      habitBadge: null,
      matchScore: 88,
      clinicalReason: 'Opção prática com gorduras boas',
    },
  ],
};

describe('FoodSubstitutionModal - Render & States', () => {
  const mockMutate = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when calculation is pending', () => {
    vi.mocked(subStore.useFoodSubstitutionCalculator).mockReturnValue({
      mutate: mockMutate,
      data: undefined,
      isPending: true,
      isError: false,
    } as unknown as SubCalculatorReturn);

    render(
      <FoodSubstitutionModal isOpen={true} onClose={mockOnClose} sourceFood={mockSourceFood} />,
    );

    expect(screen.getByText(/Calculando equivalências e hábitos do paciente/i)).toBeInTheDocument();
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        foodId: 'f1',
        sourceFoodName: 'Peito de frango grelhado',
        sourceAmount: 100,
      }),
    );
  });

  it('renders error message when calculation fails', () => {
    vi.mocked(subStore.useFoodSubstitutionCalculator).mockReturnValue({
      mutate: mockMutate,
      data: undefined,
      isPending: false,
      isError: true,
    } as unknown as SubCalculatorReturn);

    render(
      <FoodSubstitutionModal isOpen={true} onClose={mockOnClose} sourceFood={mockSourceFood} />,
    );

    expect(
      screen.getByText(/Falha ao carregar substituições do catálogo TACO/i),
    ).toBeInTheDocument();
  });

  it('renders source food info and substitution cards with habit badge', () => {
    vi.mocked(subStore.useFoodSubstitutionCalculator).mockReturnValue({
      mutate: mockMutate,
      data: mockResponse,
      isPending: false,
      isError: false,
    } as unknown as SubCalculatorReturn);

    render(
      <FoodSubstitutionModal isOpen={true} onClose={mockOnClose} sourceFood={mockSourceFood} />,
    );

    expect(screen.getByText(/100g de Peito de frango grelhado/i)).toBeInTheDocument();
    expect(screen.getByText('Filé de tilápia grelhado')).toBeInTheDocument();
    expect(screen.getByText(/Consumo Frequente \(5x\)/i)).toBeInTheDocument();
    expect(screen.getByText('98% compatível')).toBeInTheDocument();
    expect(screen.getByText('Ovo de galinha cozido')).toBeInTheDocument();
  });
});

describe('FoodSubstitutionModal - Actions', () => {
  const mockMutate = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnApply = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('triggers apply substitution callback when clicking apply button', () => {
    vi.mocked(subStore.useFoodSubstitutionCalculator).mockReturnValue({
      mutate: mockMutate,
      data: mockResponse,
      isPending: false,
      isError: false,
    } as unknown as SubCalculatorReturn);

    render(
      <FoodSubstitutionModal
        isOpen={true}
        onClose={mockOnClose}
        sourceFood={mockSourceFood}
        onApplySubstitution={mockOnApply}
      />,
    );

    const applyButtons = screen.getAllByRole('button', { name: /Substituir no Plano/i });
    expect(applyButtons).toHaveLength(2);
    fireEvent.click(applyButtons[0]);

    expect(mockOnApply).toHaveBeenCalledWith(
      expect.objectContaining({
        foodId: 'f2',
        name: 'Filé de tilápia grelhado',
      }),
    );
  });

  it('copies whatsapp message when clicking copy all button', () => {
    vi.mocked(subStore.useFoodSubstitutionCalculator).mockReturnValue({
      mutate: mockMutate,
      data: mockResponse,
      isPending: false,
      isError: false,
    } as unknown as SubCalculatorReturn);

    render(
      <FoodSubstitutionModal isOpen={true} onClose={mockOnClose} sourceFood={mockSourceFood} />,
    );

    const copyAllBtn = screen.getByRole('button', {
      name: /Copiar Todas as Opções para WhatsApp/i,
    });
    fireEvent.click(copyAllBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockResponse.whatsappMessage);
  });

  it('does not show apply button when isReadOnly is true', () => {
    vi.mocked(subStore.useFoodSubstitutionCalculator).mockReturnValue({
      mutate: mockMutate,
      data: mockResponse,
      isPending: false,
      isError: false,
    } as unknown as SubCalculatorReturn);

    render(
      <FoodSubstitutionModal
        isOpen={true}
        onClose={mockOnClose}
        sourceFood={mockSourceFood}
        onApplySubstitution={mockOnApply}
        isReadOnly={true}
      />,
    );

    expect(screen.queryByRole('button', { name: /Substituir no Plano/i })).not.toBeInTheDocument();
  });
});
