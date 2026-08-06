export interface DashboardStoreScope {
  storeId: string;
  brandId: string;
  scopeType: 'STORE';
}

export interface DashboardStoreContext {
  storeId: string;
  storeName: string;
  storeSlug: string;
  storeCode: string;
  storeType: string;
  brandId: string;
  brandName: string;
  brandSlug: string;
  city: string;
  state: string;
  isActive: boolean;
  dashboardAccessEnabled: boolean;
  scope: DashboardStoreScope;
  role: string;
  permissionsProfile: string;
  permissions: string[];
}

export interface DashboardLoginResponse {
  store: DashboardStoreContext;
  sessionId: string;
  message: string;
}

export interface DashboardSession {
  id: string;
  ipAddress: string;
  userAgent: string | null;
  deviceFingerprint: string | null;
  issuedAt: string;
  lastActivityAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface DashboardCurrentSession extends DashboardSession {
  storeId: string;
}

export interface DashboardMessageResponse {
  message: string;
}

export interface DashboardLogoutAllResponse extends DashboardMessageResponse {
  revokedSessions: number;
}

export interface ApiErrorShape {
  message: string | string[];
  error?: string;
  statusCode: number;
}
