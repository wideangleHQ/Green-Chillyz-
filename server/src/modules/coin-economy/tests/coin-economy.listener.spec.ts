import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoinEconomyListener } from '../listeners/coin-economy.listener';
import { AuditService } from '../../audit/services/audit.service';
import { COIN_ECONOMY_EVENTS } from '../constants';
import {
  CoinRuleCreatedEvent,
  CoinRuleUpdatedEvent,
  CoinRuleEnabledEvent,
  CoinRuleDisabledEvent,
  CoinRuleArchivedEvent,
  CoinRuleRestoredEvent,
  CoinRuleDuplicatedEvent,
  CoinMultiplierChangedEvent,
  CoinLimitChangedEvent,
  CoinLimitReachedEvent,
} from '../events';

describe('CoinEconomyListener', () => {
  let listener: CoinEconomyListener;
  let audit: { record: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    audit = { record: vi.fn().mockResolvedValue(undefined) };
    listener = new CoinEconomyListener(audit as unknown as AuditService);
  });

  it('logs rule creation', async () => {
    await listener.onRuleCreated(
      new CoinRuleCreatedEvent('rule-1', 'Daily Login', 'DAILY_LOGIN' as any, 5, 'admin-1'),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: COIN_ECONOMY_EVENTS.RULE_CREATED,
        entityType: 'coinRule',
        entityId: 'rule-1',
        action: 'CREATE',
      }),
    );
  });

  it('logs rule update with old/new values', async () => {
    await listener.onRuleUpdated(
      new CoinRuleUpdatedEvent(
        'rule-1',
        'DAILY_LOGIN' as any,
        ['coinAmount'],
        { coinAmount: 5 },
        { coinAmount: 10 },
        'admin-1',
      ),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: COIN_ECONOMY_EVENTS.RULE_UPDATED,
        oldValue: { coinAmount: 5 },
        newValue: { coinAmount: 10 },
      }),
    );
  });

  it('logs rule enabled with WARNING severity', async () => {
    await listener.onRuleEnabled(
      new CoinRuleEnabledEvent('rule-1', 'Daily Login', 'DAILY_LOGIN' as any, 'admin-1'),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ENABLE',
        severity: 'WARNING',
      }),
    );
  });

  it('logs rule disabled', async () => {
    await listener.onRuleDisabled(
      new CoinRuleDisabledEvent('rule-1', 'Daily Login', 'DAILY_LOGIN' as any, 'admin-1'),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DISABLE' }),
    );
  });

  it('logs rule archived', async () => {
    await listener.onRuleArchived(
      new CoinRuleArchivedEvent('rule-1', 'Daily Login', 'DAILY_LOGIN' as any, 'admin-1'),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ARCHIVE' }),
    );
  });

  it('logs rule restored', async () => {
    await listener.onRuleRestored(
      new CoinRuleRestoredEvent('rule-1', 'Daily Login', 'DAILY_LOGIN' as any, 'admin-1'),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'RESTORE' }),
    );
  });

  it('logs rule duplicated', async () => {
    await listener.onRuleDuplicated(
      new CoinRuleDuplicatedEvent('rule-1', 'new-1', 'DAILY_LOGIN' as any, 'admin-1'),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DUPLICATE',
        entityId: 'new-1',
      }),
    );
  });

  it('logs multiplier changed with HIGH severity', async () => {
    await listener.onMultiplierChanged(
      new CoinMultiplierChangedEvent('mult-1', 'Weekend 2x', 'UPDATED', 1.5, 2, 'admin-1'),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: COIN_ECONOMY_EVENTS.MULTIPLIER_CHANGED,
        severity: 'HIGH',
        oldValue: { multiplier: 1.5 },
        newValue: { multiplier: 2 },
      }),
    );
  });

  it('logs limit changed', async () => {
    await listener.onLimitChanged(
      new CoinLimitChangedEvent('limit-1', 'Daily Cap', 'PER_DAY' as any, 'CREATED', 'rule-1', 'admin-1'),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: COIN_ECONOMY_EVENTS.LIMIT_CHANGED,
        entityType: 'coinLimit',
      }),
    );
  });

  it('logs limit reached with dedupe key', async () => {
    const event = new CoinLimitReachedEvent(
      'u1',
      'rule-1',
      'SPIN_WHEEL' as any,
      'DAILY',
      'limit-1',
      50,
      50,
    );
    await listener.onLimitReached(event);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: COIN_ECONOMY_EVENTS.LIMIT_REACHED,
        action: 'LIMIT_REACHED',
        dedupeKey: expect.stringContaining('coin-limit-reached:u1:rule-1:DAILY:'),
      }),
    );
  });
});
