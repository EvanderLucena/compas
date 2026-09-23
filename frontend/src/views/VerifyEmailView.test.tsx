import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { VerifyEmailView } from './VerifyEmailView';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';

describe('VerifyEmailView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: false,
      verifyEmail: vi.fn(),
      resendVerification: vi.fn(),
    });
    useToastStore.setState({
      visible: false,
      message: '',
      type: 'success',
    });
  });

  it('renders idle form when no token is in URL', () => {
    render(
      <MemoryRouter initialEntries={['/verify-email']}>
        <VerifyEmailView />
      </MemoryRouter>,
    );

    expect(screen.getByText('Confirmação de E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail cadastrado/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Reenviar link de confirmação/i }),
    ).toBeInTheDocument();
  });

  it('calls verifyEmail when token is provided and shows success screen', async () => {
    const mockVerify = vi.fn().mockResolvedValue({ success: true, message: 'Sucesso' });
    useAuthStore.setState({ verifyEmail: mockVerify });

    render(
      <MemoryRouter initialEntries={['/verify-email?token=valid-token-123']}>
        <VerifyEmailView />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockVerify).toHaveBeenCalledWith('valid-token-123');
      expect(screen.getByText(/E-mail confirmado com sucesso!/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Fazer Login/i })).toBeInTheDocument();
    });
  });

  it('shows error screen when verifyEmail fails', async () => {
    const mockVerify = vi.fn().mockRejectedValue({ message: 'Token expirado' });
    useAuthStore.setState({ verifyEmail: mockVerify });

    render(
      <MemoryRouter initialEntries={['/verify-email?token=expired-token']}>
        <VerifyEmailView />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Link expirado ou inválido/i)).toBeInTheDocument();
      expect(screen.getByText(/Token expirado/i)).toBeInTheDocument();
    });
  });

  it('allows resending confirmation link from error or idle state', async () => {
    const mockResend = vi.fn().mockResolvedValue({ success: true, message: 'Link reenviado' });
    useAuthStore.setState({ resendVerification: mockResend });

    render(
      <MemoryRouter initialEntries={['/verify-email']}>
        <VerifyEmailView />
      </MemoryRouter>,
    );

    const input = screen.getByLabelText(/E-mail cadastrado/i);
    fireEvent.change(input, { target: { value: 'nutri@teste.com' } });

    const submitBtn = screen.getByRole('button', { name: /Reenviar link de confirmação/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockResend).toHaveBeenCalledWith('nutri@teste.com');
      expect(useToastStore.getState().message).toBe('Link reenviado');
    });
  });
});
