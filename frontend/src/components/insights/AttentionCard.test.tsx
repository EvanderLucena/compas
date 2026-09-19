import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AttentionCard } from './AttentionCard';
import type { AttentionItem } from '../../types/clinicalRadar';
import { useNavigationStore } from '../../stores/navigationStore';

const mockNavigate = vi.fn();

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

describe('AttentionCard', () => {
  const baseItem: AttentionItem = {
    messageId: 'msg-1',
    patientId: 'patient-42',
    patientName: 'Mariana Souza',
    patientWhatsapp: '5511999998888',
    messageSnippet: 'Não consegui fazer a dieta hoje, comi pizza e estou com muita culpa',
    intent: 'doubt',
    intentConfidence: 0.9,
    sentiment: 'guilty_struggling',
    sentimentConfidence: 0.95,
    attentionScore: 0.92,
    createdAt: '2026-09-19T10:30:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigationStore.setState({
      activeView: 'insights',
      activePatientId: null,
    });
  });

  it('navigates to patient chart when "Ver prontuário →" is clicked', () => {
    render(<AttentionCard item={baseItem} isResolving={false} onResolve={vi.fn()} />);

    const btn = screen.getByTestId('btn-ver-prontuario');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('Ver prontuário →');

    fireEvent.click(btn);

    expect(mockNavigate).toHaveBeenCalledWith('/patient/patient-42');
    expect(useNavigationStore.getState().activePatientId).toBe('patient-42');
    expect(useNavigationStore.getState().activeView).toBe('patient');
  });

  it('does not render "Ver prontuário →" when patientId is null', () => {
    const itemWithoutPatient = { ...baseItem, patientId: null };

    render(<AttentionCard item={itemWithoutPatient} isResolving={false} onResolve={vi.fn()} />);

    expect(screen.queryByTestId('btn-ver-prontuario')).toBeNull();
    expect(screen.queryByText('Ver prontuário →')).toBeNull();
  });

  it('calls onResolve when "Marcar como Resolvido" is clicked', () => {
    const mockResolve = vi.fn();

    render(<AttentionCard item={baseItem} isResolving={false} onResolve={mockResolve} />);

    const btnResolve = screen.getByText('Marcar como Resolvido');
    fireEvent.click(btnResolve);

    expect(mockResolve).toHaveBeenCalledWith('msg-1');
  });

  it('renders correct WhatsApp link with country code 55', () => {
    render(<AttentionCard item={baseItem} isResolving={false} onResolve={vi.fn()} />);

    const waLink = screen.getByRole('link', { name: /abrir whatsapp/i });
    expect(waLink).toHaveAttribute('href', 'https://wa.me/5511999998888');
  });
});
