import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AdminShell } from './AdminShell';
import { useAuthStore } from '../../stores/authStore';

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 'adm-1',
        name: 'Super Admin',
        email: 'ops@compas.app',
        role: 'ADMIN',
        onboardingCompleted: true,
      },
    });
  });

  it('renders ops branding, nav links and admin user info', () => {
    render(
      <MemoryRouter>
        <AdminShell />
      </MemoryRouter>,
    );

    expect(screen.getByText('compas')).toBeInTheDocument();
    expect(screen.getByText('OPS')).toBeInTheDocument();
    expect(screen.getByText('Frota WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('ops@compas.app')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('triggers logout and navigates to /admin/login when clicking Sair', async () => {
    const mockLogout = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ logout: mockLogout });

    render(
      <MemoryRouter>
        <AdminShell />
      </MemoryRouter>,
    );

    const logoutBtn = screen.getByTestId('admin-logout-btn');
    fireEvent.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/login', { replace: true });
    });
  });
});
