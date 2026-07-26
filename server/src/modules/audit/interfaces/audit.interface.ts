import { AuditActorType, AuditSeverity } from '@prisma/client';

/**
 * Everything needed to append one audit row.
 *
 * Only eventType, entityType and action are required — the rest is enrichment
 * that varies by event, which keeps new event types from needing interface
 * changes.
 */
export interface AuditRecordInput {
  eventType: string;
  entityType: string;
  action: string;
  entityId?: string | null;
  actorType?: AuditActorType;
  actorRole?: string | null;
  userId?: string | null;
  employeeId?: string | null;
  storeId?: string | null;
  severity?: AuditSeverity;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  device?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  correlationId?: string | null;
  /** Collapses a redelivered event onto a single row. */
  dedupeKey?: string | null;
}

/** Request-scoped context attached to an audited action. */
export interface AuditContext {
  ipAddress?: string | null;
  device?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  correlationId?: string | null;
}

export interface AuditLogResponse {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string | null;
  action: string;
  actorType: AuditActorType;
  actorRole: string | null;
  userId: string | null;
  employeeId: string | null;
  storeId: string | null;
  severity: AuditSeverity;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  device: string | null;
  requestId: string | null;
  correlationId: string | null;
  createdAt: Date;
}

/**
 * Cursor pagination. Audit tables grow without bound, so OFFSET would degrade
 * linearly; the cursor keys on (createdAt, id) which matches the timeline index.
 */
export interface AuditCursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface AuditCursor {
  createdAt: string;
  id: string;
}

export interface AuditActionCount {
  action: string;
  count: number;
}

export interface AuditEventCount {
  eventType: string;
  count: number;
}

export interface AuditActorActivity {
  userId: string;
  count: number;
}

export interface AuditStoreActivity {
  storeId: string;
  count: number;
}

export interface AuditAnalytics {
  totalEvents: number;
  highSeverityEvents: number;
  criticalEvents: number;
  manualAdjustments: number;
  rewardRedemptions: number;
  mostFrequentActions: AuditActionCount[];
  mostFrequentEvents: AuditEventCount[];
  employeeActivity: AuditActorActivity[];
  storeActivity: AuditStoreActivity[];
  severityBreakdown: Array<{ severity: AuditSeverity; count: number }>;
  actorBreakdown: Array<{ actorType: AuditActorType; count: number }>;
}

/**
 * Signals worth a human look: repeated manual balance adjustments, bursts of
 * customer lookups, and anything already flagged CRITICAL.
 */
export interface AuditFraudIndicators {
  manualAdjustmentsByActor: AuditActorActivity[];
  customerLookupsByActor: AuditActorActivity[];
  criticalEvents: AuditLogResponse[];
  highSeverityCount: number;
}
