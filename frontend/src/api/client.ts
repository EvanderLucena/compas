import axios from 'axios';
import type { ApiResponse } from '../types';

type RefreshCallback = () => Promise<string>;
type LogoutCallback = () => void;
type GetTokenCallback = () => string | null;
type ReadOnlyCallback = () => void;

let refreshTokenCallback: RefreshCallback | null = null;
let logoutCallback: LogoutCallback | null = null;
let getTokenCallback: GetTokenCallback | null = null;
let readOnlyCallback: ReadOnlyCallback | null = null;

export function registerAuthCallbacks(opts: {
  getToken: GetTokenCallback;
  refreshAuth: RefreshCallback;
  logout: LogoutCallback;
  onReadOnly?: ReadOnlyCallback;
}) {
  getTokenCallback = opts.getToken;
  refreshTokenCallback = opts.refreshAuth;
  logoutCallback = opts.logout;
  if (opts.onReadOnly) {
    readOnlyCallback = opts.onReadOnly;
  }
}

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getTokenCallback?.();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const url = originalRequest.url?.replace(/^\/+/, '') ?? '';
      if (
        url.startsWith('auth/login') ||
        url.startsWith('auth/signup') ||
        url.startsWith('auth/refresh')
      ) {
        const data = error.response?.data;
        return Promise.reject({
          success: false,
          message: data?.message || error.message || 'Authentication failed',
          errors: Array.isArray(data?.errors) ? data.errors : [],
          status: error.response?.status,
        });
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = (await refreshTokenCallback?.()) ?? '';
        failedQueue.forEach(({ resolve }) => resolve(newToken));
        failedQueue = [];
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        failedQueue.forEach(({ reject }) => reject(refreshError));
        failedQueue = [];
        logoutCallback?.();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 402 || error.response?.data?.code === 'READ_ONLY_MODE') {
      readOnlyCallback?.();
    }

    if (axios.isAxiosError(error) && error.response?.data) {
      const data = error.response.data;
      const apiError: ApiResponse<null> & { errors?: import('../types').FieldError[] } = {
        success: false,
        data: null,
        errors: Array.isArray(data?.errors) ? data.errors : [],
        message: data?.message || error.message,
        status: error.response.status,
      };
      return Promise.reject(apiError);
    }
    return Promise.reject(error);
  },
);
