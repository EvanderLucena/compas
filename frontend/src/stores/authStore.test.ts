import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

vi.mock('../api/auth', () => ({
  signup: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  refreshAuth: vi.fn(),
  getCurrentUser: vi.fn(),
  completeOnboarding: vi.fn(),
}));

import * as authService from '../api/auth';

const mockSignup = vi.mocked(authService.signup);
const mockLogin = vi.mocked(authService.login);
const mockLogout = vi.mocked(authService.logout);
const mockRefreshAuth = vi.mocked(authService.refreshAuth);
const mockUser = {
  id: '1',
  name: 'Test',
  email: 'test@test.com',
  role: 'NUTRITIONIST' as const,
  onboardingCompleted: true,
};

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,
      fieldErrors: {},
    });
  });

  describe('signup', () => {
    it('sets isAuthenticated and user on successful signup', async () => {
      mockSignup.mockResolvedValue({
        accessToken: 'test-token',
        user: {
          id: '1',
          name: 'Dra. Teste',
          email: 'test@test.com',
          role: 'NUTRITIONIST',
          onboardingCompleted: false,
        },
      });

      await useAuthStore.getState().signup({
        name: 'Dra. Teste',
        email: 'test@test.com',
        password: 'Senha123!',
        crn: '12345',
        crnRegional: 'SP',
        terms: true,
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.name).toBe('Dra. Teste');
      expect(state.accessToken).toBe('test-token');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.fieldErrors).toEqual({});
    });

    it('sets error and fieldErrors on signup failure with field errors', async () => {
      mockSignup.mockRejectedValue({
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'E-mail já cadastrado' },
          { field: 'crn', message: 'CRN inválido' },
        ],
      });

      try {
        await useAuthStore.getState().signup({
          name: 'Test',
          email: 'dup@test.com',
          password: '12345678',
          crn: '',
          crnRegional: 'SP',
          terms: true,
        });
      } catch {
        // expected to throw
      }

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Validation failed');
      expect(state.fieldErrors).toEqual({
        email: 'E-mail já cadastrado',
        crn: 'CRN inválido',
      });
      expect(state.isLoading).toBe(false);
    });

    it('sets generic error on signup failure without field errors', async () => {
      mockSignup.mockRejectedValue({
        message: 'Erro ao criar conta.',
      });

      try {
        await useAuthStore.getState().signup({
          name: 'Test',
          email: 'test@test.com',
          password: '12345678',
          crn: '12345',
          crnRegional: 'SP',
          terms: true,
        });
      } catch {
        // expected to throw
      }

      const state = useAuthStore.getState();
      expect(state.error).toBe('Erro ao criar conta.');
      expect(state.fieldErrors).toEqual({});
    });

    it('sets isLoading true during signup', async () => {
      mockSignup.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  accessToken: 'token',
                  user: { ...mockUser, onboardingCompleted: false },
                }),
              0,
            );
          }),
      );

      const promise = useAuthStore.getState().signup({
        name: 'Test',
        email: 'test@test.com',
        password: '12345678',
        crn: '12345',
        crnRegional: 'SP',
        terms: true,
      });

      expect(useAuthStore.getState().isLoading).toBe(true);

      await promise;

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('login', () => {
    it('sets isAuthenticated and user on successful login', async () => {
      mockLogin.mockResolvedValue({
        accessToken: 'login-token',
        user: { ...mockUser, name: 'Dra. Login', email: 'login@test.com' },
      });

      await useAuthStore.getState().login('login@test.com', 'Senha123!');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('login@test.com');
      expect(state.accessToken).toBe('login-token');
      expect(state.isLoading).toBe(false);
    });

    it('sets error on wrong credentials', async () => {
      mockLogin.mockRejectedValue({
        message: 'Credenciais inválidas.',
      });

      try {
        await useAuthStore.getState().login('wrong@test.com', 'wrong');
      } catch {
        // expected to throw
      }

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.error).toBe('Credenciais inválidas.');
    });

    it('clears previous error on new login attempt', async () => {
      useAuthStore.setState({ error: 'Previous error', fieldErrors: { email: 'old error' } });

      mockLogin.mockRejectedValue({ message: 'New error' });

      try {
        await useAuthStore.getState().login('test', 'test');
      } catch {
        // expected
      }

      // After the attempt, error should be the new error, fieldErrors should be cleared
      const state = useAuthStore.getState();
      expect(state.error).toBe('New error');
      expect(state.fieldErrors).toEqual({});
    });
  });

  describe('logout', () => {
    it('clears auth state on logout', async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: mockUser,
        accessToken: 'token',
      });

      mockLogout.mockResolvedValue(undefined);
      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.error).toBeNull();
    });

    it('clears auth state even when logout API call fails', async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: mockUser,
        accessToken: 'token',
      });

      mockLogout.mockRejectedValue(new Error('Network error'));
      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('removes legacy nutriai-auth from localStorage on logout', async () => {
      localStorage.setItem('nutriai-auth', '{"state":{"isAuthenticated":true}}');
      mockLogout.mockResolvedValue();

      await useAuthStore.getState().logout();

      expect(localStorage.getItem('nutriai-auth')).toBeNull();
    });
  });

  describe('refreshAuth', () => {
    it('refreshes token successfully', async () => {
      mockRefreshAuth.mockResolvedValue({
        accessToken: 'refreshed-token',
        user: mockUser,
      });

      const token = await useAuthStore.getState().refreshAuth();

      expect(token).toBe('refreshed-token');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().accessToken).toBe('refreshed-token');
    });

    it('clears auth state on refresh failure', async () => {
      useAuthStore.setState({ accessToken: 'old-token' });
      mockRefreshAuth.mockRejectedValue(new Error('Refresh expired'));

      await expect(useAuthStore.getState().refreshAuth()).rejects.toThrow('Session expired');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
    });
  });

  describe('clearError', () => {
    it('clears error and fieldErrors', () => {
      useAuthStore.setState({ error: 'Some error', fieldErrors: { email: 'bad email' } });

      useAuthStore.getState().clearError();

      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
      expect(state.fieldErrors).toEqual({});
    });
  });
});
