import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DashboardRewardOverridesService } from '../services/dashboard-reward-overrides.service';
import { DASHBOARD_REWARDS_EVENTS } from '../constants';

describe('DashboardRewardOverridesService', () => {
  let service: DashboardRewardOverridesService;
  let overridesService: Record<string, ReturnType<typeof vi.fn>>;
  let opsCache: Record<string, ReturnType<typeof vi.fn>>;
  let events: { emit: ReturnType<typeof vi.fn> };

  const mockOverride = {
    id: 'override-1',
    storeId: 'store-1',
    ruleId: 'rule-1',
    overrideRewardType: 'MENU_ITEM',
    overrideRewardRef: 'fries-1',
    status: 'ACTIVE',
  };

  const mockPreview = [
    {
      ruleId: 'rule-1',
      name: '500 Coins Dessert',
      rewardType: 'MENU_ITEM',
      rewardRef: 'fries-1',
      source: 'OVERRIDE',
    },
  ];

  beforeEach(() => {
    overridesService = {
      findByStore: vi.fn().mockResolvedValue([mockOverride]),
      findById: vi.fn().mockResolvedValue(mockOverride),
      create: vi.fn().mockResolvedValue(mockOverride),
      update: vi.fn().mockResolvedValue(mockOverride),
      archive: vi.fn().mockResolvedValue(undefined),
      restore: vi.fn().mockResolvedValue(mockOverride),
      previewEffectiveRewards: vi.fn().mockResolvedValue(mockPreview),
      findHistory: vi.fn().mockResolvedValue([]),
    };
    opsCache = { invalidateSection: vi.fn().mockResolvedValue(undefined) };
    events = { emit: vi.fn() };

    service = new DashboardRewardOverridesService(
      overridesService as any,
      opsCache as any,
      events as any,
    );
  });

  describe('listByStore', () => {
    it('returns store overrides', async () => {
      const result = await service.listByStore('store-1');
      expect(overridesService.findByStore).toHaveBeenCalledWith('store-1');
      expect(result).toEqual([mockOverride]);
    });
  });

  describe('getById', () => {
    it('returns override by id', async () => {
      const result = await service.getById('override-1');
      expect(result).toEqual(mockOverride);
    });
  });

  describe('create', () => {
    it('creates override with storeId, emits event, invalidates cache', async () => {
      const dto = { ruleId: 'rule-1', overrideRewardType: 'MENU_ITEM', overrideRewardRef: 'fries-1' };
      await service.create('store-1', dto as any, 'store-1');
      expect(overridesService.create).toHaveBeenCalledWith(
        expect.objectContaining({ storeId: 'store-1', ruleId: 'rule-1' }),
        'store-1',
      );
      expect(events.emit).toHaveBeenCalledWith(
        DASHBOARD_REWARDS_EVENTS.OVERRIDE_CHANGED,
        expect.objectContaining({ action: 'CREATED' }),
      );
      expect(opsCache.invalidateSection).toHaveBeenCalledWith('store-1', 'rewards');
    });
  });

  describe('update', () => {
    it('updates override and emits event', async () => {
      const dto = { overrideRewardRef: 'burger-1' };
      await service.update('override-1', 'store-1', dto as any, 'store-1');
      expect(overridesService.update).toHaveBeenCalledWith('override-1', dto, 'store-1');
      expect(events.emit).toHaveBeenCalledWith(
        DASHBOARD_REWARDS_EVENTS.OVERRIDE_CHANGED,
        expect.objectContaining({ action: 'UPDATED' }),
      );
    });
  });

  describe('archive', () => {
    it('archives override and emits event', async () => {
      await service.archive('override-1', 'store-1', 'store-1');
      expect(overridesService.archive).toHaveBeenCalledWith('override-1', 'store-1');
      expect(events.emit).toHaveBeenCalledWith(
        DASHBOARD_REWARDS_EVENTS.OVERRIDE_CHANGED,
        expect.objectContaining({ action: 'ARCHIVED' }),
      );
    });
  });

  describe('restore', () => {
    it('restores override and invalidates cache', async () => {
      await service.restore('override-1', 'store-1', 'store-1');
      expect(overridesService.restore).toHaveBeenCalledWith('override-1', 'store-1');
      expect(opsCache.invalidateSection).toHaveBeenCalledWith('store-1', 'rewards');
    });
  });

  describe('preview', () => {
    it('returns effective rewards preview', async () => {
      const result = await service.preview('store-1');
      expect(overridesService.previewEffectiveRewards).toHaveBeenCalledWith('store-1');
      expect(result).toEqual(mockPreview);
    });
  });

  describe('getHistory', () => {
    it('returns override history', async () => {
      await service.getHistory('store-1');
      expect(overridesService.findHistory).toHaveBeenCalledWith('store-1');
    });
  });

  describe('bulkCreate', () => {
    it('creates multiple overrides and returns per-rule results', async () => {
      const dto = {
        overrides: [
          { ruleId: 'rule-1', overrideRewardType: 'MENU_ITEM', overrideRewardRef: 'fries-1' },
          { ruleId: 'rule-2', overrideRewardType: 'VOUCHER', overrideRewardRef: 'voucher-1' },
        ],
      };
      const results = await service.bulkCreate('store-1', dto as any, 'store-1');
      expect(results).toHaveLength(2);
      expect(overridesService.create).toHaveBeenCalledTimes(2);
      expect(opsCache.invalidateSection).toHaveBeenCalledTimes(1);
    });

    it('returns error for failed overrides without throwing', async () => {
      overridesService.create.mockRejectedValue(new Error('Duplicate'));
      const dto = {
        overrides: [{ ruleId: 'rule-1', overrideRewardType: 'MENU_ITEM' }],
      };
      const results = await service.bulkCreate('store-1', dto as any, 'store-1');
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Duplicate');
    });
  });

  describe('cache resilience', () => {
    it('does not throw when cache invalidation fails', async () => {
      opsCache.invalidateSection.mockRejectedValue(new Error('Redis down'));
      const dto = { ruleId: 'rule-1', overrideRewardType: 'MENU_ITEM' };
      await expect(service.create('store-1', dto as any, 'store-1')).resolves.toBeDefined();
    });
  });
});
