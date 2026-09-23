import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

const mockUser = {
  id: '1',
  name: 'Test',
  email: 'test@test.com',
  role: 'NUTRITIONIST' as const,
  onboardingCompleted: true,
};

describe('authStore readOnly actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      isReadOnlyModalOpen: false,
    });
  });

  it('opens and closes read-only modal', () => {
    expect(useAuthStore.getState().isReadOnlyModalOpen).toBe(false);

    useAuthStore.getState().openReadOnlyModal();
    expect(useAuthStore.getState().isReadOnlyModalOpen).toBe(true);

    useAuthStore.getState().closeReadOnlyModal();
    expect(useAuthStore.getState().isReadOnlyModalOpen).toBe(false);
  });

  it('sets readOnly true and updates subscriptionActive on user', () => {
    useAuthStore.setState({
      user: {
        ...mockUser,
        readOnly: false,
        subscriptionActive: true,
      },
    });

    useAuthStore.getState().setReadOnly(true);

    const state = useAuthStore.getState();
    expect(state.user?.readOnly).toBe(true);
    expect(state.user?.subscriptionActive).toBe(false);
  });

  it('sets readOnly false on user', () => {
    useAuthStore.setState({
      user: {
        ...mockUser,
        readOnly: true,
        subscriptionActive: false,
      },
    });

    useAuthStore.getState().setReadOnly(false);

    const state = useAuthStore.getState();
    expect(state.user?.readOnly).toBe(false);
  });
});
