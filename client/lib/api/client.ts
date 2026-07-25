import axios from 'axios';
import type { ApiErrorShape } from '@/types/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
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
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('gc:session-expired'));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

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
    if (!error.response) {
      return 'Unable to reach the server. Please check your connection.';
    }
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred. Please try again.';
}
