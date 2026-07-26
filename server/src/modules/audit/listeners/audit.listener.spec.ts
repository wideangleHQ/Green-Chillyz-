import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditActorType, AuditSeverity } from '@prisma/client';
import { AuditListener } from './audit.listener';
import { AuditService } from '../services';
import {
  AUDIT_EVENTS,
  AUDIT_ENTITY_TYPES,
  AUDIT_ACTIONS,
} from '../constants';
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

describe('AuditListener', () => {
  let listener: AuditListener;
  let auditService: Record<string, ReturnType<typeof vi.fn>>;

  const recorded = () => auditService.record.mock.calls[0][0];

  beforeEach(() => {
    auditService = { record: vi.fn().mockResolvedValue({ id: 'audit-1' }) };
    listener = new AuditListener(auditService as unknown as AuditService);
  });

  describe('reused platform events', () => {
    it('should audit customer registration', async () => {
      await listener.onCustomerRegistered(
        new CustomerRegisteredNotificationEvent('user-1', 'Ada'),
      );

      expect(recorded()).toMatchObject({
        eventType: AUDIT_EVENTS.CUSTOMER_REGISTERED,
        entityType: AUDIT_ENTITY_TYPES.CUSTOMER,
        action: AUDIT_ACTIONS.REGISTER,
        actorType: AuditActorType.CUSTOMER,
        dedupeKey: 'audit:customer.registered:user-1',
      });
    });

    it('should audit a wallet credit with before and after balances', async () => {
      await listener.onWalletCredited(
        new WalletCreditedEvent('user-1', 50, 550, 'ORDER_CASHBACK', 'Cashback', 'txn-1'),
      );

      const input = recorded();
      expect(input.action).toBe(AUDIT_ACTIONS.CREDIT);
      expect(input.oldValue).toEqual({ balance: 500 });
      expect(input.newValue).toEqual({ balance: 550 });
      expect(input.dedupeKey).toBe('audit:wallet.credited:txn-1');
    });

    it('should audit a wallet debit with before and after balances', async () => {
      await listener.onWalletDebited(
        new WalletDebitedEvent('user-1', 120, 380, 'REWARD_REDEMPTION', 'Redeem', 'txn-2'),
      );

      const input = recorded();
      expect(input.oldValue).toEqual({ balance: 500 });
      expect(input.newValue).toEqual({ balance: 380 });
    });

    it('should audit a reward redemption', async () => {
      await listener.onRewardRedeemed(
        new RewardRedeemedEvent('user-1', 'r1', 'Free Coffee', 120, 'red-1'),
      );

      expect(recorded()).toMatchObject({
        entityType: AUDIT_ENTITY_TYPES.REDEMPTION,
        entityId: 'red-1',
        action: AUDIT_ACTIONS.REDEEM,
        dedupeKey: 'audit:reward.redeemed:red-1',
      });
    });

    it('should audit voucher generation with the code in metadata', async () => {
      await listener.onVoucherGenerated(
        new VoucherGeneratedEvent('user-1', 'v1', 'ABCD', 'Free Coffee', new Date()),
      );

      const input = recorded();
      expect(input.entityType).toBe(AUDIT_ENTITY_TYPES.VOUCHER);
      expect(input.metadata.voucherCode).toBe('ABCD');
    });

    it('should audit a completed game', async () => {
      await listener.onGameCompleted(
        new GameCompletedEvent('user-1', 'g1', 'Spin Wheel', 50, 's1'),
      );

      expect(recorded()).toMatchObject({
        entityType: AUDIT_ENTITY_TYPES.GAME_SESSION,
        entityId: 's1',
        dedupeKey: 'audit:game.completed:s1',
      });
    });
  });

  describe('authentication', () => {
    it('should audit a successful login as INFO', async () => {
      await listener.onAuthEvent(
        new AuthAuditEvent('user-1', AuditActorType.CUSTOMER, 'LOGIN', 'credentials', true),
      );

      expect(recorded()).toMatchObject({
        eventType: AUDIT_EVENTS.CUSTOMER_LOGIN,
        severity: AuditSeverity.INFO,
      });
    });

    it('should raise severity for a failed login', async () => {
      await listener.onAuthEvent(
        new AuthAuditEvent(
          'user-1', AuditActorType.CUSTOMER, 'LOGIN', 'credentials', false,
          {}, 'Invalid password',
        ),
      );

      const input = recorded();
      expect(input.severity).toBe(AuditSeverity.WARNING);
      expect(input.metadata.failureReason).toBe('Invalid password');
    });

    it('should record an employee login under the employee event', async () => {
      await listener.onAuthEvent(
        new AuthAuditEvent('emp-1', AuditActorType.EMPLOYEE, 'LOGIN', 'credentials', true),
      );

      expect(recorded().eventType).toBe(AUDIT_EVENTS.EMPLOYEE_LOGIN);
    });

    it('should carry request context onto the record', async () => {
      await listener.onAuthEvent(
        new AuthAuditEvent('user-1', AuditActorType.CUSTOMER, 'LOGIN', 'google', true, {
          ipAddress: '10.0.0.1',
          correlationId: 'corr-1',
        }),
      );

      const input = recorded();
      expect(input.ipAddress).toBe('10.0.0.1');
      expect(input.correlationId).toBe('corr-1');
    });
  });

  describe('staff actions', () => {
    it('should audit an in-store voucher redemption against both parties', async () => {
      await listener.onVoucherRedeemed(
        new VoucherRedeemedAuditEvent(
          'v1', 'ABCD', 'cust-1', 'staff-1', 'store-1', 'Free Coffee', false,
        ),
      );

      expect(recorded()).toMatchObject({
        eventType: AUDIT_EVENTS.VOUCHER_REDEEMED,
        userId: 'cust-1',
        employeeId: 'staff-1',
        storeId: 'store-1',
      });
    });

    it('should distinguish a QR redemption', async () => {
      await listener.onVoucherRedeemed(
        new VoucherRedeemedAuditEvent(
          'v1', 'ABCD', 'cust-1', 'staff-1', 'store-1', 'Free Coffee', true,
        ),
      );

      expect(recorded().eventType).toBe(AUDIT_EVENTS.QR_REDEMPTION);
    });

    it('should treat a manual wallet adjustment as HIGH severity', async () => {
      await listener.onManualWalletAdjustment(
        new ManualWalletAdjustmentAuditEvent(
          'cust-1', 'staff-1', 500, 'CREDIT', 100, 600, 'Goodwill', 'txn-9',
        ),
      );

      const input = recorded();
      expect(input.severity).toBe(AuditSeverity.HIGH);
      expect(input.oldValue).toEqual({ balance: 100 });
      expect(input.newValue).toEqual({ balance: 600 });
      expect(input.metadata.reason).toBe('Goodwill');
    });

    it('should audit a customer lookup', async () => {
      await listener.onCustomerLookup(
        new CustomerLookupAuditEvent('cust-1', 'staff-1', 'store-1', 'PHONE'),
      );

      expect(recorded()).toMatchObject({
        eventType: AUDIT_EVENTS.CUSTOMER_LOOKUP,
        action: AUDIT_ACTIONS.LOOKUP,
        employeeId: 'staff-1',
      });
    });
  });

  describe('entity mutations', () => {
    it('should audit a create', async () => {
      await listener.onEntityMutation(
        new EntityMutationAuditEvent(
          AUDIT_EVENTS.REWARD_CREATED, AUDIT_ENTITY_TYPES.REWARD, 'r1',
          'CREATE', 'admin-1', AuditActorType.CORPORATE_ADMIN, null,
          { title: 'Free Coffee' },
        ),
      );

      expect(recorded()).toMatchObject({
        eventType: AUDIT_EVENTS.REWARD_CREATED,
        action: 'CREATE',
        severity: AuditSeverity.INFO,
      });
    });

    it('should escalate a delete to HIGH severity', async () => {
      await listener.onEntityMutation(
        new EntityMutationAuditEvent(
          AUDIT_EVENTS.REWARD_DELETED, AUDIT_ENTITY_TYPES.REWARD, 'r1',
          'DELETE', 'admin-1', AuditActorType.CORPORATE_ADMIN,
          { title: 'Free Coffee' }, null,
        ),
      );

      expect(recorded().severity).toBe(AuditSeverity.HIGH);
    });

    it('should retain the before and after snapshots on update', async () => {
      await listener.onEntityMutation(
        new EntityMutationAuditEvent(
          AUDIT_EVENTS.STORE_UPDATED, AUDIT_ENTITY_TYPES.STORE, 's1',
          'UPDATE', 'admin-1', AuditActorType.STORE_MANAGER,
          { name: 'Old' }, { name: 'New' }, 's1',
        ),
      );

      const input = recorded();
      expect(input.oldValue).toEqual({ name: 'Old' });
      expect(input.newValue).toEqual({ name: 'New' });
      expect(input.storeId).toBe('s1');
    });
  });

  describe('access control', () => {
    it('should record a role change as CRITICAL', async () => {
      await listener.onPermissionChange(
        new PermissionChangeAuditEvent(
          'user-1', 'admin-1', 'ROLE', { role: 'customer' }, { role: 'admin' },
        ),
      );

      expect(recorded()).toMatchObject({
        eventType: AUDIT_EVENTS.ROLE_CHANGED,
        entityType: AUDIT_ENTITY_TYPES.ROLE,
        severity: AuditSeverity.CRITICAL,
      });
    });

    it('should record a permission change as CRITICAL', async () => {
      await listener.onPermissionChange(
        new PermissionChangeAuditEvent(
          'user-1', 'admin-1', 'PERMISSION', null, { granted: ['WALLET_CREDIT'] },
        ),
      );

      expect(recorded()).toMatchObject({
        eventType: AUDIT_EVENTS.PERMISSION_CHANGED,
        entityType: AUDIT_ENTITY_TYPES.PERMISSION,
        severity: AuditSeverity.CRITICAL,
      });
    });
  });

  describe('notifications and errors', () => {
    it('should audit a sent notification', async () => {
      await listener.onNotification(
        new NotificationAuditEvent('user-1', 'wallet.credited', 'IN_APP', 'notif-1'),
      );

      expect(recorded()).toMatchObject({
        eventType: AUDIT_EVENTS.NOTIFICATION_SENT,
        action: AUDIT_ACTIONS.SEND,
        dedupeKey: 'audit:notification.sent:notif-1',
      });
    });

    it('should audit a broadcast with its recipient count', async () => {
      await listener.onNotification(
        new NotificationAuditEvent('user-1', 'campaign.started', 'IN_APP', null, true, 'admin-1', 500),
      );

      const input = recorded();
      expect(input.eventType).toBe(AUDIT_EVENTS.BROADCAST_NOTIFICATION);
      expect(input.action).toBe(AUDIT_ACTIONS.BROADCAST);
      expect(input.metadata.recipientCount).toBe(500);
    });

    it('should record a system error as CRITICAL', async () => {
      await listener.onSystemError(
        new SystemErrorAuditEvent('E_DB', 'Connection lost', 'SYSTEM', null),
      );

      expect(recorded().severity).toBe(AuditSeverity.CRITICAL);
    });
  });

  describe('failure isolation', () => {
    it('should never propagate a recording failure to the publisher', async () => {
      auditService.record.mockRejectedValue(new Error('audit store down'));

      await expect(
        listener.onWalletCredited(
          new WalletCreditedEvent('user-1', 50, 550, 'X', 'y', 'txn-1'),
        ),
      ).resolves.toBeUndefined();
    });
  });
});
