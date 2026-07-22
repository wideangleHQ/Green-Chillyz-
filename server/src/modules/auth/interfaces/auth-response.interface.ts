export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUserResponse {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
  roles: { role: string; storeId: string | null }[];
  permissions: string[];
}

export interface GoogleAuthResult {
  user: AuthUserResponse;
  isNewUser: boolean;
}
