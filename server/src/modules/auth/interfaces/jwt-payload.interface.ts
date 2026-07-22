export interface JwtPayload {
  sub: string;
  email: string;
  roles: RoleWithScope[];
  permissions: string[];
  tokenVersion: number;
  permissionsVersion: number;
  sessionId: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface RoleWithScope {
  role: string;
  storeId: string | null;
}
