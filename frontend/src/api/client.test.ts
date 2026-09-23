import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, registerAuthCallbacks } from './client';

describe('apiClient read-only interceptor', () => {
  const mockGetToken = vi.fn(() => 'test-token');
  const mockRefreshAuth = vi.fn(async () => 'new-token');
  const mockLogout = vi.fn();
  const mockReadOnly = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    registerAuthCallbacks({
      getToken: mockGetToken,
      refreshAuth: mockRefreshAuth,
      logout: mockLogout,
      onReadOnly: mockReadOnly,
    });
  });

  it('triggers onReadOnly callback on HTTP 402 error', async () => {
    vi.spyOn(apiClient, 'request').mockRejectedValueOnce({
      response: {
        status: 402,
        data: {
          success: false,
          code: 'READ_ONLY_MODE',
          message: 'Assinatura inativa',
        },
      },
      config: { url: '/patients' },
    });

    try {
      // Simulate interceptor response error handler directly or trigger request
      const responseInterceptor = apiClient.interceptors.response as unknown as {
        handlers: Array<{ rejected: (error: unknown) => Promise<unknown> }>;
      };
      const errorHandler = responseInterceptor.handlers[0]?.rejected;
      if (errorHandler) {
        await errorHandler({
          response: {
            status: 402,
            data: { success: false, code: 'READ_ONLY_MODE' },
          },
          config: { url: '/patients' },
        });
      }
    } catch {
      // Expected rejection
    }

    expect(mockReadOnly).toHaveBeenCalledTimes(1);
  });

  it('triggers onReadOnly callback if code is READ_ONLY_MODE even if status differs', async () => {
    try {
      const responseInterceptor = apiClient.interceptors.response as unknown as {
        handlers: Array<{ rejected: (error: unknown) => Promise<unknown> }>;
      };
      const errorHandler = responseInterceptor.handlers[0]?.rejected;
      if (errorHandler) {
        await errorHandler({
          response: {
            status: 400,
            data: { success: false, code: 'READ_ONLY_MODE' },
          },
          config: { url: '/patients' },
        });
      }
    } catch {
      // Expected rejection
    }

    expect(mockReadOnly).toHaveBeenCalledTimes(1);
  });
});
