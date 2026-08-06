import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CoinLimitService,
  isEffective,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  windowStart,
} from '../services/coin-limit.service';
import { CoinLimitRepository } from '../repositories/coin-limit.repository';
import { CoinRuleRepository } from '../repositories/coin-rule.repository';
import { CoinUsageRepository } from '../repositories/coin-usage.repository';
import { CoinEconomyCacheService } from '../cache/coin-economy-cache.service';
import { COIN_ECONOMY_EVENTS, COIN_ECONOMY_REJECTIONS } from '../constants';
import { CoinRuleResponse } from '../interfaces';

const rule = (overrides: Partial<CoinRuleResponse> = {}): CoinRuleResponse =>
  ({
    id: 'rule-1',
    name: 'Spin Wheel',
    ruleType: 'SPIN_WHEEL',
    coinAmount: 10,
    minCoins: null,
    maxCoins: null,
    dailyLimit: null,
    weeklyLimit: null,
    monthlyLimit: null,
    lifetimeLimit: null,
    cooldownSeconds: 0,
    enabled: true,
    priority: 0,
    status: 'ACTIVE',
    effectiveFrom: null,
    effectiveUntil: null,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    archivedAt: null,
    description: null,
    ...overrides,
  }) as CoinRuleResponse;

const mockLimit = {
  id: 'limit-1',
  ruleId: 'rule-1',
  name: 'Daily Cap',
  description: null,
  scope: 'PER_DAY',
  maxCoins: 50,
  maxClaims: null,
  windowSeconds: null,
  storeId: null,
  enabled: true,
  priority: 0,
  effectiveFrom: null,
  effectiveUntil: null,
  createdBy: 'admin-1',
  updatedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
} as any;

describe('CoinLimitService', () => {
  let service: CoinLimitService;
  let repo: Record<string, ReturnType<typeof vi.fn>>;
  let ruleRepo: Record<string, ReturnType<typeof vi.fn>>;
  let usageRepo: Record<string, ReturnType<typeof vi.fn>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;
  let events: { emit: ReturnType<typeof vi.fn> };
  const now = new Date('2026-08-05T10:00:00Z');

  beforeEach(() => {
    repo = {
      findMany: vi.fn().mockResolvedValue([[mockLimit], 1]),
      findById: vi.fn().mockResolvedValue(mockLimit),
      findApplicable: vi.fn().mockResolvedValue([]),
      findByRule: vi.fn().mockResolvedValue([]),
      findDuplicateScope: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(mockLimit),
      update: vi.fn().mockResolvedValue(mockLimit),
      softDelete: vi.fn().mockResolvedValue(undefined),
      restore: vi.fn().mockResolvedValue(mockLimit),
    };

    ruleRepo = {
      findById: vi.fn().mockResolvedValue({ id: 'rule-1', dailyLimit: 100 }),
    };

    usageRepo = {
      getUsage: vi.fn().mockResolvedValue(new Map()),
      findLastGrantAt: vi.fn().mockResolvedValue(null),
    };

    cache = {
      getLimits: vi.fn().mockResolvedValue(null),
      setLimits: vi.fn().mockResolvedValue(undefined),
      invalidateLimits: vi.fn().mockResolvedValue(undefined),
    };

    events = { emit: vi.fn() };

    service = new CoinLimitService(
      repo as unknown as CoinLimitRepository,
      ruleRepo as unknown as CoinRuleRepository,
      usageRepo as unknown as CoinUsageRepository,
      cache as unknown as CoinEconomyCacheService,
      events as unknown as EventEmitter2,
    );
  });

  // ─── Limit engine ─────────────────────────────────

  describe('check', () => {
    it('passes when no limits are configured', async () => {
      const result = await service.check(rule(), { userId: 'u1' }, now);
      expect(result.blocked).toBe(false);
      expect(result.remainingCoins).toBeNull();
    });

    it('blocks when the daily ladder is exhausted', async () => {
      usageRepo.getUsage.mockResolvedValue(
        new Map([['DAILY', { coins: 50, claims: 5 }]]),
      );
      const result = await service.check(
        rule({ dailyLimit: 50 }),
        { userId: 'u1' },
        now,
      );
      expect(result.blocked).toBe(true);
      expect(result.reason).toBe(COIN_ECONOMY_REJECTIONS.DAILY_LIMIT);
    });

    it('reports remaining headroom from rule ladder', async () => {
      usageRepo.getUsage.mockResolvedValue(
        new Map([['DAILY', { coins: 30, claims: 3 }]]),
      );
      const result = await service.check(
        rule({ dailyLimit: 50 }),
        { userId: 'u1' },
        now,
      );
      expect(result.blocked).toBe(false);
      expect(result.remainingCoins).toBe(20);
    });

    it('evaluates configured CoinLimit rows alongside rule ladder', async () => {
      repo.findApplicable.mockResolvedValue([
        {
          ...mockLimit,
          scope: 'PER_DAY',
          maxCoins: 30,
          maxClaims: null,
          windowSeconds: null,
          effectiveFrom: null,
          effectiveUntil: null,
        },
      ]);
      usageRepo.getUsage.mockResolvedValue(
        new Map([['limit:limit-1', { coins: 30, claims: 3 }]]),
      );

      const result = await service.check(rule(), { userId: 'u1' }, now);
      expect(result.blocked).toBe(true);
    });

    it('picks the tightest remaining headroom', async () => {
      usageRepo.getUsage.mockResolvedValue(
        new Map([
          ['DAILY', { coins: 40, claims: 4 }],
          ['WEEKLY', { coins: 100, claims: 10 }],
        ]),
      );
      const result = await service.check(
        rule({ dailyLimit: 50, weeklyLimit: 200 }),
        { userId: 'u1' },
        now,
      );
      expect(result.remainingCoins).toBe(10);
    });

    it('filters out limits outside their effective window', async () => {
      const futureLimit = {
        ...mockLimit,
        effectiveFrom: new Date('2027-01-01'),
        effectiveUntil: null,
        scope: 'PER_DAY',
        maxCoins: 1,
        maxClaims: null,
        windowSeconds: null,
      };
      repo.findApplicable.mockResolvedValue([futureLimit]);

      const result = await service.check(rule(), { userId: 'u1' }, now);
      expect(result.blocked).toBe(false);
    });
  });

  // ─── CRUD ─────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated results', async () => {
      const result = await service.findAll({});
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findById', () => {
    it('throws when not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const base = {
      name: 'Daily Cap',
      scope: 'PER_DAY' as any,
      maxCoins: 50,
    };

    it('creates and emits LIMIT_CHANGED', async () => {
      await service.create(base, 'admin-1');
      expect(repo.create).toHaveBeenCalled();
      expect(events.emit).toHaveBeenCalledWith(
        COIN_ECONOMY_EVENTS.LIMIT_CHANGED,
        expect.any(Object),
      );
    });

    it('validates the rule exists when ruleId is provided', async () => {
      ruleRepo.findById.mockResolvedValue(null);
      await expect(
        service.create({ ...base, ruleId: 'nope' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects a duplicate scope for the same rule', async () => {
      repo.findDuplicateScope.mockResolvedValue({ id: 'other' });
      await expect(service.create(base)).rejects.toThrow(ConflictException);
    });

    it('invalidates cache after creation', async () => {
      await service.create(base);
      expect(cache.invalidateLimits).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates and emits', async () => {
      await service.update('limit-1', { maxCoins: 75 }, 'admin-1');
      expect(repo.update).toHaveBeenCalled();
      expect(events.emit).toHaveBeenCalledWith(
        COIN_ECONOMY_EVENTS.LIMIT_CHANGED,
        expect.any(Object),
      );
    });

    it('throws when not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('nope', { maxCoins: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('archive / restore', () => {
    it('archives and emits', async () => {
      await service.archive('limit-1', 'admin-1');
      expect(repo.softDelete).toHaveBeenCalled();
      expect(events.emit).toHaveBeenCalledWith(
        COIN_ECONOMY_EVENTS.LIMIT_CHANGED,
        expect.any(Object),
      );
    });

    it('throws when archiving a missing limit', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.archive('nope')).rejects.toThrow(NotFoundException);
    });

    it('restores and emits', async () => {
      await service.restore('limit-1', 'admin-1');
      expect(repo.restore).toHaveBeenCalled();
      expect(events.emit).toHaveBeenCalledWith(
        COIN_ECONOMY_EVENTS.LIMIT_CHANGED,
        expect.any(Object),
      );
    });
  });
});

// ─── Pure helpers ─────────────────────────────────

describe('isEffective', () => {
  const now = new Date('2026-08-05T12:00:00Z');

  it('returns true when both bounds are null', () => {
    expect(isEffective(null, null, now)).toBe(true);
  });

  it('returns false before the start', () => {
    expect(isEffective(new Date('2027-01-01'), null, now)).toBe(false);
  });

  it('returns false after the end', () => {
    expect(isEffective(null, new Date('2025-01-01'), now)).toBe(false);
  });

  it('returns true within the range', () => {
    expect(
      isEffective(new Date('2026-01-01'), new Date('2027-01-01'), now),
    ).toBe(true);
  });
});

describe('windowStart helpers', () => {
  const now = new Date('2026-08-05T14:30:00Z');

  it('startOfDay returns midnight', () => {
    const d = startOfDay(now);
    expect(d.getDate()).toBe(now.getDate());
    expect(d.getHours()).toBe(0);
  });

  it('startOfWeek returns the preceding Sunday', () => {
    const d = startOfWeek(now);
    expect(d.getDay()).toBe(0);
  });

  it('startOfMonth returns the first of the month', () => {
    const d = startOfMonth(now);
    expect(d.getDate()).toBe(1);
  });

  it('startOfYear returns January 1st', () => {
    const d = startOfYear(now);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });

  it('windowStart uses windowSeconds when provided', () => {
    const d = windowStart('PER_DAY', now, 3600);
    expect(d!.getTime()).toBe(now.getTime() - 3600 * 1000);
  });

  it('windowStart returns null for LIFETIME scope', () => {
    expect(windowStart('LIFETIME', now, null)).toBeNull();
  });
});
