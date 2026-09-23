import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailVerificationBanner } from './EmailVerificationBanner';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';

describe('EmailVerificationBanner', () => {
  beforeEach(() => {
    sessionStorage.clear();
    useAuthStore.setState({
      user: null,
      resendVerification: vi
        .fn()
        .mockResolvedValue({ success: true, message: 'Reenviado com sucesso' }),
    });
    useToastStore.setState({
      visible: false,
      message: '',
      type: 'success',
    });
  });

  it('does not render when user is null', () => {
    const { container } = render(<EmailVerificationBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render when user email is already verified', () => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        name: 'Nutri Teste',
        email: 'nutri@teste.com',
        role: 'NUTRITIONIST',
        onboardingCompleted: true,
        emailVerified: true,
      },
    });

    const { container } = render(<EmailVerificationBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders alert when user email is not verified', () => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        name: 'Nutri Teste',
        email: 'nutri@teste.com',
        role: 'NUTRITIONIST',
        onboardingCompleted: true,
        emailVerified: false,
      },
    });

    render(<EmailVerificationBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Seu e-mail ainda não foi confirmado/i)).toBeInTheDocument();
  });

  it('calls resendVerification on click and shows success toast', async () => {
    const resendMock = vi.fn().mockResolvedValue({ success: true, message: 'Link enviado!' });
    useAuthStore.setState({
      user: {
        id: 'u1',
        name: 'Nutri Teste',
        email: 'nutri@teste.com',
        role: 'NUTRITIONIST',
        onboardingCompleted: true,
        emailVerified: false,
      },
      resendVerification: resendMock,
    });

    render(<EmailVerificationBanner />);
    const resendButton = screen.getByRole('button', { name: /Reenviar link de confirmação/i });
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(resendMock).toHaveBeenCalledWith('nutri@teste.com');
      expect(useToastStore.getState().message).toBe('Link enviado!');
    });
  });

  it('hides banner when dismiss button is clicked', () => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        name: 'Nutri Teste',
        email: 'nutri@teste.com',
        role: 'NUTRITIONIST',
        onboardingCompleted: true,
        emailVerified: false,
      },
    });

    render(<EmailVerificationBanner />);
    const dismissButton = screen.getByRole('button', { name: /Dispensar aviso/i });
    fireEvent.click(dismissButton);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(sessionStorage.getItem('compas_email_banner_dismissed')).toBe('true');
  });
});
