import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RewardRulesService } from '../services/reward-rules.service';
import { RewardRulesRepository } from '../repositories/reward-rules.repository';
import { RewardRulesCacheService } from '../cache/reward-rules-cache.service';
import { RewardProfileRepository } from '../../reward-profile/repositories/reward-profile.repository';
import { REWARD_RULE_ERRORS, REWARD_RULE_EVENTS } from '../constants';

describe('RewardRulesService', () => {
  let service: RewardRulesService;
  let repo: Record<string, ReturnType<typeof vi.fn>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;
  let profileRepo: Record<string, ReturnType<typeof vi.fn>>;
  let events: { emit: ReturnType<typeof vi.fn> };

  const mockProfile = {
    id: 'profile-1',
    name: 'Default Profile',
    slug: 'default-profile',
    status: 'ACTIVE',
    type: 'GLOBAL',
    isDefault: true,
    version: 1,
  };

  const mockRule = {
    id: 'rule-1',
    profileId: 'profile-1',
    name: '100 Coins Reward',
    description: 'Welcome coupon',
    ruleType: 'COIN_MILESTONE',
    coinRequirement: 100,
    rewardType: 'VOUCHER',
    rewardReference: 'voucher-1',
    priority: 0,
    displayOrder: 1,
    status: 'DRAFT',
    validFrom: null,
    expiryDate: null,
    createdBy: 'admin-1',
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { rewards: 0, metadata: 0 },
    rewards: [],
  };

  beforeEach(() => {
    repo = {
      findMany: vi.fn().mockResolvedValue([[mockRule], 1]),
      findById: vi.fn().mockResolvedValue(mockRule),
      findByProfile: vi.fn().mockResolvedValue([mockRule]),
      findActiveMilestones: vi.fn().mockResolvedValue([mockRule]),
      findDuplicateCoinMilestone: vi.fn().mockResolvedValue(null),
      findDuplicateDisplayOrder: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(mockRule),
      update: vi.fn().mockResolvedValue(mockRule),
      softDelete: vi.fn().mockResolvedValue(undefined),
      restore: vi.fn().mockResolvedValue({ ...mockRule, status: 'DRAFT', deletedAt: null }),
      getMaxDisplayOrder: vi.fn().mockResolvedValue(0),
      upsertMetadata: vi.fn().mockResolvedValue(undefined),
      findMetadata: vi.fn().mockResolvedValue([]),
      createReward: vi.fn().mockResolvedValue(undefined),
      findRewards: vi.fn().mockResolvedValue([]),
    };

    cache = {
      getItem: vi.fn().mockResolvedValue(null),
      setItem: vi.fn().mockResolvedValue(undefined),
      getProfileRules: vi.fn().mockResolvedValue(null),
      setProfileRules: vi.fn().mockResolvedValue(undefined),
      getMilestones: vi.fn().mockResolvedValue(null),
      setMilestones: vi.fn().mockResolvedValue(undefined),
      invalidateRule: vi.fn().mockResolvedValue(undefined),
      invalidateAll: vi.fn().mockResolvedValue(undefined),
    };

    profileRepo = {
      findByIdOrSlug: vi.fn().mockResolvedValue(mockProfile),
    };

    events = { emit: vi.fn() };

    service = new RewardRulesService(
      repo as unknown as RewardRulesRepository,
      cache as unknown as RewardRulesCacheService,
      profileRepo as unknown as RewardProfileRepository,
      events as unknown as EventEmitter2,
    );
  });

  // ─── CRUD ─────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated rules', async () => {
      const result = await service.findAll({});
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('passes profileId filter', async () => {
      await service.findAll({ profileId: 'profile-1' });
      expect(repo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ profileId: 'profile-1' }),
        undefined, 0, 20,
      );
    });

    it('passes status filter', async () => {
      await service.findAll({ status: 'ACTIVE' as any });
      expect(repo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ACTIVE' }),
        undefined, 0, 20,
      );
    });

    it('passes ruleType filter', async () => {
      await service.findAll({ ruleType: 'COIN_MILESTONE' as any });
      expect(repo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ ruleType: 'COIN_MILESTONE' }),
        undefined, 0, 20,
      );
    });

    it('passes search filter', async () => {
      await service.findAll({ search: 'coins' });
      expect(repo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ OR: expect.any(Array) }),
        undefined, 0, 20,
      );
    });
  });

  describe('findById', () => {
    it('returns from cache', async () => {
      cache.getItem.mockResolvedValue(mockRule);
      const result = await service.findById('rule-1');
      expect(result).toEqual(mockRule);
      expect(repo.findById).not.toHaveBeenCalled();
    });

    it('returns from DB on cache miss', async () => {
      const result = await service.findById('rule-1');
      expect(result).toEqual(mockRule);
      expect(cache.setItem).toHaveBeenCalledWith('rule-1', mockRule);
    });

    it('throws if not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByProfile', () => {
    it('returns rules for profile', async () => {
      const result = await service.findByProfile('profile-1');
      expect(result).toEqual([mockRule]);
    });

    it('returns from cache', async () => {
      cache.getProfileRules.mockResolvedValue([mockRule]);
      const result = await service.findByProfile('profile-1');
      expect(result).toEqual([mockRule]);
      expect(repo.findByProfile).not.toHaveBeenCalled();
    });

    it('throws if profile not found', async () => {
      profileRepo.findByIdOrSlug.mockResolvedValue(null);
      await expect(service.findByProfile('bad')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Milestones ───────────────────────────────────

  describe('findMilestones', () => {
    it('returns active milestones', async () => {
      const result = await service.findMilestones();
      expect(result).toEqual([mockRule]);
    });

    it('returns from cache when no profileId', async () => {
      cache.getMilestones.mockResolvedValue([mockRule]);
      const result = await service.findMilestones();
      expect(result).toEqual([mockRule]);
      expect(repo.findActiveMilestones).not.toHaveBeenCalled();
    });

    it('filters by profile', async () => {
      await service.findMilestones('profile-1');
      expect(repo.findActiveMilestones).toHaveBeenCalledWith('profile-1');
    });

    it('throws if profile not found', async () => {
      profileRepo.findByIdOrSlug.mockResolvedValue(null);
      await expect(service.findMilestones('bad-profile')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Create ───────────────────────────────────────

  describe('create', () => {
    it('creates a rule', async () => {
      const result = await service.create({
        profileId: 'profile-1',
        name: '100 Coins Reward',
        coinRequirement: 100,
        rewardType: 'VOUCHER' as any,
      }, 'admin-1');
      expect(result).toEqual(mockRule);
      expect(repo.create).toHaveBeenCalled();
      expect(events.emit).toHaveBeenCalledWith(REWARD_RULE_EVENTS.CREATED, expect.any(Object));
    });

    it('throws if profile not found', async () => {
      profileRepo.findByIdOrSlug.mockResolvedValue(null);
      await expect(service.create({
        profileId: 'bad',
        name: 'Test',
        coinRequirement: 100,
        rewardType: 'VOUCHER' as any,
      })).rejects.toThrow(NotFoundException);
    });

    it('rejects negative coins', async () => {
      await expect(service.create({
        profileId: 'profile-1',
        name: 'Test',
        coinRequirement: -10,
        rewardType: 'VOUCHER' as any,
      })).rejects.toThrow(BadRequestException);
    });

    it('rejects invalid date range', async () => {
      await expect(service.create({
        profileId: 'profile-1',
        name: 'Test',
        coinRequirement: 100,
        rewardType: 'VOUCHER' as any,
        validFrom: '2026-12-31',
        expiryDate: '2026-01-01',
      })).rejects.toThrow(BadRequestException);
    });

    it('rejects duplicate active coin milestone', async () => {
      repo.findDuplicateCoinMilestone.mockResolvedValue({ id: 'existing' });
      await expect(service.create({
        profileId: 'profile-1',
        name: 'Test',
        coinRequirement: 100,
        rewardType: 'VOUCHER' as any,
        status: 'ACTIVE' as any,
      })).rejects.toThrow(ConflictException);
    });

    it('rejects duplicate display order', async () => {
      repo.findDuplicateDisplayOrder.mockResolvedValue({ id: 'existing' });
      await expect(service.create({
        profileId: 'profile-1',
        name: 'Test',
        coinRequirement: 100,
        rewardType: 'VOUCHER' as any,
        displayOrder: 1,
      })).rejects.toThrow(ConflictException);
    });

    it('auto-assigns display order', async () => {
      repo.getMaxDisplayOrder.mockResolvedValue(5);
      await service.create({
        profileId: 'profile-1',
        name: 'Auto Order',
        coinRequirement: 200,
        rewardType: 'MENU_ITEM' as any,
      });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ displayOrder: 6 }),
      );
    });

    it('saves metadata', async () => {
      await service.create({
        profileId: 'profile-1',
        name: 'With Meta',
        coinRequirement: 100,
        rewardType: 'VOUCHER' as any,
        metadata: { tier: 'gold', limit: 5 },
      });
      expect(repo.upsertMetadata).toHaveBeenCalledTimes(2);
    });
  });

  // ─── Update ───────────────────────────────────────

  describe('update', () => {
    it('updates a rule', async () => {
      const result = await service.update('rule-1', { name: 'Updated' }, 'admin-1');
      expect(result).toEqual(mockRule);
      expect(events.emit).toHaveBeenCalledWith(REWARD_RULE_EVENTS.UPDATED, expect.any(Object));
    });

    it('throws on not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('bad', { name: 'x' })).rejects.toThrow(NotFoundException);
    });

    it('rejects negative coins on update', async () => {
      await expect(service.update('rule-1', { coinRequirement: -5 }))
        .rejects.toThrow(BadRequestException);
    });

    it('rejects duplicate coin milestone on activate', async () => {
      repo.findDuplicateCoinMilestone.mockResolvedValue({ id: 'other' });
      await expect(service.update('rule-1', { status: 'ACTIVE' as any }))
        .rejects.toThrow(ConflictException);
    });

    it('rejects duplicate display order on update', async () => {
      repo.findDuplicateDisplayOrder.mockResolvedValue({ id: 'other' });
      await expect(service.update('rule-1', { displayOrder: 5 }))
        .rejects.toThrow(ConflictException);
    });

    it('validates date range on update', async () => {
      repo.findById.mockResolvedValue({
        ...mockRule,
        validFrom: new Date('2026-06-01'),
        expiryDate: new Date('2026-12-31'),
      });
      await expect(service.update('rule-1', {
        validFrom: '2027-01-01',
      })).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Archive / Restore ────────────────────────────

  describe('archive', () => {
    it('soft-deletes', async () => {
      await service.archive('rule-1', 'admin-1');
      expect(repo.softDelete).toHaveBeenCalledWith('rule-1', 'admin-1');
      expect(events.emit).toHaveBeenCalledWith(REWARD_RULE_EVENTS.ARCHIVED, expect.any(Object));
    });

    it('throws on not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.archive('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore', () => {
    it('restores to draft', async () => {
      const result = await service.restore('rule-1', 'admin-1');
      expect(repo.restore).toHaveBeenCalledWith('rule-1', 'admin-1');
      expect(result.status).toBe('DRAFT');
    });

    it('throws on not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.restore('bad')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Duplicate ────────────────────────────────────

  describe('duplicate', () => {
    it('creates a copy as draft', async () => {
      await service.duplicate('rule-1', {}, 'admin-1');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '100 Coins Reward (Copy)',
          status: 'DRAFT',
        }),
      );
      expect(events.emit).toHaveBeenCalledWith(REWARD_RULE_EVENTS.DUPLICATED, expect.any(Object));
    });

    it('uses custom name', async () => {
      await service.duplicate('rule-1', { name: 'Custom Copy' });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Custom Copy' }),
      );
    });

    it('copies metadata', async () => {
      repo.findMetadata.mockResolvedValue([
        { key: 'tier', value: 'gold' },
        { key: 'limit', value: 5 },
      ]);
      await service.duplicate('rule-1', {});
      expect(repo.upsertMetadata).toHaveBeenCalledTimes(2);
    });

    it('copies rewards', async () => {
      repo.findRewards.mockResolvedValue([
        { rewardType: 'VOUCHER', rewardReference: 'v-1', quantity: 1, metadata: null },
      ]);
      await service.duplicate('rule-1', {});
      expect(repo.createReward).toHaveBeenCalledTimes(1);
    });

    it('rejects duplicate display order', async () => {
      repo.findDuplicateDisplayOrder.mockResolvedValue({ id: 'existing' });
      await expect(service.duplicate('rule-1', { displayOrder: 1 }))
        .rejects.toThrow(ConflictException);
    });

    it('throws on not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.duplicate('bad', {})).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Ordering ─────────────────────────────────────

  describe('ordering', () => {
    it('auto-increments display order', async () => {
      repo.getMaxDisplayOrder.mockResolvedValue(3);
      await service.create({
        profileId: 'profile-1',
        name: 'New Rule',
        coinRequirement: 500,
        rewardType: 'MENU_ITEM' as any,
      });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ displayOrder: 4 }),
      );
    });

    it('uses provided display order', async () => {
      await service.create({
        profileId: 'profile-1',
        name: 'Ordered Rule',
        coinRequirement: 500,
        rewardType: 'MENU_ITEM' as any,
        displayOrder: 10,
      });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ displayOrder: 10 }),
      );
    });
  });

  // ─── Cache ────────────────────────────────────────

  describe('cache invalidation', () => {
    it('invalidates on create', async () => {
      await service.create({
        profileId: 'profile-1',
        name: 'Test',
        coinRequirement: 100,
        rewardType: 'VOUCHER' as any,
      });
      expect(cache.invalidateRule).toHaveBeenCalled();
    });

    it('invalidates on update', async () => {
      await service.update('rule-1', { name: 'Updated' });
      expect(cache.invalidateRule).toHaveBeenCalled();
    });

    it('invalidates on archive', async () => {
      await service.archive('rule-1');
      expect(cache.invalidateRule).toHaveBeenCalled();
    });

    it('invalidates on restore', async () => {
      await service.restore('rule-1');
      expect(cache.invalidateRule).toHaveBeenCalled();
    });

    it('invalidates on duplicate', async () => {
      await service.duplicate('rule-1', {});
      expect(cache.invalidateRule).toHaveBeenCalled();
    });
  });

  // ─── Events ───────────────────────────────────────

  describe('event emission', () => {
    it('emits CREATED', async () => {
      await service.create({
        profileId: 'profile-1',
        name: 'Test',
        coinRequirement: 100,
        rewardType: 'VOUCHER' as any,
      });
      expect(events.emit).toHaveBeenCalledWith(REWARD_RULE_EVENTS.CREATED, expect.any(Object));
    });

    it('emits UPDATED', async () => {
      await service.update('rule-1', { name: 'Updated' });
      expect(events.emit).toHaveBeenCalledWith(REWARD_RULE_EVENTS.UPDATED, expect.any(Object));
    });

    it('emits ARCHIVED', async () => {
      await service.archive('rule-1');
      expect(events.emit).toHaveBeenCalledWith(REWARD_RULE_EVENTS.ARCHIVED, expect.any(Object));
    });

    it('emits DUPLICATED', async () => {
      await service.duplicate('rule-1', {});
      expect(events.emit).toHaveBeenCalledWith(REWARD_RULE_EVENTS.DUPLICATED, expect.any(Object));
    });
  });

  // ─── Priority ─────────────────────────────────────

  describe('priority', () => {
    it('sets priority on create', async () => {
      await service.create({
        profileId: 'profile-1',
        name: 'Priority Rule',
        coinRequirement: 100,
        rewardType: 'VOUCHER' as any,
        priority: 5,
      });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 5 }),
      );
    });

    it('defaults priority to 0', async () => {
      await service.create({
        profileId: 'profile-1',
        name: 'No Priority',
        coinRequirement: 100,
        rewardType: 'VOUCHER' as any,
      });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 0 }),
      );
    });

    it('updates priority', async () => {
      await service.update('rule-1', { priority: 10 });
      expect(repo.update).toHaveBeenCalledWith(
        'rule-1',
        expect.objectContaining({ priority: 10 }),
      );
    });
  });

  // ─── Soft Delete ──────────────────────────────────

  describe('soft delete', () => {
    it('sets deletedAt and ARCHIVED status', async () => {
      await service.archive('rule-1', 'admin-1');
      expect(repo.softDelete).toHaveBeenCalledWith('rule-1', 'admin-1');
    });

    it('restores clears deletedAt and sets DRAFT', async () => {
      await service.restore('rule-1', 'admin-1');
      expect(repo.restore).toHaveBeenCalledWith('rule-1', 'admin-1');
    });
  });
});
