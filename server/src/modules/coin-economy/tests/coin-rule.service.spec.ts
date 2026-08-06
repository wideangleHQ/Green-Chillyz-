import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CoinRuleService } from '../services/coin-rule.service';
import { CoinRuleRepository } from '../repositories/coin-rule.repository';
import { CoinEconomyCacheService } from '../cache/coin-economy-cache.service';
import { COIN_ECONOMY_ERRORS, COIN_ECONOMY_EVENTS } from '../constants';

const mockRule = {
  id: 'rule-1',
  name: 'Daily Login',
  description: 'Coins for opening the app',
  ruleType: 'DAILY_LOGIN',
  coinAmount: 5,
  minCoins: null,
  maxCoins: null,
  dailyLimit: 5,
  weeklyLimit: null,
  monthlyLimit: null,
  lifetimeLimit: null,
  cooldownSeconds: 86400,
  enabled: true,
  priority: 0,
  status: 'ACTIVE',
  effectiveFrom: null,
  effectiveUntil: null,
  createdBy: 'admin-1',
  updatedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  archivedAt: null,
} as any;

describe('CoinRuleService', () => {
  let service: CoinRuleService;
  let repo: Record<string, ReturnType<typeof vi.fn>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;
  let events: { emit: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repo = {
      findMany: vi.fn().mockResolvedValue([[mockRule], 1]),
      findById: vi.fn().mockResolvedValue(mockRule),
      findByIdIncludingDeleted: vi.fn().mockResolvedValue(mockRule),
      findActiveByType: vi.fn().mockResolvedValue(mockRule),
      findAllActive: vi.fn().mockResolvedValue([mockRule]),
      findActiveByTypes: vi.fn().mockResolvedValue([mockRule]),
      findDuplicateActiveType: vi.fn().mockResolvedValue(null),
      findDuplicateName: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(mockRule),
      update: vi.fn().mockResolvedValue(mockRule),
      archiveWithHistory: vi
        .fn()
        .mockResolvedValue({ ...mockRule, status: 'ARCHIVED', enabled: false }),
      restoreWithHistory: vi
        .fn()
        .mockResolvedValue({ ...mockRule, status: 'DRAFT', enabled: false }),
      recordHistory: vi.fn().mockResolvedValue(undefined),
      findHistory: vi.fn().mockResolvedValue([]),
      replaceMetadata: vi.fn().mockResolvedValue(undefined),
      findMetadata: vi.fn().mockResolvedValue([]),
      countByType: vi.fn().mockResolvedValue([]),
    };

    cache = {
      getRule: vi.fn().mockResolvedValue(null),
      setRule: vi.fn().mockResolvedValue(undefined),
      getRuleByType: vi.fn().mockResolvedValue(null),
      setRuleByType: vi.fn().mockResolvedValue(undefined),
      getRules: vi.fn().mockResolvedValue(null),
      setRules: vi.fn().mockResolvedValue(undefined),
      getGameRules: vi.fn().mockResolvedValue(null),
      setGameRules: vi.fn().mockResolvedValue(undefined),
      invalidateRule: vi.fn().mockResolvedValue(undefined),
    };

    events = { emit: vi.fn() };

    service = new CoinRuleService(
      repo as unknown as CoinRuleRepository,
      cache as unknown as CoinEconomyCacheService,
      events as unknown as EventEmitter2,
    );
  });

  // ─── CRUD ─────────────────────────────────────────

  describe('findAll', () => {
    it('returns a paginated page', async () => {
      const result = await service.findAll({});
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('excludes archived rules by default', async () => {
      await service.findAll({});
      expect(repo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ deletedAt: null }),
        0,
        20,
      );
    });

    it('includes archived rules on request', async () => {
      await service.findAll({ includeArchived: true });
      expect(repo.findMany).toHaveBeenCalledWith({}, 0, 20);
    });

    it('filters by rule type', async () => {
      await service.findAll({ ruleType: 'SPIN_WHEEL' as any });
      expect(repo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ ruleType: 'SPIN_WHEEL' }),
        0,
        20,
      );
    });

    it('caps the page size', async () => {
      await service.findAll({ pageSize: 5000 });
      expect(repo.findMany).toHaveBeenCalledWith(expect.anything(), 0, 100);
    });
  });

  describe('findById', () => {
    it('serves from cache', async () => {
      cache.getRule.mockResolvedValue(mockRule);
      await service.findById('rule-1');
      expect(repo.findById).not.toHaveBeenCalled();
    });

    it('falls back to the database and caches', async () => {
      const result = await service.findById('rule-1');
      expect(result.id).toBe('rule-1');
      expect(cache.setRule).toHaveBeenCalled();
    });

    it('throws when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findActiveByType', () => {
    it('returns null when no rule is configured', async () => {
      repo.findActiveByType.mockResolvedValue(null);
      expect(await service.findActiveByType('CUSTOM' as any)).toBeNull();
    });

    it('caches the resolved rule', async () => {
      await service.findActiveByType('DAILY_LOGIN' as any);
      expect(cache.setRuleByType).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const base = {
      name: 'Spin Wheel',
      ruleType: 'SPIN_WHEEL' as any,
      coinAmount: 5,
    };

    it('creates a rule and emits CREATED', async () => {
      await service.create(base, 'admin-1');
      expect(repo.create).toHaveBeenCalled();
      expect(events.emit).toHaveBeenCalledWith(
        COIN_ECONOMY_EVENTS.RULE_CREATED,
        expect.any(Object),
      );
    });

    it('writes a history row', async () => {
      await service.create(base, 'admin-1');
      expect(repo.recordHistory).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATED' }),
      );
    });

    it('stores metadata when provided', async () => {
      await service.create({ ...base, metadata: { tier: 'gold' } });
      expect(repo.replaceMetadata).toHaveBeenCalledWith('rule-1', { tier: 'gold' });
    });

    it('rejects a duplicate name', async () => {
      repo.findDuplicateName.mockResolvedValue({ id: 'other' });
      await expect(service.create(base)).rejects.toThrow(ConflictException);
    });

    it('rejects a second active rule for the same type', async () => {
      repo.findDuplicateActiveType.mockResolvedValue({ id: 'other' });
      await expect(
        service.create({ ...base, status: 'ACTIVE' as any }),
      ).rejects.toThrow(COIN_ECONOMY_ERRORS.DUPLICATE_RULE_TYPE);
    });

    it('allows a draft rule for a type that already has an active one', async () => {
      repo.findDuplicateActiveType.mockResolvedValue({ id: 'other' });
      await expect(service.create(base)).resolves.toBeTruthy();
    });

    it('rejects an inverted coin range', async () => {
      await expect(
        service.create({ ...base, minCoins: 30, maxCoins: 10 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an inverted date range', async () => {
      await expect(
        service.create({
          ...base,
          effectiveFrom: '2026-12-31',
          effectiveUntil: '2026-01-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a daily limit above the weekly limit', async () => {
      await expect(
        service.create({ ...base, dailyLimit: 100, weeklyLimit: 50 }),
      ).rejects.toThrow(COIN_ECONOMY_ERRORS.LIMIT_OVERFLOW);
    });

    it('rejects a daily limit unreachable under the cooldown', async () => {
      await expect(
        service.create({
          ...base,
          coinAmount: 5,
          cooldownSeconds: 86400,
          dailyLimit: 50,
        }),
      ).rejects.toThrow(COIN_ECONOMY_ERRORS.COOLDOWN_CONFLICT);
    });

    it('accepts a daily limit reachable under the cooldown', async () => {
      await expect(
        service.create({
          ...base,
          coinAmount: 5,
          cooldownSeconds: 86400,
          dailyLimit: 5,
        }),
      ).resolves.toBeTruthy();
    });

    it('invalidates the cache', async () => {
      await service.create(base);
      expect(cache.invalidateRule).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates and emits UPDATED', async () => {
      await service.update('rule-1', { coinAmount: 12 }, 'admin-1');
      expect(repo.update).toHaveBeenCalled();
      expect(events.emit).toHaveBeenCalledWith(
        COIN_ECONOMY_EVENTS.RULE_UPDATED,
        expect.any(Object),
      );
    });

    it('throws when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('nope', { coinAmount: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('keeps unspecified fields', async () => {
      await service.update('rule-1', { coinAmount: 12 });
      expect(repo.update).toHaveBeenCalledWith(
        'rule-1',
        expect.objectContaining({ coinAmount: 12, cooldownSeconds: 86400 }),
      );
    });

    it('validates the merged shape, not just the patch', async () => {
      repo.findById.mockResolvedValue({ ...mockRule, maxCoins: 10 });
      await expect(service.update('rule-1', { coinAmount: 50 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects a name that collides with another rule', async () => {
      repo.findDuplicateName.mockResolvedValue({ id: 'other' });
      await expect(service.update('rule-1', { name: 'Taken' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('writes a before/after history row', async () => {
      await service.update('rule-1', { coinAmount: 12 });
      expect(repo.recordHistory).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATED' }),
      );
    });
  });

  describe('enable / disable', () => {
    it('promotes a draft rule to active on enable', async () => {
      repo.findById.mockResolvedValue({ ...mockRule, status: 'DRAFT', enabled: false });
      await service.setEnabled('rule-1', true, 'admin-1');
      expect(repo.update).toHaveBeenCalledWith(
        'rule-1',
        expect.objectContaining({ enabled: true, status: 'ACTIVE' }),
      );
    });

    it('blocks enabling when another active rule owns the type', async () => {
      repo.findById.mockResolvedValue({ ...mockRule, status: 'DRAFT', enabled: false });
      repo.findDuplicateActiveType.mockResolvedValue({ id: 'other' });
      await expect(service.setEnabled('rule-1', true)).rejects.toThrow(
        ConflictException,
      );
    });

    it('moves a rule to DISABLED on disable', async () => {
      await service.setEnabled('rule-1', false, 'admin-1');
      expect(repo.update).toHaveBeenCalledWith(
        'rule-1',
        expect.objectContaining({ enabled: false, status: 'DISABLED' }),
      );
    });

    it('emits ENABLED and DISABLED respectively', async () => {
      repo.findById.mockResolvedValue({ ...mockRule, status: 'DRAFT', enabled: false });
      await service.setEnabled('rule-1', true);
      expect(events.emit).toHaveBeenCalledWith(
        COIN_ECONOMY_EVENTS.RULE_ENABLED,
        expect.any(Object),
      );

      repo.findById.mockResolvedValue(mockRule);
      await service.setEnabled('rule-1', false);
      expect(events.emit).toHaveBeenCalledWith(
        COIN_ECONOMY_EVENTS.RULE_DISABLED,
        expect.any(Object),
      );
    });
  });

  describe('archive / restore', () => {
    it('refuses to archive an enabled active rule', async () => {
      await expect(service.archive('rule-1')).rejects.toThrow(BadRequestException);
    });

    it('archives a disabled rule', async () => {
      repo.findById.mockResolvedValue({ ...mockRule, enabled: false, status: 'DISABLED' });
      await service.archive('rule-1', 'admin-1', 'no longer needed');
      expect(repo.archiveWithHistory).toHaveBeenCalledWith(
        'rule-1',
        expect.any(Object),
        'admin-1',
        'no longer needed',
      );
    });

    it('restores as a draft', async () => {
      const result = await service.restore('rule-1', 'admin-1');
      expect(result.status).toBe('DRAFT');
      expect(events.emit).toHaveBeenCalledWith(
        COIN_ECONOMY_EVENTS.RULE_RESTORED,
        expect.any(Object),
      );
    });
  });

  describe('duplicate', () => {
    it('copies as a disabled draft', async () => {
      await service.duplicate('rule-1', {}, 'admin-1');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Daily Login (Copy)',
          status: 'DRAFT',
          enabled: false,
        }),
      );
    });

    it('uses the supplied name', async () => {
      await service.duplicate('rule-1', { name: 'Custom Copy' });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Custom Copy' }),
      );
    });

    it('carries the metadata over', async () => {
      repo.findMetadata.mockResolvedValue([{ key: 'tier', value: 'gold' }]);
      await service.duplicate('rule-1', {});
      expect(repo.replaceMetadata).toHaveBeenCalledWith('rule-1', { tier: 'gold' });
    });

    it('rejects a copy whose name is taken', async () => {
      repo.findDuplicateName.mockResolvedValue({ id: 'other' });
      await expect(service.duplicate('rule-1', {})).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── Cache ────────────────────────────────────────

  describe('cache invalidation', () => {
    it('invalidates both types when the rule type changes', async () => {
      repo.update.mockResolvedValue({ ...mockRule, ruleType: 'SPIN_WHEEL' });
      await service.update('rule-1', { ruleType: 'SPIN_WHEEL' as any });
      expect(cache.invalidateRule).toHaveBeenCalledTimes(2);
    });

    it('invalidates once when the type is unchanged', async () => {
      await service.update('rule-1', { coinAmount: 7 });
      expect(cache.invalidateRule).toHaveBeenCalledTimes(1);
    });
  });
});
