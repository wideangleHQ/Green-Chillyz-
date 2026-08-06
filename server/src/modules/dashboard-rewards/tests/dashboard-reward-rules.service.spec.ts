import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DashboardRewardRulesService } from '../services/dashboard-reward-rules.service';
import { DASHBOARD_REWARDS_EVENTS } from '../constants';

describe('DashboardRewardRulesService', () => {
  let service: DashboardRewardRulesService;
  let rulesService: Record<string, ReturnType<typeof vi.fn>>;
  let opsCache: Record<string, ReturnType<typeof vi.fn>>;
  let events: { emit: ReturnType<typeof vi.fn> };

  const mockRule = {
    id: 'rule-1',
    name: '500 Coins Dessert',
    ruleType: 'COIN_MILESTONE',
    coinRequirement: 500,
    rewardType: 'MENU_ITEM',
    status: 'ACTIVE',
  };

  beforeEach(() => {
    rulesService = {
      findAll: vi.fn().mockResolvedValue({ data: [mockRule], total: 1 }),
      findById: vi.fn().mockResolvedValue(mockRule),
      findByProfile: vi.fn().mockResolvedValue([mockRule]),
      create: vi.fn().mockResolvedValue(mockRule),
      update: vi.fn().mockResolvedValue(mockRule),
      archive: vi.fn().mockResolvedValue(undefined),
      restore: vi.fn().mockResolvedValue(mockRule),
      duplicate: vi.fn().mockResolvedValue({ ...mockRule, id: 'rule-2' }),
      findMilestones: vi.fn().mockResolvedValue([mockRule]),
    };
    opsCache = { invalidateSection: vi.fn().mockResolvedValue(undefined) };
    events = { emit: vi.fn() };

    service = new DashboardRewardRulesService(
      rulesService as any,
      opsCache as any,
      events as any,
    );
  });

  describe('list', () => {
    it('delegates to rulesService.findAll', async () => {
      const query = { profileId: 'p-1', page: 1, pageSize: 10 };
      await service.list(query as any);
      expect(rulesService.findAll).toHaveBeenCalledWith(expect.objectContaining({ profileId: 'p-1' }));
    });
  });

  describe('getById', () => {
    it('returns rule by id', async () => {
      const result = await service.getById('rule-1');
      expect(result).toEqual(mockRule);
    });
  });

  describe('getByProfile', () => {
    it('returns rules for profile', async () => {
      const result = await service.getByProfile('profile-1');
      expect(rulesService.findByProfile).toHaveBeenCalledWith('profile-1');
      expect(result).toEqual([mockRule]);
    });
  });

  describe('create', () => {
    it('creates rule and invalidates cache', async () => {
      const dto = { name: 'New Rule', profileId: 'p-1', ruleType: 'COIN_MILESTONE' };
      await service.create(dto as any, 'store-1');
      expect(rulesService.create).toHaveBeenCalledWith(dto, 'store-1');
      expect(opsCache.invalidateSection).toHaveBeenCalledWith('store-1', 'rewards');
    });
  });

  describe('update', () => {
    it('updates rule and invalidates cache', async () => {
      await service.update('rule-1', { name: 'Updated' } as any, 'store-1');
      expect(rulesService.update).toHaveBeenCalledWith('rule-1', { name: 'Updated' }, 'store-1');
      expect(opsCache.invalidateSection).toHaveBeenCalledWith('store-1', 'rewards');
    });
  });

  describe('archive', () => {
    it('archives rule and invalidates cache', async () => {
      await service.archive('rule-1', 'store-1');
      expect(rulesService.archive).toHaveBeenCalledWith('rule-1', 'store-1');
      expect(opsCache.invalidateSection).toHaveBeenCalledWith('store-1', 'rewards');
    });
  });

  describe('restore', () => {
    it('restores rule and invalidates cache', async () => {
      await service.restore('rule-1', 'store-1');
      expect(rulesService.restore).toHaveBeenCalledWith('rule-1', 'store-1');
      expect(opsCache.invalidateSection).toHaveBeenCalledWith('store-1', 'rewards');
    });
  });

  describe('duplicate', () => {
    it('duplicates rule and invalidates cache', async () => {
      await service.duplicate('rule-1', { name: 'Copy' } as any, 'store-1');
      expect(rulesService.duplicate).toHaveBeenCalledWith('rule-1', { name: 'Copy' }, 'store-1');
      expect(opsCache.invalidateSection).toHaveBeenCalledWith('store-1', 'rewards');
    });
  });

  describe('enable', () => {
    it('sets status to ACTIVE and emits RULE_PUBLISHED', async () => {
      await service.enable('rule-1', 'store-1');
      expect(rulesService.update).toHaveBeenCalledWith('rule-1', { status: 'ACTIVE' }, 'store-1');
      expect(events.emit).toHaveBeenCalledWith(
        DASHBOARD_REWARDS_EVENTS.RULE_PUBLISHED,
        expect.objectContaining({ ruleId: 'rule-1' }),
      );
    });
  });

  describe('disable', () => {
    it('sets status to DISABLED', async () => {
      await service.disable('rule-1', 'store-1');
      expect(rulesService.update).toHaveBeenCalledWith('rule-1', { status: 'DISABLED' }, 'store-1');
    });
  });

  describe('bulkUpdate', () => {
    it('updates each rule and invalidates cache once', async () => {
      const dto = { ruleIds: ['rule-1', 'rule-2'], status: 'DISABLED' };
      await service.bulkUpdate(dto as any, 'store-1');
      expect(rulesService.update).toHaveBeenCalledTimes(2);
      expect(opsCache.invalidateSection).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMilestones', () => {
    it('delegates to rulesService.findMilestones', async () => {
      await service.getMilestones('profile-1');
      expect(rulesService.findMilestones).toHaveBeenCalledWith('profile-1');
    });

    it('works without profileId', async () => {
      await service.getMilestones();
      expect(rulesService.findMilestones).toHaveBeenCalledWith(undefined);
    });
  });

  describe('cache resilience', () => {
    it('does not throw when cache invalidation fails', async () => {
      opsCache.invalidateSection.mockRejectedValue(new Error('Redis down'));
      await expect(service.create({ name: 'Test' } as any, 'store-1')).resolves.toBeDefined();
    });
  });
});
