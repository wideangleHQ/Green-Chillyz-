import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditActorType, AuditSeverity } from '@prisma/client';
import { AuditService } from '../services';
import {
  AUDIT_EVENTS,
  AUDIT_ENTITY_TYPES,
  AUDIT_ACTIONS,
} from '../constants';
import { AuditRecordInput } from '../interfaces';
import {
  AuthAuditEvent,
  VoucherRedeemedAuditEvent,
  EntityMutationAuditEvent,
  ManualWalletAdjustmentAuditEvent,
  PermissionChangeAuditEvent,
  CustomerLookupAuditEvent,
  NotificationAuditEvent,
  SystemErrorAuditEvent,
} from '../events';
import {
  WalletCreditedEvent,
  WalletDebitedEvent,
  RewardRedeemedEvent,
  VoucherGeneratedEvent,
  GameCompletedEvent,
  CustomerRegisteredNotificationEvent,
} from '../../notification/events';

/**
 * The single bridge from domain events to the audit trail.
 *
 * Feature modules emit; this listener writes. It subscribes alongside the
 * notification listener — EventEmitter2 fans out to both, so a module gains
 * an audit trail without knowing this module exists.
 *
 * Every handler supplies a dedupeKey derived from the underlying business
 * identifier, so a redelivered event can never produce a second row.
 */
@Injectable()
export class AuditListener {
  private readonly logger = new Logger(AuditListener.name);

  constructor(private readonly auditService: AuditService) {}

  // ─── Reused platform events ───────────────────────────

  @OnEvent(AUDIT_EVENTS.CUSTOMER_REGISTERED)
  async onCustomerRegistered(
    event: CustomerRegisteredNotificationEvent,
  ): Promise<void> {
    await this.safeRecord({
      eventType: AUDIT_EVENTS.CUSTOMER_REGISTERED,
      entityType: AUDIT_ENTITY_TYPES.CUSTOMER,
      entityId: event.userId,
      action: AUDIT_ACTIONS.REGISTER,
      actorType: AuditActorType.CUSTOMER,
      userId: event.userId,
      severity: AuditSeverity.INFO,
      metadata: { fullName: event.fullName },
      dedupeKey: `audit:customer.registered:${event.userId}`,
    });
  }

  @OnEvent(AUDIT_EVENTS.WALLET_CREDITED)
  async onWalletCredited(event: WalletCreditedEvent): Promise<void> {
    await this.safeRecord({
      eventType: AUDIT_EVENTS.WALLET_CREDITED,
      entityType: AUDIT_ENTITY_TYPES.WALLET,
      entityId: event.userId,
      action: AUDIT_ACTIONS.CREDIT,
      actorType: AuditActorType.SYSTEM,
      userId: event.userId,
      severity: AuditSeverity.INFO,
      oldValue: { balance: event.newBalance - event.amount },
      newValue: { balance: event.newBalance },
      metadata: {
        amount: event.amount,
        source: event.source,
        description: event.description,
        transactionId: event.transactionId,
      },
      dedupeKey: `audit:wallet.credited:${event.transactionId}`,
    });
  }

  @OnEvent(AUDIT_EVENTS.WALLET_DEBITED)
  async onWalletDebited(event: WalletDebitedEvent): Promise<void> {
    await this.safeRecord({
      eventType: AUDIT_EVENTS.WALLET_DEBITED,
      entityType: AUDIT_ENTITY_TYPES.WALLET,
      entityId: event.userId,
      action: AUDIT_ACTIONS.DEBIT,
      actorType: AuditActorType.SYSTEM,
      userId: event.userId,
      severity: AuditSeverity.INFO,
      oldValue: { balance: event.newBalance + event.amount },
      newValue: { balance: event.newBalance },
      metadata: {
        amount: event.amount,
        source: event.source,
        description: event.description,
        transactionId: event.transactionId,
      },
      dedupeKey: `audit:wallet.debited:${event.transactionId}`,
    });
  }

  @OnEvent(AUDIT_EVENTS.REWARD_REDEEMED)
  async onRewardRedeemed(event: RewardRedeemedEvent): Promise<void> {
    await this.safeRecord({
      eventType: AUDIT_EVENTS.REWARD_REDEEMED,
      entityType: AUDIT_ENTITY_TYPES.REDEMPTION,
      entityId: event.redemptionId,
      action: AUDIT_ACTIONS.REDEEM,
      actorType: AuditActorType.CUSTOMER,
      userId: event.userId,
      severity: AuditSeverity.INFO,
      metadata: {
        rewardId: event.rewardId,
        rewardTitle: event.rewardTitle,
        coinsSpent: event.coinsSpent,
      },
      dedupeKey: `audit:reward.redeemed:${event.redemptionId}`,
    });
  }

  @OnEvent(AUDIT_EVENTS.VOUCHER_GENERATED)
  async onVoucherGenerated(event: VoucherGeneratedEvent): Promise<void> {
    await this.safeRecord({
      eventType: AUDIT_EVENTS.VOUCHER_GENERATED,
      entityType: AUDIT_ENTITY_TYPES.VOUCHER,
      entityId: event.voucherId,
      action: AUDIT_ACTIONS.GENERATE,
      actorType: AuditActorType.SYSTEM,
      userId: event.userId,
      severity: AuditSeverity.INFO,
      metadata: {
        voucherCode: event.voucherCode,
        rewardTitle: event.rewardTitle,
        expiresAt: event.expiresAt.toISOString(),
      },
      dedupeKey: `audit:voucher.generated:${event.voucherId}`,
    });
  }

  @OnEvent(AUDIT_EVENTS.GAME_COMPLETED)
  async onGameCompleted(event: GameCompletedEvent): Promise<void> {
    await this.safeRecord({
      eventType: AUDIT_EVENTS.GAME_COMPLETED,
      entityType: AUDIT_ENTITY_TYPES.GAME_SESSION,
      entityId: event.sessionId,
      action: AUDIT_ACTIONS.COMPLETE,
      actorType: AuditActorType.CUSTOMER,
      userId: event.userId,
      severity: AuditSeverity.INFO,
      metadata: {
        gameId: event.gameId,
        gameName: event.gameName,
        coinsWon: event.coinsWon,
      },
      dedupeKey: `audit:game.completed:${event.sessionId}`,
    });
  }

  // ─── Authentication ───────────────────────────────────

  @OnEvent(AUDIT_EVENTS.CUSTOMER_LOGIN)
  @OnEvent(AUDIT_EVENTS.EMPLOYEE_LOGIN)
  @OnEvent(AUDIT_EVENTS.DASHBOARD_LOGIN)
  async onAuthEvent(event: AuthAuditEvent): Promise<void> {
    await this.safeRecord({
      eventType:
        event.actorType === AuditActorType.CUSTOMER
          ? AUDIT_EVENTS.CUSTOMER_LOGIN
          : AUDIT_EVENTS.EMPLOYEE_LOGIN,
      entityType: AUDIT_ENTITY_TYPES.SESSION,
      entityId: event.userId,
      action: event.action,
      actorType: event.actorType,
      userId: event.userId,
      // A failed sign-in is the signal worth surfacing, not a successful one.
      severity: event.succeeded ? AuditSeverity.INFO : AuditSeverity.WARNING,
      metadata: {
        provider: event.provider,
        succeeded: event.succeeded,
        ...(event.failureReason && { failureReason: event.failureReason }),
      },
      ...this.spreadContext(event.context),
    });
  }

  // ─── Vouchers redeemed in store ───────────────────────

  @OnEvent(AUDIT_EVENTS.VOUCHER_REDEEMED)
  @OnEvent(AUDIT_EVENTS.QR_REDEMPTION)
  async onVoucherRedeemed(event: VoucherRedeemedAuditEvent): Promise<void> {
    await this.safeRecord({
      eventType: event.viaQr
        ? AUDIT_EVENTS.QR_REDEMPTION
        : AUDIT_EVENTS.VOUCHER_REDEEMED,
      entityType: AUDIT_ENTITY_TYPES.VOUCHER,
      entityId: event.voucherId,
      action: AUDIT_ACTIONS.REDEEM,
      actorType: AuditActorType.EMPLOYEE,
      userId: event.customerId,
      employeeId: event.staffUserId,
      storeId: event.storeId,
      severity: AuditSeverity.INFO,
      metadata: {
        voucherCode: event.voucherCode,
        rewardTitle: event.rewardTitle,
        viaQr: event.viaQr,
      },
      dedupeKey: `audit:voucher.redeemed:${event.voucherId}`,
      ...this.spreadContext(event.context),
    });
  }

  // ─── Entity mutations (store, reward, campaign, offer) ──

  @OnEvent(AUDIT_EVENTS.STORE_CREATED)
  @OnEvent(AUDIT_EVENTS.STORE_UPDATED)
  @OnEvent(AUDIT_EVENTS.REWARD_CREATED)
  @OnEvent(AUDIT_EVENTS.REWARD_UPDATED)
  @OnEvent(AUDIT_EVENTS.REWARD_DELETED)
  @OnEvent(AUDIT_EVENTS.CAMPAIGN_CREATED)
  @OnEvent(AUDIT_EVENTS.OFFER_CREATED)
  async onEntityMutation(event: EntityMutationAuditEvent): Promise<void> {
    await this.safeRecord({
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      action: event.action,
      actorType: event.actorType,
      userId: event.actorUserId,
      employeeId: event.actorUserId,
      storeId: event.storeId,
      // Deletions are the destructive case and warrant a closer look.
      severity:
        event.action === AUDIT_ACTIONS.DELETE
          ? AuditSeverity.HIGH
          : event.severity,
      oldValue: event.oldValue,
      newValue: event.newValue,
      ...this.spreadContext(event.context),
    });
  }

  // ─── Staff actions on customer money and records ──────

  @OnEvent(AUDIT_EVENTS.MANUAL_WALLET_ADJUSTMENT)
  async onManualWalletAdjustment(
    event: ManualWalletAdjustmentAuditEvent,
  ): Promise<void> {
    await this.safeRecord({
      eventType: AUDIT_EVENTS.MANUAL_WALLET_ADJUSTMENT,
      entityType: AUDIT_ENTITY_TYPES.WALLET,
      entityId: event.customerId,
      action: AUDIT_ACTIONS.ADJUST,
      actorType: AuditActorType.EMPLOYEE,
      userId: event.customerId,
      employeeId: event.staffUserId,
      // A human moving another person's balance is always worth review.
      severity: AuditSeverity.HIGH,
      oldValue: { balance: event.balanceBefore },
      newValue: { balance: event.balanceAfter },
      metadata: {
        amount: event.amount,
        direction: event.direction,
        reason: event.reason,
        transactionId: event.transactionId,
      },
      dedupeKey: `audit:wallet.manual:${event.transactionId}`,
      ...this.spreadContext(event.context),
    });
  }

  @OnEvent(AUDIT_EVENTS.CUSTOMER_LOOKUP)
  async onCustomerLookup(event: CustomerLookupAuditEvent): Promise<void> {
    await this.safeRecord({
      eventType: AUDIT_EVENTS.CUSTOMER_LOOKUP,
      entityType: AUDIT_ENTITY_TYPES.CUSTOMER,
      entityId: event.customerId,
      action: AUDIT_ACTIONS.LOOKUP,
      actorType: AuditActorType.EMPLOYEE,
      userId: event.customerId,
      employeeId: event.staffUserId,
      storeId: event.storeId,
      severity: AuditSeverity.INFO,
      metadata: { lookupMethod: event.lookupMethod },
      ...this.spreadContext(event.context),
    });
  }

  // ─── Access control ───────────────────────────────────

  @OnEvent(AUDIT_EVENTS.PERMISSION_CHANGED)
  @OnEvent(AUDIT_EVENTS.ROLE_CHANGED)
  async onPermissionChange(event: PermissionChangeAuditEvent): Promise<void> {
    await this.safeRecord({
      eventType:
        event.changeType === 'ROLE'
          ? AUDIT_EVENTS.ROLE_CHANGED
          : AUDIT_EVENTS.PERMISSION_CHANGED,
      entityType:
        event.changeType === 'ROLE'
          ? AUDIT_ENTITY_TYPES.ROLE
          : AUDIT_ENTITY_TYPES.PERMISSION,
      entityId: event.targetUserId,
      action: AUDIT_ACTIONS.UPDATE,
      actorType: AuditActorType.CORPORATE_ADMIN,
      userId: event.targetUserId,
      employeeId: event.actorUserId,
      // Privilege escalation is the highest-value thing an attacker can do.
      severity: AuditSeverity.CRITICAL,
      oldValue: event.oldValue,
      newValue: event.newValue,
      ...this.spreadContext(event.context),
    });
  }

  // ─── Notifications ────────────────────────────────────

  @OnEvent(AUDIT_EVENTS.NOTIFICATION_SENT)
  @OnEvent(AUDIT_EVENTS.BROADCAST_NOTIFICATION)
  async onNotification(event: NotificationAuditEvent): Promise<void> {
    await this.safeRecord({
      eventType: event.isBroadcast
        ? AUDIT_EVENTS.BROADCAST_NOTIFICATION
        : AUDIT_EVENTS.NOTIFICATION_SENT,
      entityType: AUDIT_ENTITY_TYPES.NOTIFICATION,
      entityId: event.notificationId,
      action: event.isBroadcast ? AUDIT_ACTIONS.BROADCAST : AUDIT_ACTIONS.SEND,
      actorType: event.actorUserId
        ? AuditActorType.CORPORATE_ADMIN
        : AuditActorType.SYSTEM,
      userId: event.recipientUserId,
      employeeId: event.actorUserId,
      severity: AuditSeverity.INFO,
      metadata: {
        templateKey: event.templateKey,
        channel: event.channel,
        recipientCount: event.recipientCount,
      },
      ...(event.notificationId && {
        dedupeKey: `audit:notification.sent:${event.notificationId}`,
      }),
    });
  }

  // ─── System errors ────────────────────────────────────

  @OnEvent(AUDIT_EVENTS.SYSTEM_ERROR)
  async onSystemError(event: SystemErrorAuditEvent): Promise<void> {
    await this.safeRecord({
      eventType: AUDIT_EVENTS.SYSTEM_ERROR,
      entityType: event.entityType,
      entityId: event.entityId,
      action: AUDIT_ACTIONS.ERROR,
      actorType: AuditActorType.SYSTEM,
      severity: AuditSeverity.CRITICAL,
      metadata: { errorCode: event.errorCode, message: event.message },
      ...this.spreadContext(event.context),
    });
  }

  private spreadContext(
    context?: {
      ipAddress?: string | null;
      device?: string | null;
      userAgent?: string | null;
      requestId?: string | null;
      correlationId?: string | null;
    },
  ): Partial<AuditRecordInput> {
    if (!context) return {};
    return {
      ipAddress: context.ipAddress,
      device: context.device,
      userAgent: context.userAgent,
      requestId: context.requestId,
      correlationId: context.correlationId,
    };
  }

  /**
   * AuditService already swallows failures; this is the second belt so a
   * malformed event payload can never surface in the publisher's call stack.
   */
  private async safeRecord(input: AuditRecordInput): Promise<void> {
    try {
      await this.auditService.record(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Audit listener failed for ${input.eventType}: ${message}`);
    }
  }
}
