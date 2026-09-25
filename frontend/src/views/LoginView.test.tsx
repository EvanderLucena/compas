import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginView } from './LoginView';

const mockLogin = vi.fn();
const mockClearError = vi.fn();

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      login: mockLogin,
      isLoading: false,
      fieldErrors: {} as Record<string, string>,
      clearError: mockClearError,
    };
    return selector(state);
  },
}));

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Submit button state', () => {
    it('submit button is disabled when email and password are empty', () => {
      render(<LoginView />);
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      expect(submitButton).toBeDisabled();
    });

    it('submit button is disabled when email is filled but password is empty', () => {
      render(<LoginView />);
      const emailInput = screen.getByTestId('login-email');
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      expect(submitButton).toBeDisabled();
    });

    it('submit button is enabled when both email and password have values', () => {
      render(<LoginView />);
      const emailInput = screen.getByTestId('login-email');
      const passwordInput = screen.getByTestId('login-password');
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      expect(submitButton).not.toBeDisabled();
    });

    it('submit button has opacity 0.45 when disabled', () => {
      render(<LoginView />);
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveStyle({ opacity: 0.45 });
    });
  });

  describe('Form submission', () => {
    it('calls login with email and password on valid submit', async () => {
      mockLogin.mockResolvedValue(undefined);
      render(<LoginView />);
      const emailInput = screen.getByTestId('login-email');
      const passwordInput = screen.getByTestId('login-password');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByRole('button', { name: /entrar/i });
      fireEvent.click(submitButton);

      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('shows local error when fields are empty on submit', async () => {
      render(<LoginView />);
      const form = screen.getByTestId('login-email').closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/preencha todos os campos/i)).toBeInTheDocument();
      });
    });

    it('shows error message when login fails', async () => {
      mockLogin.mockRejectedValue(new Error('Credenciais inválidas.'));
      render(<LoginView />);

      const emailInput = screen.getByTestId('login-email');
      const passwordInput = screen.getByTestId('login-password');
      fireEvent.change(emailInput, { target: { value: 'wrong@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });

      const submitButton = screen.getByRole('button', { name: /entrar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/credenciais/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('has a link to signup page', () => {
      render(<LoginView />);
      const signupLink = screen.getByRole('link', { name: /criar conta/i });
      expect(signupLink).toHaveAttribute('href', '/signup');
    });
  });

  describe('Closed Beta mode', () => {
    it('shows closed beta notice and hides signup when closedBeta is true', () => {
      render(<LoginView closedBeta={true} />);
      expect(screen.getByTestId('closed-beta-notice')).toBeInTheDocument();
      expect(screen.getByText(/versão beta privada/i)).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /criar conta/i })).not.toBeInTheDocument();
    });
  });
});
