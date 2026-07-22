import axios from 'axios';
import type { ApiErrorShape } from '@/types/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Shared Axios instance for all auth API calls.
 * - withCredentials: true → sends HttpOnly cookies (gc_access_token, gc_refresh_token)
 * - No tokens in localStorage/sessionStorage ever.
 */
export const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

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

/**
 * Response interceptor:
 * On 401 → silently attempt ONE refresh, then retry the original request.
 * If refresh also fails → clear user state via event, stop retrying.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401s that haven't already been retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry refresh or logout endpoints
      const url = originalRequest.url || '';
      if (url.includes('/auth/refresh') || url.includes('/auth/logout')) {
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
        await api.post('/auth/refresh');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Dispatch a custom event so AuthContext can clear state
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('gc:session-expired'));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Extract a human-readable error message from an Axios error.
 * Handles NestJS validation pipe array messages.
 */
export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorShape | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join('. ') : data.message;
    }
    if (error.response?.status === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (!error.response) {
      return 'Unable to reach the server. Please check your connection.';
    }
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred. Please try again.';
}
