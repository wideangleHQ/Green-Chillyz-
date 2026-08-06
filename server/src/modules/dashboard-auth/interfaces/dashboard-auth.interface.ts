import { DASHBOARD_TOKEN_TYPE } from '../constants';

/**
 * The store scope a dashboard session is confined to.
 *
 * A dashboard principal is a store, so the scope is always exactly one store
 * today. It is modelled as an object rather than a bare id so the Permission
 * Engine can widen it (regional, brand-wide, corporate) without changing the
 * token shape or any consumer.
 */
export interface DashboardStoreScope {
  storeId: string;
  brandId: string;
  scopeType: 'STORE';
}

/**
 * Claims carried by `gc_dashboard_access_token`.
 *
 * `typ` is asserted on every validation: it is what stops a customer token
 * signed with a leaked secret from ever satisfying a dashboard guard.
 */
export interface DashboardJwtPayload {
  /** Store id — the dashboard principal. */
  sub: string;
  /** Dashboard session id. */
  sid: string;
  typ: typeof DASHBOARD_TOKEN_TYPE;
  slug: string;
  scope: DashboardStoreScope;
  role: string;
  permissionsProfile: string;
  /** Bumped on logout-all and code rotation to strand outstanding tokens. */
  tokenVersion: number;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

/** Resolved principal handed to guards, resolvers and controllers. */
export interface DashboardPrincipal {
  storeId: string;
  sessionId: string;
  slug: string;
  scope: DashboardStoreScope;
  role: string;
  permissionsProfile: string;
  permissions: string[];
}

export interface DashboardTokens {
  accessToken: string;
  refreshToken: string;
}

export interface DashboardSessionData {
  sessionId: string;
  storeId: string;
  ipAddress: string;
  userAgent: string | null;
  deviceFingerprint: string | null;
  issuedAt: string;
  lastActivityAt: string;
  expiresAt: string;
}

export interface DashboardSessionSummary {
  id: string;
  ipAddress: string;
  userAgent: string | null;
  deviceFingerprint: string | null;
  issuedAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

/** Store payload returned to the dashboard after login. Never customer data. */
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

export interface DashboardLoginResult {
  tokens: DashboardTokens;
  store: DashboardStoreContext;
  sessionId: string;
}

export interface DashboardRequestContext {
  ipAddress: string;
  userAgent: string | null;
  deviceFingerprint: string | null;
}

/** Store row the login path needs — nothing more is ever selected. */
export interface DashboardStoreCredential {
  id: string;
  slug: string;
  brandId: string;
  isActive: boolean;
  deletedAt: Date | null;
  dashboardCodeHash: string | null;
  dashboardAccessEnabled: boolean;
  dashboardFailedAttempts: number;
  dashboardLockedUntil: Date | null;
}
