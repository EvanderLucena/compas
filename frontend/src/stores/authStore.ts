import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authService from '../api/auth';
import { registerAuthCallbacks } from '../api/client';
import type { AuthUser, SignupRequest, MeResponse, FieldError } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  isInitializing: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;

  // Auth actions
  signup: (data: SignupRequest) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<string>;
  clearError: () => void;
  updateUser: (partial: Partial<AuthUser>) => void;

  // Initialize from stored state
  initializeAuth: () => Promise<void>;
}

// Backward-compatible migration from legacy nutriai-auth to compas-auth
if (typeof window !== 'undefined' && !localStorage.getItem('compas-auth')) {
  const legacyAuth = localStorage.getItem('nutriai-auth');
  if (legacyAuth) {
    localStorage.setItem('compas-auth', legacyAuth);
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isInitializing: true,
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,
      fieldErrors: {},

      updateUser: (partial) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...partial } });
        }
      },

      signup: async (data) => {
        set({ isLoading: true, error: null, fieldErrors: {} });
        try {
          const response = await authService.signup(data);
          set({
            isAuthenticated: true,
            user: response.user,
            accessToken: response.accessToken,
            isLoading: false,
          });
        } catch (err: unknown) {
          const apiErr = err as { message?: string; errors?: FieldError[] };
          const fieldMap: Record<string, string> = {};
          if (apiErr.errors?.length) {
            apiErr.errors.forEach((e) => {
              fieldMap[e.field] = e.message;
            });
          }
          set({
            isLoading: false,
            error: apiErr.message || 'Erro ao criar conta.',
            fieldErrors: fieldMap,
          });
          throw err;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null, fieldErrors: {} });
        try {
          const response = await authService.login({ email, password });
          set({
            isAuthenticated: true,
            user: response.user,
            accessToken: response.accessToken,
            isLoading: false,
          });
        } catch (err: unknown) {
          const apiErr = err as { message?: string; errors?: FieldError[] };
          const fieldMap: Record<string, string> = {};
          if (apiErr.errors?.length) {
            apiErr.errors.forEach((e) => {
              fieldMap[e.field] = e.message;
            });
          }
          set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            isLoading: false,
            error: apiErr.message || 'Credenciais inválidas.',
            fieldErrors: fieldMap,
          });
          throw err;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // Even if logout API call fails, clear local state
        }
        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          error: null,
        });
      },

      refreshAuth: async () => {
        try {
          const response = await authService.refreshAuth();
          set({
            accessToken: response.accessToken,
            user: response.user,
            isAuthenticated: true,
          });
          return response.accessToken;
        } catch {
          set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
          });
          throw new Error('Session expired');
        }
      },

      clearError: () => set({ error: null, fieldErrors: {} }),

      initializeAuth: async () => {
        const oldAuth = localStorage.getItem('nutriai.auth');
        if (oldAuth === 'true') {
          localStorage.removeItem('nutriai.auth');
        }

        const token = get().accessToken;
        if (!token) {
          set({ isAuthenticated: false, isInitializing: false });
          return;
        }
        try {
          const user: MeResponse = await authService.getCurrentUser();
          set({
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role as AuthUser['role'],
              onboardingCompleted: user.onboardingCompleted,
            },
            isAuthenticated: true,
            isInitializing: false,
          });
        } catch {
          try {
            await get().refreshAuth();
          } catch {
            set({ isAuthenticated: false, user: null, accessToken: null });
          }
        }
        set({ isInitializing: false });
      },
    }),
    {
      name: 'compas-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
      }),
    },
  ),
);

registerAuthCallbacks({
  getToken: () => useAuthStore.getState().accessToken ?? null,
  refreshAuth: () => useAuthStore.getState().refreshAuth(),
  logout: () => useAuthStore.getState().logout(),
});
