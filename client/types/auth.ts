export type AuthModalView = 'sign-in' | 'sign-up' | 'forgot-password';

export type ForgotPasswordStep = 'request-otp' | 'verify-otp' | 'reset-password' | 'success';

/** Mirrors server AuthUserResponse exactly */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
  roles: { role: string; storeId: string | null }[];
  permissions: string[];
}

/** POST /auth/google body */
export interface GoogleAuthPayload {
  accessToken: string;
}

/** POST /auth/google response */
export interface GoogleAuthResponse {
  user: AuthUser;
  isNewUser: boolean;
}

/** POST /auth/refresh response */
export interface RefreshResponse {
  message: string;
}

/** POST /auth/logout | /auth/logout-all response */
export interface LogoutResponse {
  message: string;
}

/** POST /auth/request-otp body – OtpPurpose matches Prisma enum */
export type OtpPurpose = 'PHONE_VERIFY' | 'EMAIL_VERIFY' | 'LOGIN';

export interface RequestOtpPayload {
  identifier: string;
  purpose: OtpPurpose;
}

/** POST /auth/request-otp response */
export interface RequestOtpResponse {
  message: string;
  expiresAt: string;
}

/** POST /auth/verify-otp body */
export interface VerifyOtpPayload {
  identifier: string;
  code: string;
  purpose: OtpPurpose;
}

/** POST /auth/verify-otp response */
export interface VerifyOtpResponse {
  message: string;
  verified: boolean;
}

/** PATCH /auth/profile body – mirrors UpdateProfileDto */
export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
}

/** GET /auth/devices response item */
export interface UserDevice {
  id: string;
  browser: string | null;
  os: string | null;
  platform: string | null;
  lastActiveAt: string;
  isCurrent?: boolean;
}

/** Generic API error shape from the NestJS backend */
export interface ApiErrorShape {
  message: string | string[];
  error?: string;
  statusCode: number;
}
