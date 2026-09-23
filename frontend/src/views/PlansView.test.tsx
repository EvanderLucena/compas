import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlansView } from './PlansView';
import type { MealPlan } from '../types/plan';

// Mock react-router
vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: 'test-patient-id' }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

// Mock planStore
const mockPlan: MealPlan = {
  id: 'plan-1',
  episodeId: 'ep-1',
  title: 'Plano de emagrecimento',
  notes: 'Evitar lactose',
  kcalTarget: 2200,
  protTarget: 140,
  carbTarget: 250,
  fatTarget: 70,
  meals: [
    {
      id: 'meal-1',
      label: 'Café da manhã',
      time: '07:00',
      options: [
        {
          id: 'opt-1',
          name: 'Opção 1 · Clássico',
          items: [
            {
              id: 'item-1',
              foodId: 'food-1',
              foodName: 'Aveia em flocos',
              referenceAmount: 30,
              unit: 'GRAMAS',
              prep: '-',
              kcal: 117,
              prot: 5,
              carb: 20,
              fat: 2,
              fiber: 0,
            },
          ],
        },
      ],
    },
  ],
  extras: [
    { id: 'extra-1', name: 'Chocolate 70%', quantity: '20g', kcal: 108, prot: 2, carb: 8, fat: 8 },
  ],
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-22T00:00:00Z',
};

vi.mock('../stores/planStore', () => ({
  usePlan: () => ({
    data: mockPlan,
    isLoading: false,
  }),
  usePlanUIStore: () => ({
    activeMealId: 'meal-1',
    activeOptionIndex: 0,
    addFoodModalOpen: false,
    addMealModalOpen: false,
    pendingDeleteMealId: null,
    pendingDeleteItem: null,
    saveStatus: 'saved' as const,
    setActiveMealId: vi.fn(),
    setActiveOptionIndex: vi.fn(),
    setAddFoodModalOpen: vi.fn(),
    setAddMealModalOpen: vi.fn(),
    setPendingDeleteMealId: vi.fn(),
    setPendingDeleteItem: vi.fn(),
    setSaveStatus: vi.fn(),
  }),
  useUpdatePlan: () => ({ mutate: vi.fn() }),
  useAddMealSlot: () => ({ mutate: vi.fn() }),
  useDeleteMealSlot: () => ({ mutate: vi.fn() }),
  useUpdateMealSlot: () => ({ mutate: vi.fn() }),
  useAddOption: () => ({ mutate: vi.fn() }),
  useAddFoodItem: () => ({ mutate: vi.fn() }),
  useUpdateFoodItem: () => ({ mutate: vi.fn() }),
  useDeleteFoodItem: () => ({ mutate: vi.fn() }),
  useAddExtra: () => ({ mutate: vi.fn() }),
  useUpdateExtra: () => ({ mutate: vi.fn() }),
  useDeleteExtra: () => ({ mutate: vi.fn() }),
}));

describe('PlansView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders plan data from usePlan hook', () => {
    render(<PlansView patientId="test-patient-id" />);
    expect(screen.getByText('Plano de emagrecimento')).toBeInTheDocument();
  });

  it('displays SaveStatusIndicator with SALVO when status is saved', () => {
    render(<PlansView patientId="test-patient-id" />);
    expect(screen.getByText('SALVO')).toBeInTheDocument();
  });

  it('renders meal labels from plan data', () => {
    render(<PlansView patientId="test-patient-id" />);
    expect(screen.getByText('Café da manhã')).toBeInTheDocument();
  });

  it('renders food items with frozen food name', () => {
    render(<PlansView patientId="test-patient-id" />);
    expect(screen.getByText('Aveia em flocos')).toBeInTheDocument();
  });

  it('renders macro targets from plan data', () => {
    render(<PlansView patientId="test-patient-id" />);
    expect(screen.getByText('2200')).toBeInTheDocument();
    expect(screen.getByText('140g')).toBeInTheDocument();
  });

  it('renders download PDF buttons for meal plan and grocery list', () => {
    render(<PlansView patientId="test-patient-id" />);
    expect(screen.getByTestId('btn-download-plan-pdf')).toBeInTheDocument();
    expect(screen.getByTestId('btn-download-grocery-pdf')).toBeInTheDocument();
  });
});
