import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileModal } from './ProfileModal';
import * as nutritionistApi from '../../api/nutritionist';
import type { NutritionistProfile } from '../../types';

vi.mock('../../api/nutritionist', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
}));

const mockProfile: NutritionistProfile = {
  id: 'nutri-123',
  name: 'Dra. Roberta Novaes',
  email: 'roberta@nutri.com',
  role: 'NUTRITIONIST',
  crn: '12345',
  crnRegional: 'CRN-3',
  specialty: 'Esportiva',
  whatsapp: '11999998888',
  onboardingCompleted: true,
  trialEndsAt: new Date(Date.now() + 20 * 86400000).toISOString(),
  subscriptionTier: 'TRIAL',
  patientLimit: 15,
  activePatientCount: 7,
  createdAt: new Date().toISOString(),
};

describe('ProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(nutritionistApi.getProfile).mockResolvedValue(mockProfile);
  });

  it('loads profile and renders details tab by default', async () => {
    render(<ProfileModal open={true} onClose={vi.fn()} />);

    expect(screen.getByText('Meu Perfil')).toBeInTheDocument();
    await waitFor(() => {
      expect(nutritionistApi.getProfile).toHaveBeenCalled();
    });

    expect(screen.getByDisplayValue('Dra. Roberta Novaes')).toBeInTheDocument();
    expect(screen.getByDisplayValue('roberta@nutri.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12345')).toBeInTheDocument();
  });

  it('updates profile info successfully', async () => {
    vi.mocked(nutritionistApi.updateProfile).mockResolvedValue({
      ...mockProfile,
      name: 'Dra. Roberta Atualizada',
    });

    render(<ProfileModal open={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Dra. Roberta Novaes')).toBeInTheDocument();
    });

    const nameInput = screen.getByDisplayValue('Dra. Roberta Novaes');
    fireEvent.change(nameInput, { target: { value: 'Dra. Roberta Atualizada' } });

    const submitBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(nutritionistApi.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Dra. Roberta Atualizada' }),
      );
      expect(screen.getByText('Dados atualizados com sucesso!')).toBeInTheDocument();
    });
  });

  it('switches to security tab and changes password', async () => {
    vi.mocked(nutritionistApi.changePassword).mockResolvedValue({
      message: 'Senha alterada com sucesso!',
    });

    render(<ProfileModal open={true} onClose={vi.fn()} />);
    await waitFor(() => expect(nutritionistApi.getProfile).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /Segurança & Senha/i }));

    const currentInput = screen.getByPlaceholderText('Digite sua senha atual');
    const newInput = screen.getByPlaceholderText('Mínimo 8 caracteres');
    const confirmInput = screen.getByPlaceholderText('Repita a nova senha');

    fireEvent.change(currentInput, { target: { value: 'SenhaAtual123!' } });
    fireEvent.change(newInput, { target: { value: 'NovaSenhaForte456!' } });
    fireEvent.change(confirmInput, { target: { value: 'NovaSenhaForte456!' } });

    const submitBtn = screen.getByRole('button', { name: /Atualizar Senha/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(nutritionistApi.changePassword).toHaveBeenCalledWith({
        currentPassword: 'SenhaAtual123!',
        newPassword: 'NovaSenhaForte456!',
        confirmPassword: 'NovaSenhaForte456!',
      });
      expect(screen.getByText('Senha alterada com sucesso!')).toBeInTheDocument();
    });
  });

  it('switches to plan tab and displays usage and trial days', async () => {
    render(<ProfileModal open={true} onClose={vi.fn()} />);
    await waitFor(() => expect(nutritionistApi.getProfile).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /Plano & Limites/i }));

    expect(screen.getByText('7 / 15')).toBeInTheDocument();
    expect(screen.getByText('Período de Avaliação Gratuita')).toBeInTheDocument();
    expect(
      screen.getByText(/Você ainda pode cadastrar até 8 pacientes ativos/i),
    ).toBeInTheDocument();
  });
});
