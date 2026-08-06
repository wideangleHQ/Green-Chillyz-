import { DashboardRequestContext } from '../interfaces';

/**
 * Dashboard IAM domain events.
 *
 * This module publishes and never subscribes. Audit, notification and
 * analytics attach their own listeners through EventEmitter2 — dashboard-auth
 * holds no reference to any of them, so a new consumer costs zero changes
 * here, and a failing consumer can never fail a login.
 */

export class DashboardLoginSuccessEvent {
  constructor(
    public readonly storeId: string,
    public readonly storeSlug: string,
    public readonly sessionId: string,
    public readonly occurredAt: Date,
    public readonly context: DashboardRequestContext,
  ) {}
}

export class DashboardLoginFailedEvent {
  constructor(
    /** Null when the presented code matched no store at all. */
    public readonly storeId: string | null,
    public readonly reason: string,
    public readonly failedAttempts: number,
    public readonly lockedUntil: Date | null,
    public readonly occurredAt: Date,
    public readonly context: DashboardRequestContext,
  ) {}
}

export class DashboardLogoutEvent {
  constructor(
    public readonly storeId: string,
    public readonly sessionId: string,
    public readonly allSessions: boolean,
    public readonly occurredAt: Date,
    public readonly context: DashboardRequestContext,
  ) {}
}

export class DashboardSessionRevokedEvent {
  constructor(
    public readonly storeId: string,
    public readonly sessionId: string,
    public readonly reason: string,
    public readonly occurredAt: Date,
    public readonly context: DashboardRequestContext,
  ) {}
}

export class DashboardCodeRotatedEvent {
  constructor(
    public readonly storeId: string,
    public readonly storeSlug: string,
    public readonly revokedSessionCount: number,
    public readonly occurredAt: Date,
  ) {}
}

/**
 * A dashboard session was opened. Distinct from LoginSuccess so consumers that
 * only care about session lifecycle (presence, concurrency) need not filter
 * authentication traffic.
 */
export class DashboardSessionCreatedEvent {
  constructor(
    public readonly storeId: string,
    public readonly sessionId: string,
    public readonly expiresAt: Date,
    public readonly occurredAt: Date,
    public readonly context: DashboardRequestContext,
  ) {}
}

/**
 * A store's access code was derived for the first time by the bootstrap.
 * Carries no plaintext — the code was already known to whoever seeded it.
 */
export class DashboardCodeInitializedEvent {
  constructor(
    public readonly storeId: string,
    public readonly storeSlug: string,
    public readonly encrypted: boolean,
    public readonly occurredAt: Date,
  ) {}
}
