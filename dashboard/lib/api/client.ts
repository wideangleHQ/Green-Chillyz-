import axios from 'axios';
import type { ApiErrorShape } from '../../types/auth';

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

interface WrappedResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta: unknown;
  timestamp: string;
}

function isWrappedResponse(data: unknown): data is WrappedResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    'timestamp' in data &&
    'data' in data
  );
}

api.interceptors.response.use(
  (response) => {
    if (isWrappedResponse(response.data)) {
      response.data = response.data.data;
    }
    return response;
  },
  undefined,
);

/**
 * Only `/dashboard/*` routes are guarded by DashboardAuthGuard and read the
 * `gc_dashboard_access_token` cookie. Everything else is guarded by the
 * customer JwtAuthGuard, which reads `gc_access_token` — a different cookie,
 * secret and audience by design. A 401 from one of those is a routing fact,
 * not an expired session.
 *
 * Refreshing on them is actively harmful: each attempt rotates the refresh
 * token, and two rotations presenting the same token trip the backend's reuse
 * detection, which revokes every session for the store. That is what turns a
 * handful of misrouted 401s into a dashboard where nothing works.
 */
function usesDashboardSession(url: string): boolean {
  let pathname = url;
  try {
    pathname = new URL(url, 'http://dashboard.local').pathname;
  } catch {
    pathname = url.split('?')[0] || '';
  }

  const path = pathname.replace(/^\/+/, '').replace(/^api\/v\d+\//, '');
  return path === 'dashboard' || path.startsWith('dashboard/');
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const url = originalRequest.url || '';
      if (!usesDashboardSession(url)) {
        return Promise.reject(error);
      }
      if (url.includes('/dashboard/auth/refresh') || url.includes('/dashboard/auth/login') || url.includes('/dashboard/auth/logout')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/dashboard/auth/refresh');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('gc:dashboard-session-expired'));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const raw = error.response?.data;
    const data = (isWrappedResponse(raw) ? raw : raw) as ApiErrorShape | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join('. ') : data.message;
    }
    if (error.response?.status === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (error.response?.status === 403) {
      return 'Access Denied. Account is locked due to too many failed attempts.';
    }
    if (!error.response) {
      return 'Unable to reach the server. Please check your connection.';
    }
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred. Please try again.';
}
