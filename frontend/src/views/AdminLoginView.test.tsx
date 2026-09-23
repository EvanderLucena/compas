import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminLoginView } from './AdminLoginView';
import { useAuthStore } from '../stores/authStore';

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

describe('AdminLoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,
    });
  });

  it('renders portal title, subtitle and form inputs', () => {
    render(<AdminLoginView />);

    expect(screen.getByText(/Portal de Operações/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Acesso administrativo e infraestrutura do Compas/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId('admin-login-email')).toBeInTheDocument();
    expect(screen.getByTestId('admin-login-password')).toBeInTheDocument();
    expect(screen.getByTestId('admin-login-submit')).toBeInTheDocument();
  });

  it('disables submit button when inputs are empty', () => {
    render(<AdminLoginView />);

    const submitBtn = screen.getByTestId('admin-login-submit');
    expect(submitBtn).toBeDisabled();
  });

  it('rejects access if authenticated user is not an ADMIN', async () => {
    const mockLogin = vi.fn().mockImplementation(async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id: 'user-1',
          name: 'Dra. Nutri',
          email: 'nutri@example.com',
          role: 'NUTRITIONIST',
          onboardingCompleted: true,
        },
      });
    });
    const mockLogout = vi.fn().mockResolvedValue(undefined);

    useAuthStore.setState({
      login: mockLogin,
      logout: mockLogout,
    });

    render(<AdminLoginView />);

    fireEvent.change(screen.getByTestId('admin-login-email'), {
      target: { value: 'nutri@example.com' },
    });
    fireEvent.change(screen.getByTestId('admin-login-password'), { target: { value: 'senha123' } });

    fireEvent.click(screen.getByTestId('admin-login-submit'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('nutri@example.com', 'senha123');
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(
        screen.getByText(/Acesso negado: esta conta não possui privilégios de administrador/i),
      ).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('successfully logs in and navigates to /admin/whatsapp when role is ADMIN', async () => {
    const mockLogin = vi.fn().mockImplementation(async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id: 'admin-1',
          name: 'Admin Master',
          email: 'admin@compas.app',
          role: 'ADMIN',
          onboardingCompleted: true,
        },
      });
    });

    useAuthStore.setState({
      login: mockLogin,
    });

    render(<AdminLoginView />);

    fireEvent.change(screen.getByTestId('admin-login-email'), {
      target: { value: 'admin@compas.app' },
    });
    fireEvent.change(screen.getByTestId('admin-login-password'), {
      target: { value: 'AdminPass123!' },
    });

    fireEvent.click(screen.getByTestId('admin-login-submit'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@compas.app', 'AdminPass123!');
      expect(mockNavigate).toHaveBeenCalledWith('/admin/whatsapp', { replace: true });
    });
  });
});
