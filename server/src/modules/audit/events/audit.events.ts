import { AuditActorType, AuditSeverity } from '@prisma/client';
import { AuditContext } from '../interfaces';

/**
 * Audit-specific domain events.
 *
 * Wallet, reward, voucher-generation, game and registration audits reuse the
 * events those modules already publish. These cover actions that had no event
 * yet — mostly staff and dashboard activity.
 *
 * Publishers construct and emit; they never reference the audit module.
 */

export class AuthAuditEvent {
  constructor(
    public readonly userId: string,
    public readonly actorType: AuditActorType,
    public readonly action: 'LOGIN' | 'LOGOUT',
    public readonly provider: string,
    public readonly succeeded: boolean,
    public readonly context: AuditContext = {},
    public readonly failureReason?: string,
  ) {}
}

export class VoucherRedeemedAuditEvent {
  constructor(
    public readonly voucherId: string,
    public readonly voucherCode: string,
    public readonly customerId: string,
    public readonly staffUserId: string,
    public readonly storeId: string | null,
    public readonly rewardTitle: string,
    public readonly viaQr: boolean,
    public readonly context: AuditContext = {},
  ) {}
}

export class EntityMutationAuditEvent {
  constructor(
    public readonly eventType: string,
    public readonly entityType: string,
    public readonly entityId: string,
    public readonly action: 'CREATE' | 'UPDATE' | 'DELETE',
    public readonly actorUserId: string | null,
    public readonly actorType: AuditActorType,
    public readonly oldValue: Record<string, unknown> | null,
    public readonly newValue: Record<string, unknown> | null,
    public readonly storeId: string | null = null,
    public readonly context: AuditContext = {},
    public readonly severity: AuditSeverity = AuditSeverity.INFO,
  ) {}
}

export class ManualWalletAdjustmentAuditEvent {
  constructor(
    public readonly customerId: string,
    public readonly staffUserId: string,
    public readonly amount: number,
    public readonly direction: 'CREDIT' | 'DEBIT',
    public readonly balanceBefore: number,
    public readonly balanceAfter: number,
    public readonly reason: string,
    public readonly transactionId: string,
    public readonly context: AuditContext = {},
  ) {}
}

export class PermissionChangeAuditEvent {
  constructor(
    public readonly targetUserId: string,
    public readonly actorUserId: string,
    public readonly changeType: 'ROLE' | 'PERMISSION',
    public readonly oldValue: Record<string, unknown> | null,
    public readonly newValue: Record<string, unknown> | null,
    public readonly context: AuditContext = {},
  ) {}
}

export class CustomerLookupAuditEvent {
  constructor(
    public readonly customerId: string,
    public readonly staffUserId: string,
    public readonly storeId: string | null,
    public readonly lookupMethod: string,
    public readonly context: AuditContext = {},
  ) {}
}

export class NotificationAuditEvent {
  constructor(
    public readonly recipientUserId: string,
    public readonly templateKey: string | null,
    public readonly channel: string,
    public readonly notificationId: string | null,
    public readonly isBroadcast: boolean = false,
    public readonly actorUserId: string | null = null,
    public readonly recipientCount: number = 1,
  ) {}
}

export class SystemErrorAuditEvent {
  constructor(
    public readonly errorCode: string,
    public readonly message: string,
    public readonly entityType: string,
    public readonly entityId: string | null,
    public readonly context: AuditContext = {},
  ) {}
}
