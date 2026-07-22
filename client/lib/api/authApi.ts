import { api } from './client';
import type {
  AuthUser,
  GoogleAuthResponse,
  RefreshResponse,
  LogoutResponse,
  RequestOtpPayload,
  RequestOtpResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
  UpdateProfilePayload,
  UserDevice,
} from '@/types/auth';

/**
 * All auth API methods map 1-to-1 to the NestJS AuthController endpoints.
 * Every request uses Axios with `withCredentials: true` — cookies are managed
 * by the browser and the server (HttpOnly, SameSite, Secure).
 */
export const authApi = {
  /* ─── Session ──────────────────────────────────────────── */

  /** GET /auth/me – guarded by JwtAuthGuard */
  async getMe(): Promise<AuthUser | null> {
    try {
      const { data } = await api.get<AuthUser>('/auth/me');
      return data;
    } catch {
      return null;
    }
  },

  /** POST /auth/refresh – public, uses gc_refresh_token cookie */
  async refresh(): Promise<RefreshResponse> {
    const { data } = await api.post<RefreshResponse>('/auth/refresh');
    return data;
  },

  /* ─── Google OAuth ────────────────────────────────────── */

  /** POST /auth/google – public, body: { accessToken } */
  async googleAuth(accessToken: string): Promise<GoogleAuthResponse> {
    const { data } = await api.post<GoogleAuthResponse>('/auth/google', {
      accessToken,
    });
    return data;
  },

  /* ─── Logout ──────────────────────────────────────────── */

  /** POST /auth/logout – guarded */
  async logout(): Promise<LogoutResponse> {
    const { data } = await api.post<LogoutResponse>('/auth/logout');
    return data;
  },

  /** POST /auth/logout-all – guarded */
  async logoutAll(): Promise<LogoutResponse> {
    const { data } = await api.post<LogoutResponse>('/auth/logout-all');
    return data;
  },

  /* ─── OTP ─────────────────────────────────────────────── */

  /** POST /auth/request-otp – public */
  async requestOtp(payload: RequestOtpPayload): Promise<RequestOtpResponse> {
    const { data } = await api.post<RequestOtpResponse>('/auth/request-otp', payload);
    return data;
  },

  /** POST /auth/verify-otp – public */
  async verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
    const { data } = await api.post<VerifyOtpResponse>('/auth/verify-otp', payload);
    return data;
  },

  /* ─── Profile ─────────────────────────────────────────── */

  /** PATCH /auth/profile – guarded */
  async updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
    const { data } = await api.patch<AuthUser>('/auth/profile', payload);
    return data;
  },

  /* ─── Devices ─────────────────────────────────────────── */

  /** GET /auth/devices – guarded */
  async getDevices(): Promise<UserDevice[]> {
    const { data } = await api.get<UserDevice[]>('/auth/devices');
    return data;
  },

  /** DELETE /auth/devices/:id – guarded */
  async removeDevice(deviceId: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/auth/devices/${deviceId}`);
    return data;
  },
};
