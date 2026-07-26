import { AuditActorType } from '@prisma/client';
import { AuditContext, AuditCursor } from '../interfaces';
import { AUDIT_ERRORS } from '../constants';

/** Header names already set by the request-id / correlation middleware. */
const REQUEST_ID_HEADER = 'x-request-id';
const CORRELATION_ID_HEADER = 'x-correlation-id';

interface RequestLike {
  ip?: string;
  headers?: Record<string, unknown>;
}

/**
 * Pull the audit context off an Express request so callers never assemble it
 * by hand (and never forget the correlation id).
 */
export function buildAuditContext(req?: RequestLike): AuditContext {
  if (!req) return {};

  const headers = req.headers ?? {};
  const userAgent = asString(headers['user-agent']);

  return {
    ipAddress: req.ip ?? null,
    device: userAgent ? userAgent.slice(0, 255) : null,
    userAgent: userAgent ? userAgent.slice(0, 500) : null,
    requestId: asString(headers[REQUEST_ID_HEADER]),
    correlationId: asString(headers[CORRELATION_ID_HEADER]),
  };
}

function asString(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return null;
}

/**
 * Map the caller's roles onto an actor type. Highest privilege wins so an
 * admin acting through a store account is still recorded as an admin.
 */
export function resolveActorType(roles?: Array<{ role: string }>): AuditActorType {
  if (!roles || roles.length === 0) return AuditActorType.SYSTEM;

  const names = roles.map((r) => r.role.toLowerCase());

  if (names.some((r) => r.includes('super'))) return AuditActorType.SUPER_ADMIN;
  if (names.some((r) => r.includes('corporate') || r === 'admin')) {
    return AuditActorType.CORPORATE_ADMIN;
  }
  if (names.some((r) => r.includes('manager'))) return AuditActorType.STORE_MANAGER;
  if (names.some((r) => r.includes('staff') || r.includes('employee'))) {
    return AuditActorType.EMPLOYEE;
  }
  if (names.some((r) => r.includes('customer'))) return AuditActorType.CUSTOMER;

  return AuditActorType.SYSTEM;
}

export function resolveActorRole(roles?: Array<{ role: string }>): string | null {
  if (!roles || roles.length === 0) return null;
  return roles.map((r) => r.role).join(',').slice(0, 60);
}

/** Opaque base64 cursor over the (createdAt, id) timeline index. */
export function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(
    JSON.stringify({ createdAt: createdAt.toISOString(), id }),
    'utf8',
  ).toString('base64url');
}

export function decodeCursor(cursor: string): AuditCursor {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as AuditCursor;

    if (!parsed.createdAt || !parsed.id) {
      throw new Error('missing fields');
    }
    if (Number.isNaN(Date.parse(parsed.createdAt))) {
      throw new Error('bad date');
    }
    return parsed;
  } catch {
    throw new Error(AUDIT_ERRORS.INVALID_CURSOR);
  }
}

/** Field names whose values must never reach an audit row. */
const REDACTED_KEYS = [
  'password',
  'passwordhash',
  'newpassword',
  'currentpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'apikey',
  'authorization',
  'signature',
  'otp',
  'pin',
  'cvv',
];

/**
 * Strip credentials before persisting. Audit trails are long-lived and widely
 * readable inside the org, so a leaked secret here is a durable one.
 */
export function redactSensitive(
  value: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!value) return null;

  const output: Record<string, unknown> = {};

  for (const [key, raw] of Object.entries(value)) {
    if (REDACTED_KEYS.includes(key.toLowerCase())) {
      output[key] = '[REDACTED]';
      continue;
    }

    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      output[key] = redactSensitive(raw as Record<string, unknown>);
      continue;
    }

    output[key] = raw;
  }

  return output;
}

/**
 * Compute the changed subset between two snapshots so an UPDATE audit stores
 * the diff rather than two full copies.
 */
export function diffValues(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): {
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
} {
  if (!before || !after) {
    return {
      oldValue: redactSensitive(before),
      newValue: redactSensitive(after),
    };
  }

  const oldValue: Record<string, unknown> = {};
  const newValue: Record<string, unknown> = {};

  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      oldValue[key] = before[key];
      newValue[key] = after[key];
    }
  }

  return {
    oldValue: Object.keys(oldValue).length > 0 ? redactSensitive(oldValue) : null,
    newValue: Object.keys(newValue).length > 0 ? redactSensitive(newValue) : null,
  };
}
