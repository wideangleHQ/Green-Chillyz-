import { api } from './client';
import type {
  DashboardLoginResponse,
  DashboardStoreContext,
  DashboardCurrentSession,
  DashboardSession,
  DashboardMessageResponse,
  DashboardLogoutAllResponse,
} from '../../types/auth';

export const authApi = {
  async login(accessCode: string): Promise<DashboardLoginResponse> {
    const { data } = await api.post<DashboardLoginResponse>('/dashboard/auth/login', {
      accessCode,
    });
    return data;
  },

  async refresh(): Promise<DashboardMessageResponse> {
    const { data } = await api.post<DashboardMessageResponse>('/dashboard/auth/refresh');
    return data;
  },

  async logout(): Promise<DashboardMessageResponse> {
    const { data } = await api.post<DashboardMessageResponse>('/dashboard/auth/logout');
    return data;
  },

  async logoutAll(): Promise<DashboardLogoutAllResponse> {
    const { data } = await api.post<DashboardLogoutAllResponse>('/dashboard/auth/logout-all');
    return data;
  },

  async getMe(): Promise<DashboardStoreContext> {
    const { data } = await api.get<DashboardStoreContext>('/dashboard/auth/me');
    return data;
  },

  async getCurrentSession(): Promise<DashboardCurrentSession> {
    const { data } = await api.get<DashboardCurrentSession>('/dashboard/auth/session');
    return data;
  },

  async listSessions(): Promise<DashboardSession[]> {
    const { data } = await api.get<DashboardSession[]>('/dashboard/auth/sessions');
    return data;
  },

  async revokeSession(sessionId: string): Promise<DashboardMessageResponse> {
    const { data } = await api.delete<DashboardMessageResponse>(
      `/dashboard/auth/sessions/${sessionId}`,
    );
    return data;
  },
};
