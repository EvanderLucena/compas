import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HistoryTab } from '../HistoryTab';
import * as clinicalStore from '../../../stores/clinicalStore';
import type { PatientTimelineEvent } from '../../../types/timeline';
import { matchesCategory, computeCategoryCounts, getBadgeConfig } from './historyHelpers';

vi.mock('../../../stores/clinicalStore', () => ({
  usePatientTimeline: vi.fn(),
  usePatientHistoryEpisodes: vi.fn(),
  useHistoricalEpisode: vi.fn(),
  useAddTimelineNote: vi.fn(),
}));

const mockEvents: PatientTimelineEvent[] = [
  {
    id: 'ev-1',
    episodeId: 'ep-active',
    episodeTitle: 'Ciclo Atual (Em andamento)',
    currentEpisode: true,
    eventType: 'CONSULTATION',
    eventAt: '2026-09-20T10:00:00Z',
    title: 'Consulta de Retorno Hipertrofia',
    description: 'Ajuste de volume calórico e divisão de macros.',
    sourceRef: null,
    metadataJson: null,
  },
  {
    id: 'ev-2',
    episodeId: 'ep-active',
    episodeTitle: 'Ciclo Atual (Em andamento)',
    currentEpisode: true,
    eventType: 'MEAL_EXTRACTION',
    eventAt: '2026-09-19T13:30:00Z',
    title: 'Almoço registrado via WhatsApp',
    description: '4 itens: Arroz integral, peito de frango, feijão e salada.',
    sourceRef: null,
    metadataJson: null,
  },
  {
    id: 'ev-3',
    episodeId: 'ep-closed',
    episodeTitle: 'Ciclo Anterior (Out 2025 - Dez 2025)',
    currentEpisode: false,
    eventType: 'BIOMETRY',
    eventAt: '2025-11-20T15:00:00Z',
    title: 'Reavaliação 60 dias Ciclo 1',
    description: 'Perda de 3.6kg de gordura pura.',
    sourceRef: null,
    metadataJson: null,
  },
];

describe('HistoryTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(clinicalStore.usePatientTimeline).mockReturnValue({
      data: mockEvents,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof clinicalStore.usePatientTimeline>);

    vi.mocked(clinicalStore.usePatientHistoryEpisodes).mockReturnValue({
      data: [
        {
          episodeId: 'ep-closed',
          startDate: '2025-10-15',
          endDate: '2025-12-15',
          hasBiometry: true,
          assessmentCount: 2,
          durationDays: 61,
        },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof clinicalStore.usePatientHistoryEpisodes>);

    vi.mocked(clinicalStore.useHistoricalEpisode).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as unknown as ReturnType<typeof clinicalStore.useHistoricalEpisode>);

    vi.mocked(clinicalStore.useAddTimelineNote).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof clinicalStore.useAddTimelineNote>);
  });

  it('renders all timeline events and total count badge', () => {
    render(<HistoryTab patientId="p123" />);

    expect(screen.getByText('Linha do Tempo (3)')).toBeInTheDocument();
    expect(screen.getByText('Consulta de Retorno Hipertrofia')).toBeInTheDocument();
    expect(screen.getByText('Almoço registrado via WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Reavaliação 60 dias Ciclo 1')).toBeInTheDocument();
  });

  it('filters events by search query', () => {
    render(<HistoryTab patientId="p123" />);

    const searchInput = screen.getByPlaceholderText('Buscar por termo no histórico...');
    fireEvent.change(searchInput, { target: { value: 'WhatsApp' } });

    expect(screen.getByText('Almoço registrado via WhatsApp')).toBeInTheDocument();
    expect(screen.queryByText('Consulta de Retorno Hipertrofia')).not.toBeInTheDocument();
  });

  it('filters events when selecting category pill', () => {
    render(<HistoryTab patientId="p123" />);

    const consultPill = screen.getByText('Consultas');
    fireEvent.click(consultPill);

    expect(screen.getByText('Consulta de Retorno Hipertrofia')).toBeInTheDocument();
    expect(screen.queryByText('Almoço registrado via WhatsApp')).not.toBeInTheDocument();
  });

  it('switches between timeline feed and cycles summary', () => {
    render(<HistoryTab patientId="p123" />);

    const cyclesButton = screen.getByText('Ciclos de Acompanhamento');
    fireEvent.click(cyclesButton);

    expect(screen.getByText('Ciclo Atual (Em andamento)')).toBeInTheDocument();
    expect(screen.getByText(/61 dias · 2 avaliações/i)).toBeInTheDocument();
  });

  it('opens new clinical note modal when clicking action button', () => {
    render(<HistoryTab patientId="p123" />);

    const addNoteBtn = screen.getByText('Nova Anotação');
    fireEvent.click(addNoteBtn);

    expect(screen.getByText('Nova Anotação Clínica')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ex: Consulta de Retorno/i)).toBeInTheDocument();
  });
});

describe('historyHelpers', () => {
  it('correctly categorizes event types', () => {
    expect(matchesCategory('CONSULTATION', 'CONSULTATION')).toBe(true);
    expect(matchesCategory('MEAL_EXTRACTION', 'MEAL')).toBe(true);
    expect(matchesCategory('BIOMETRY', 'BIOMETRY')).toBe(true);
    expect(matchesCategory('CONSULTATION', 'PLAN')).toBe(false);
    expect(matchesCategory('ANYTHING', 'ALL')).toBe(true);
  });

  it('computes category counts accurately', () => {
    const counts = computeCategoryCounts(mockEvents);
    expect(counts.ALL).toBe(3);
    expect(counts.CONSULTATION).toBe(1);
    expect(counts.MEAL).toBe(1);
    expect(counts.BIOMETRY).toBe(1);
    expect(counts.PLAN).toBe(0);
  });

  it('returns valid badge config for unknown and known types', () => {
    const known = getBadgeConfig('CONSULTATION');
    expect(known.label).toBe('Consulta');
    expect(known.color).toBeTruthy();

    const unknown = getBadgeConfig('SOME_UNKNOWN_TYPE');
    expect(unknown.label).toBe('Registro');
  });
});
