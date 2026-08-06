import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CoinEconomyService, dayKey } from '../services/coin-economy.service';
import { CoinRuleService } from '../services/coin-rule.service';
import { CoinLimitService } from '../services/coin-limit.service';
import { CoinCooldownService } from '../services/coin-cooldown.service';
import { CoinCalculationService } from '../services/coin-calculation.service';
import { WalletService } from '../../wallet/services/wallet.service';
import { CoinEconomyCacheService } from '../cache/coin-economy-cache.service';
import { COIN_ECONOMY_EVENTS, COIN_ECONOMY_REJECTIONS } from '../constants';
import { CoinRuleResponse } from '../interfaces';

const activeRule: CoinRuleResponse = {
  id: 'rule-1',
  name: 'Spin Wheel',
  description: null,
  ruleType: 'SPIN_WHEEL' as any,
  coinAmount: 10,
  minCoins: 5,
  maxCoins: 25,
  dailyLimit: 50,
  weeklyLimit: null,
  monthlyLimit: null,
  lifetimeLimit: null,
  cooldownSeconds: 300,
  enabled: true,
  priority: 0,
  status: 'ACTIVE' as any,
  effectiveFrom: null,
  effectiveUntil: null,
  createdBy: null,
  updatedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  archivedAt: null,
} as CoinRuleResponse;

const passLimits = {
  blocked: false,
  reason: null,
  remainingCoins: null,
  evaluations: [],
  blockingEvaluation: null,
};

const passCalc = {
  baseCoins: 10,
  multiplier: 1,
  multipliersApplied: [],
  coinsAfterMultiplier: 10,
  finalCoins: 10,
  clampedByMaxCoins: false,
  clampedByLimit: false,
};

describe('CoinEconomyService', () => {
  let service: CoinEconomyService;
  let rules: Record<string, ReturnType<typeof vi.fn>>;
  let limits: Record<string, ReturnType<typeof vi.fn>>;
  let cooldowns: Record<string, ReturnType<typeof vi.fn>>;
  let calculator: Record<string, ReturnType<typeof vi.fn>>;
  let wallet: Record<string, ReturnType<typeof vi.fn>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;
  let events: { emit: ReturnType<typeof vi.fn> };
  const now = new Date('2026-08-05T10:00:00Z');

  beforeEach(() => {
    rules = {
      findById: vi.fn().mockResolvedValue(activeRule),
      findActiveByType: vi.fn().mockResolvedValue(activeRule),
      findAllActive: vi.fn().mockResolvedValue([activeRule]),
      findActiveGameRules: vi.fn().mockResolvedValue([activeRule]),
    };

    limits = {
      check: vi.fn().mockResolvedValue(passLimits),
      describeUsage: vi.fn().mockResolvedValue({
        usedToday: 0,
        usedThisWeek: 0,
        usedThisMonth: 0,
        usedLifetime: 0,
      }),
    };

    cooldowns = {
      check: vi.fn().mockResolvedValue({
        active: false,
        secondsRemaining: 0,
        availableAt: null,
      }),
      start: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    };

    calculator = {
      calculate: vi.fn().mockResolvedValue(passCalc),
    };

    wallet = {
      credit: vi.fn().mockResolvedValue({
        transaction: { id: 'tx-1' },
        newBalance: 110,
      }),
    };

    cache = {
      setDailyLoginMarker: vi.fn().mockResolvedValue(undefined),
      setCheckInMarker: vi.fn().mockResolvedValue(undefined),
      invalidateUsage: vi.fn().mockResolvedValue(undefined),
    };

    events = { emit: vi.fn() };

    service = new CoinEconomyService(
      rules as unknown as CoinRuleService,
      limits as unknown as CoinLimitService,
      cooldowns as unknown as CoinCooldownService,
      calculator as unknown as CoinCalculationService,
      wallet as unknown as WalletService,
      cache as unknown as CoinEconomyCacheService,
      events as unknown as EventEmitter2,
    );
  });

  // ─── earn ────────────────────────────────────────

  describe('earn', () => {
    it('credits the wallet and returns the decision', async () => {
      const result = await service.earn({
        userId: 'u1',
        ruleType: 'SPIN_WHEEL' as any,
        now,
      });
      expect(result.granted).toBe(true);
      expect(result.coins).toBe(10);
      expect(result.transactionId).toBe('tx-1');
      expect(result.newBalance).toBe(110);
    });

    it('emits COINS_GRANTED', async () => {
      await service.earn({ userId: 'u1', ruleType: 'SPIN_WHEEL' as any, now });
      expect(events.emit).toHaveBeenCalledWith(
        COIN_ECONOMY_EVENTS.COINS_GRANTED,
        expect.any(Object),
      );
    });

    it('starts cooldown after crediting', async () => {
      await service.earn({ userId: 'u1', ruleType: 'SPIN_WHEEL' as any, now });
      expect(cooldowns.start).toHaveBeenCalledWith('u1', 'rule-1', 300, now);
    });

    it('rejects when no rule is found', async () => {
      rules.findActiveByType.mockResolvedValue(null);
      const result = await service.earn({
        userId: 'u1',
        ruleType: 'CUSTOM' as any,
        now,
      });
      expect(result.granted).toBe(false);
      expect(result.reason).toBe(COIN_ECONOMY_REJECTIONS.NO_RULE);
    });

    it('rejects a disabled rule', async () => {
      rules.findActiveByType.mockResolvedValue({
        ...activeRule,
        enabled: false,
        status: 'DISABLED',
      });
      const result = await service.earn({
        userId: 'u1',
        ruleType: 'SPIN_WHEEL' as any,
        now,
      });
      expect(result.granted).toBe(false);
      expect(result.reason).toBe(COIN_ECONOMY_REJECTIONS.RULE_INACTIVE);
    });

    it('rejects when outside effective window', async () => {
      rules.findActiveByType.mockResolvedValue({
        ...activeRule,
        effectiveFrom: new Date('2027-01-01'),
      });
      const result = await service.earn({
        userId: 'u1',
        ruleType: 'SPIN_WHEEL' as any,
        now,
      });
      expect(result.granted).toBe(false);
      expect(result.reason).toBe(COIN_ECONOMY_REJECTIONS.OUTSIDE_WINDOW);
    });

    it('rejects when cooldown is active', async () => {
      cooldowns.check.mockResolvedValue({
        active: true,
        secondsRemaining: 120,
        availableAt: new Date(),
      });
      const result = await service.earn({
        userId: 'u1',
        ruleType: 'SPIN_WHEEL' as any,
        now,
      });
      expect(result.granted).toBe(false);
      expect(result.reason).toBe(COIN_ECONOMY_REJECTIONS.COOLDOWN_ACTIVE);
      expect(result.cooldownSecondsRemaining).toBe(120);
    });

    it('rejects when limit is reached', async () => {
      limits.check.mockResolvedValue({
        blocked: true,
        reason: COIN_ECONOMY_REJECTIONS.DAILY_LIMIT,
        remainingCoins: 0,
        evaluations: [],
        blockingEvaluation: {
          scope: 'DAILY',
          limitId: null,
          maxCoins: 50,
          maxClaims: null,
          usedCoins: 50,
          usedClaims: 5,
          remainingCoins: 0,
          blocked: true,
          reason: COIN_ECONOMY_REJECTIONS.DAILY_LIMIT,
        },
      });
      const result = await service.earn({
        userId: 'u1',
        ruleType: 'SPIN_WHEEL' as any,
        now,
      });
      expect(result.granted).toBe(false);
      expect(result.reason).toBe(COIN_ECONOMY_REJECTIONS.DAILY_LIMIT);
    });

    it('emits LIMIT_REACHED when blocked by a limit', async () => {
      limits.check.mockResolvedValue({
        blocked: true,
        reason: COIN_ECONOMY_REJECTIONS.DAILY_LIMIT,
        remainingCoins: 0,
        evaluations: [],
        blockingEvaluation: {
          scope: 'DAILY',
          limitId: 'limit-1',
          maxCoins: 50,
          maxClaims: null,
          usedCoins: 50,
          usedClaims: 5,
          remainingCoins: 0,
          blocked: true,
          reason: COIN_ECONOMY_REJECTIONS.DAILY_LIMIT,
        },
      });
      await service.earn({ userId: 'u1', ruleType: 'SPIN_WHEEL' as any, now });
      expect(events.emit).toHaveBeenCalledWith(
        COIN_ECONOMY_EVENTS.LIMIT_REACHED,
        expect.any(Object),
      );
    });

    it('rejects when calculation resolves to zero', async () => {
      calculator.calculate.mockResolvedValue({ ...passCalc, finalCoins: 0 });
      const result = await service.earn({
        userId: 'u1',
        ruleType: 'SPIN_WHEEL' as any,
        now,
      });
      expect(result.granted).toBe(false);
      expect(result.reason).toBe(COIN_ECONOMY_REJECTIONS.ZERO_COINS);
    });

    it('throws when neither ruleType nor ruleId is provided', async () => {
      await expect(
        service.earn({ userId: 'u1', now }),
      ).rejects.toThrow(BadRequestException);
    });

    it('resolves by ruleId when provided', async () => {
      await service.earn({ userId: 'u1', ruleId: 'rule-1', now });
      expect(rules.findById).toHaveBeenCalledWith('rule-1');
    });

    it('does not credit the wallet when rejected', async () => {
      rules.findActiveByType.mockResolvedValue(null);
      await service.earn({ userId: 'u1', ruleType: 'CUSTOM' as any, now });
      expect(wallet.credit).not.toHaveBeenCalled();
    });

    it('invalidates usage cache after earning', async () => {
      await service.earn({ userId: 'u1', ruleType: 'SPIN_WHEEL' as any, now });
      expect(cache.invalidateUsage).toHaveBeenCalledWith('u1');
    });
  });

  // ─── preview ─────────────────────────────────────

  describe('preview', () => {
    it('returns the decision without crediting', async () => {
      const result = await service.preview({
        userId: 'u1',
        ruleType: 'SPIN_WHEEL' as any,
        now,
      });
      expect(result.granted).toBe(true);
      expect(result.coins).toBe(10);
      expect(wallet.credit).not.toHaveBeenCalled();
    });
  });

  // ─── Customer views ──────────────────────────────

  describe('getCustomerRules', () => {
    it('returns views for all active rules', async () => {
      const views = await service.getCustomerRules('u1', null, now);
      expect(views).toHaveLength(1);
      expect(views[0].ruleId).toBe('rule-1');
      expect(views[0].available).toBe(true);
    });
  });

  describe('getCustomerGameRules', () => {
    it('returns views for game rules', async () => {
      const views = await service.getCustomerGameRules('u1', null, now);
      expect(views).toHaveLength(1);
    });
  });

  describe('getCustomerDailyLimits', () => {
    it('returns usage breakdown per rule', async () => {
      const views = await service.getCustomerDailyLimits('u1', now);
      expect(views).toHaveLength(1);
      expect(views[0]).toHaveProperty('usedToday');
    });
  });

  describe('getAvailableBonuses', () => {
    it('returns bonus availability per rule', async () => {
      const bonuses = await service.getAvailableBonuses('u1', null, now);
      expect(bonuses).toHaveLength(1);
      expect(bonuses[0].available).toBe(true);
    });
  });
});

// ─── dayKey helper ──────────────────────────────────

describe('dayKey', () => {
  it('formats as YYYY-MM-DD', () => {
    expect(dayKey(new Date('2026-08-05T14:30:00Z'))).toBe('2026-08-05');
  });

  it('zero-pads month and day', () => {
    expect(dayKey(new Date('2026-01-03T00:00:00Z'))).toBe('2026-01-03');
  });
});
