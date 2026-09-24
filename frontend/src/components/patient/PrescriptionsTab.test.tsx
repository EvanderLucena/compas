import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrescriptionsTab } from './PrescriptionsTab';
import * as rxStore from '../../stores/prescriptionStore';
import * as rxApi from '../../api/prescription';
import type { Prescription, PrescriptionCatalogItem } from '../../types/prescription';

vi.mock('../../stores/prescriptionStore', () => ({
  usePrescriptions: vi.fn(),
  usePrescriptionCatalog: vi.fn(),
  useCreatePrescription: vi.fn(),
  useUpdatePrescription: vi.fn(),
  useDeletePrescription: vi.fn(),
}));

vi.mock('../../api/prescription', () => ({
  downloadPrescriptionPdf: vi.fn().mockResolvedValue(undefined),
}));

const mockCatalog: PrescriptionCatalogItem[] = [
  {
    id: 'creatina',
    name: 'Creatina Monohidratada',
    category: 'SUPPLEMENT',
    categoryLabel: 'Suplemento',
    defaultDosage: '5g',
    defaultForm: 'Pó',
    defaultTiming: 'Pós-treino',
    defaultDuration: 'Uso contínuo',
    isContinuous: true,
    instructions: 'Com 200ml de água',
    clinicalPurpose: 'Força muscular',
  },
  {
    id: 'omega-3',
    name: 'Ômega 3 TG 1000mg',
    category: 'SUPPLEMENT',
    categoryLabel: 'Suplemento',
    defaultDosage: '2 cápsulas',
    defaultForm: 'Cápsula',
    defaultTiming: 'Com o almoço',
    defaultDuration: 'Uso contínuo',
    isContinuous: true,
    instructions: 'Selo IFOS',
    clinicalPurpose: 'Anti-inflamatório',
  },
];

const mockActivePrescription: Prescription = {
  id: 'rx-1',
  patientId: 'p1',
  patientName: 'Lucas Ferreira',
  title: 'Suplementação Fase Hipertrofia',
  notes: 'Consumir com bastante água ao longo do dia.',
  status: 'ACTIVE',
  statusLabel: 'Ativa',
  createdAt: '2026-09-24T10:00:00Z',
  updatedAt: '2026-09-24T10:00:00Z',
  items: [
    {
      id: 'item-1',
      prescriptionId: 'rx-1',
      name: 'Creatina Monohidratada',
      category: 'SUPPLEMENT',
      categoryLabel: 'Suplemento',
      dosage: '5g',
      form: 'Pó',
      timing: 'Logo após o treino',
      duration: 'Uso contínuo',
      isContinuous: true,
      instructions: 'Dissolver em água fria.',
      displayOrder: 0,
    },
    {
      id: 'item-2',
      prescriptionId: 'rx-1',
      name: 'Ômega 3 TG 1000mg',
      category: 'SUPPLEMENT',
      categoryLabel: 'Suplemento',
      dosage: '2 cápsulas',
      form: 'Cápsula',
      timing: 'Junto com o almoço',
      duration: 'Uso contínuo',
      isContinuous: true,
      instructions: null,
      displayOrder: 1,
    },
  ],
  totalItems: 2,
  formattedSummary: 'Suplementação Fase Hipertrofia (2 itens)',
  whatsappMessage:
    '📋 *PRESCRIÇÃO & SUPLEMENTAÇÃO*\n👤 *Paciente:* Lucas Ferreira\n💊 *ITENS PRESCRITOS:*...',
};

describe('PrescriptionsTab', () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rxStore.usePrescriptionCatalog).mockReturnValue({
      data: mockCatalog,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof rxStore.usePrescriptionCatalog>);

    vi.mocked(rxStore.useCreatePrescription).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof rxStore.useCreatePrescription>);

    vi.mocked(rxStore.useUpdatePrescription).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof rxStore.useUpdatePrescription>);

    vi.mocked(rxStore.useDeletePrescription).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof rxStore.useDeletePrescription>);
  });

  it('renders empty state when patient has no prescriptions', () => {
    vi.mocked(rxStore.usePrescriptions).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof rxStore.usePrescriptions>);

    render(<PrescriptionsTab patientId="p1" />);

    expect(screen.getByText('Nenhuma prescrição registrada')).toBeDefined();
    expect(screen.getByText('+ Criar Primeira Prescrição')).toBeDefined();
  });

  it('renders active prescription card with prescribed items', () => {
    vi.mocked(rxStore.usePrescriptions).mockReturnValue({
      data: [mockActivePrescription],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof rxStore.usePrescriptions>);

    render(<PrescriptionsTab patientId="p1" patientPhone="(11) 98888-7777" />);

    expect(screen.getByText('Suplementação Fase Hipertrofia')).toBeDefined();
    expect(screen.getByText('Creatina Monohidratada')).toBeDefined();
    expect(screen.getByText('Ômega 3 TG 1000mg')).toBeDefined();
    expect(screen.getByText('Prescrição Atual (Em Andamento)')).toBeDefined();
  });

  it('triggers downloadPrescriptionPdf when PDF button is clicked', async () => {
    vi.mocked(rxStore.usePrescriptions).mockReturnValue({
      data: [mockActivePrescription],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof rxStore.usePrescriptions>);

    render(<PrescriptionsTab patientId="p1" />);

    const pdfBtn = screen.getByText(/Receituário PDF/);
    fireEvent.click(pdfBtn);

    await waitFor(() => {
      expect(rxApi.downloadPrescriptionPdf).toHaveBeenCalledWith(
        'p1',
        'rx-1',
        expect.stringContaining('receituario-lucas-ferreira.pdf'),
      );
    });
  });

  it('opens prescription modal and adds item from catalog preset', async () => {
    vi.mocked(rxStore.usePrescriptions).mockReturnValue({
      data: [mockActivePrescription],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof rxStore.usePrescriptions>);

    render(<PrescriptionsTab patientId="p1" />);

    const newBtn = screen.getByText('Nova Prescrição');
    fireEvent.click(newBtn);

    expect(screen.getByText('+ Selecionar do Catálogo')).toBeDefined();

    fireEvent.click(screen.getByText('+ Selecionar do Catálogo'));
    expect(screen.getByText('Catálogo Clínico de Suplementos & Fórmulas')).toBeDefined();
  });

  it('opens ConfirmModal when delete button is clicked and triggers delete on confirm', () => {
    const mockMutate = vi.fn();
    vi.mocked(rxStore.useDeletePrescription).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof rxStore.useDeletePrescription>);
    vi.mocked(rxStore.usePrescriptions).mockReturnValue({
      data: [mockActivePrescription],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof rxStore.usePrescriptions>);

    render(<PrescriptionsTab patientId="p1" />);

    const deleteBtn = screen.getByTitle('Excluir prescrição');
    fireEvent.click(deleteBtn);

    expect(screen.getByRole('heading', { name: 'Excluir Prescrição' })).toBeDefined();
    expect(screen.getByText(/Tem certeza que deseja excluir a prescrição/)).toBeDefined();

    const confirmBtn = screen.getByTestId('confirm-modal-button');
    fireEvent.click(confirmBtn);

    expect(mockMutate).toHaveBeenCalledWith('rx-1', expect.any(Object));
  });
});
