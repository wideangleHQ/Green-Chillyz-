import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RewardOverridesService } from '../services/reward-overrides.service';
import { RewardOverridesRepository } from '../repositories/reward-overrides.repository';
import { RewardOverridesCacheService } from '../cache/reward-overrides-cache.service';
import { RewardAssignmentRepository } from '../../reward-assignment/repositories/reward-assignment.repository';
import { RewardRulesRepository } from '../../reward-rules/repositories/reward-rules.repository';
import { REWARD_OVERRIDE_ERRORS, REWARD_OVERRIDE_EVENTS } from '../constants';

describe('RewardOverridesService', () => {
  let service: RewardOverridesService;
  let repo: Record<string, ReturnType<typeof vi.fn>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;
  let assignmentRepo: Record<string, ReturnType<typeof vi.fn>>;
  let rulesRepo: Record<string, ReturnType<typeof vi.fn>>;
  let events: { emit: ReturnType<typeof vi.fn> };

  const mockRule = {
    id: 'rule-1',
    profileId: 'profile-1',
    name: '500 Coins Dessert',
    status: 'ACTIVE',
    ruleType: 'COIN_MILESTONE',
    coinRequirement: 500,
    rewardType: 'MENU_ITEM',
    rewardReference: 'dessert-1',
    displayOrder: 2,
    priority: 0,
    validFrom: null,
    expiryDate: null,
  };

  const mockAssignment = {
    id: 'assign-1',
    storeId: 'store-1',
    profileId: 'profile-1',
    status: 'ACTIVE',
  };

  const mockOverride = {
    id: 'override-1',
    storeId: 'store-1',
    ruleId: 'rule-1',
    overrideRewardType: 'MENU_ITEM',
    overrideRewardRef: 'fries-1',
    overrideCoinReq: null,
    overrideDisplayOrder: null,
    overridePriority: null,
    status: 'ACTIVE',
    effectiveFrom: new Date(),
    effectiveUntil: null,
    reason: 'Store prefers fries',
    createdBy: 'admin-1',
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    archivedAt: null,
    store: { id: 'store-1', name: 'GC-INFOS', code: 'GC-INFOS' },
    rule: { id: 'rule-1', name: '500 Coins Dessert', coinRequirement: 500, rewardType: 'MENU_ITEM' },
    _count: { metadata: 0 },
  };

  beforeEach(() => {
    repo = {
      findMany: vi.fn().mockResolvedValue([[mockOverride], 1]),
      findById: vi.fn().mockResolvedValue(mockOverride),
      findActiveByStore: vi.fn().mockResolvedValue([mockOverride]),
      findActiveByStoreAndRule: vi.fn().mockResolvedValue(null),
      findDuplicateCoinMilestone: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(mockOverride),
      update: vi.fn().mockResolvedValue(mockOverride),
      softDelete: vi.fn().mockResolvedValue(undefined),
      restore: vi.fn().mockResolvedValue({ ...mockOverride, status: 'ACTIVE', deletedAt: null }),
      createHistory: vi.fn().mockResolvedValue({}),
      findHistory: vi.fn().mockResolvedValue([]),
      upsertMetadata: vi.fn().mockResolvedValue(undefined),
      storeExists: vi.fn().mockResolvedValue(true),
      ruleExists: vi.fn().mockResolvedValue(mockRule),
    };

    cache = {
      getItem: vi.fn().mockResolvedValue(null),
      setItem: vi.fn().mockResolvedValue(undefined),
      getStoreOverrides: vi.fn().mockResolvedValue(null),
      setStoreOverrides: vi.fn().mockResolvedValue(undefined),
      getPreview: vi.fn().mockResolvedValue(null),
      setPreview: vi.fn().mockResolvedValue(undefined),
      invalidateOverride: vi.fn().mockResolvedValue(undefined),
      invalidateAll: vi.fn().mockResolvedValue(undefined),
    };

    assignmentRepo = {
      findActiveByStore: vi.fn().mockResolvedValue(mockAssignment),
    };

    rulesRepo = {
      findMany: vi.fn().mockResolvedValue([
        [
          {
            id: 'rule-1',
            name: '500 Coins Dessert',
            ruleType: 'COIN_MILESTONE',
            coinRequirement: 500,
            rewardType: 'MENU_ITEM',
            rewardReference: 'dessert-1',
            displayOrder: 2,
            priority: 0,
            validFrom: null,
            expiryDate: null,
          },
          {
            id: 'rule-2',
            name: '100 Coins Welcome',
            ruleType: 'COIN_MILESTONE',
            coinRequirement: 100,
            rewardType: 'VOUCHER',
            rewardReference: 'voucher-1',
            displayOrder: 1,
            priority: 0,
            validFrom: null,
            expiryDate: null,
          },
        ],
        2,
      ]),
    };

    events = { emit: vi.fn() };

    service = new RewardOverridesService(
      repo as unknown as RewardOverridesRepository,
      cache as unknown as RewardOverridesCacheService,
      assignmentRepo as unknown as RewardAssignmentRepository,
      rulesRepo as unknown as RewardRulesRepository,
      events as unknown as EventEmitter2,
    );
  });

  // ── findAll ──────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated overrides', async () => {
      const result = await service.findAll({ page: 1, pageSize: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('applies storeId filter', async () => {
      await service.findAll({ storeId: 'store-1' });
      const where = repo.findMany.mock.calls[0][0];
      expect(where.storeId).toBe('store-1');
    });

    it('applies ruleId filter', async () => {
      await service.findAll({ ruleId: 'rule-1' });
      const where = repo.findMany.mock.calls[0][0];
      expect(where.ruleId).toBe('rule-1');
    });

    it('applies status filter', async () => {
      await service.findAll({ status: 'ACTIVE' as any });
      const where = repo.findMany.mock.calls[0][0];
      expect(where.status).toBe('ACTIVE');
    });

    it('caps page size at MAX_PAGE_SIZE', async () => {
      await service.findAll({ page: 1, pageSize: 500 });
      const take = repo.findMany.mock.calls[0][2];
      expect(take).toBeLessThanOrEqual(100);
    });

    it('defaults page and pageSize', async () => {
      await service.findAll({});
      expect(repo.findMany).toHaveBeenCalledWith({}, 0, 20);
    });
  });

  // ── findById ─────────────────────────────────────────────

  describe('findById', () => {
    it('returns override by ID', async () => {
      const result = await service.findById('override-1');
      expect(result).toEqual(mockOverride);
    });

    it('returns from cache when available', async () => {
      cache.getItem.mockResolvedValueOnce(mockOverride);
      const result = await service.findById('override-1');
      expect(result).toEqual(mockOverride);
      expect(repo.findById).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when not found', async () => {
      repo.findById.mockResolvedValueOnce(null);
      await expect(service.findById('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('populates cache after DB hit', async () => {
      await service.findById('override-1');
      expect(cache.setItem).toHaveBeenCalledWith('override-1', mockOverride);
    });
  });

  // ── findByStore ──────────────────────────────────────────

  describe('findByStore', () => {
    it('returns active overrides for store', async () => {
      const result = await service.findByStore('store-1');
      expect(result).toEqual([mockOverride]);
    });

    it('returns from cache when available', async () => {
      cache.getStoreOverrides.mockResolvedValueOnce([mockOverride]);
      const result = await service.findByStore('store-1');
      expect(result).toEqual([mockOverride]);
      expect(repo.findActiveByStore).not.toHaveBeenCalled();
    });

    it('populates cache after DB hit', async () => {
      await service.findByStore('store-1');
      expect(cache.setStoreOverrides).toHaveBeenCalledWith('store-1', [mockOverride]);
    });
  });

  // ── create ───────────────────────────────────────────────

  describe('create', () => {
    const dto = {
      storeId: 'store-1',
      ruleId: 'rule-1',
      overrideRewardType: 'MENU_ITEM' as any,
      overrideRewardRef: 'fries-1',
      reason: 'Store prefers fries',
    };

    it('creates a new override', async () => {
      const result = await service.create(dto, 'admin-1');
      expect(result).toEqual(mockOverride);
      expect(repo.create).toHaveBeenCalled();
    });

    it('creates history record', async () => {
      await service.create(dto, 'admin-1');
      expect(repo.createHistory).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATED', storeId: 'store-1' }),
      );
    });

    it('emits CREATED event', async () => {
      await service.create(dto, 'admin-1');
      expect(events.emit).toHaveBeenCalledWith(
        REWARD_OVERRIDE_EVENTS.CREATED,
        expect.objectContaining({ storeId: 'store-1', ruleId: 'rule-1' }),
      );
    });

    it('invalidates cache', async () => {
      await service.create(dto, 'admin-1');
      expect(cache.invalidateOverride).toHaveBeenCalled();
    });

    it('throws NotFoundException for missing store', async () => {
      repo.storeExists.mockResolvedValueOnce(false);
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for missing rule', async () => {
      repo.ruleExists.mockResolvedValueOnce(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for archived rule', async () => {
      repo.ruleExists.mockResolvedValueOnce({ ...mockRule, status: 'ARCHIVED' });
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when store has no assignment', async () => {
      assignmentRepo.findActiveByStore.mockResolvedValueOnce(null);
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when rule does not belong to assigned profile', async () => {
      repo.ruleExists.mockResolvedValueOnce({ ...mockRule, profileId: 'other-profile' });
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException for duplicate active override', async () => {
      repo.findActiveByStoreAndRule.mockResolvedValueOnce(mockOverride);
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException for invalid date range', async () => {
      const badDto = {
        ...dto,
        effectiveFrom: '2026-12-31',
        effectiveUntil: '2026-01-01',
      };
      await expect(service.create(badDto)).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException for duplicate coin milestone', async () => {
      repo.findDuplicateCoinMilestone.mockResolvedValueOnce({ id: 'dup' });
      const coinDto = { ...dto, overrideCoinReq: 500 };
      await expect(service.create(coinDto)).rejects.toThrow(ConflictException);
    });

    it('stores metadata when provided', async () => {
      const metaDto = { ...dto, metadata: { notes: 'test', tier: 'vip' } };
      await service.create(metaDto, 'admin-1');
      expect(repo.upsertMetadata).toHaveBeenCalledTimes(2);
    });

    it('handles optional fields', async () => {
      const minDto = {
        storeId: 'store-1',
        ruleId: 'rule-1',
        overrideRewardType: 'MENU_ITEM' as any,
      };
      await service.create(minDto);
      expect(repo.create).toHaveBeenCalled();
    });
  });

  // ── update ───────────────────────────────────────────────

  describe('update', () => {
    it('updates an override', async () => {
      const dto = { overrideRewardRef: 'burger-1', reason: 'Changed to burger' };
      const result = await service.update('override-1', dto, 'admin-1');
      expect(result).toEqual(mockOverride);
      expect(repo.update).toHaveBeenCalled();
    });

    it('throws NotFoundException for missing override', async () => {
      repo.findById.mockResolvedValueOnce(null);
      await expect(service.update('bad-id', {})).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException for duplicate coin milestone on update', async () => {
      repo.findDuplicateCoinMilestone.mockResolvedValueOnce({ id: 'dup' });
      await expect(
        service.update('override-1', { overrideCoinReq: 500 }),
      ).rejects.toThrow(ConflictException);
    });

    it('emits UPDATED event with changed fields', async () => {
      await service.update('override-1', { overrideRewardRef: 'new-ref' }, 'admin-1');
      expect(events.emit).toHaveBeenCalledWith(
        REWARD_OVERRIDE_EVENTS.UPDATED,
        expect.objectContaining({
          changedFields: ['overrideRewardRef'],
        }),
      );
    });

    it('invalidates cache', async () => {
      await service.update('override-1', { reason: 'test' });
      expect(cache.invalidateOverride).toHaveBeenCalledWith('override-1', 'store-1');
    });

    it('stores metadata when provided', async () => {
      await service.update('override-1', { metadata: { key: 'val' } });
      expect(repo.upsertMetadata).toHaveBeenCalledWith('override-1', 'key', 'val');
    });

    it('handles status change to ARCHIVED', async () => {
      await service.update('override-1', { status: 'ARCHIVED' as any });
      const updateArg = repo.update.mock.calls[0][1];
      expect(updateArg.status).toBe('ARCHIVED');
      expect(updateArg.archivedAt).toBeDefined();
    });

    it('tracks multiple changed fields', async () => {
      await service.update('override-1', {
        overrideRewardType: 'VOUCHER' as any,
        overrideCoinReq: 200,
        overrideDisplayOrder: 5,
      });
      expect(events.emit).toHaveBeenCalledWith(
        REWARD_OVERRIDE_EVENTS.UPDATED,
        expect.objectContaining({
          changedFields: expect.arrayContaining([
            'overrideRewardType',
            'overrideCoinReq',
            'overrideDisplayOrder',
          ]),
        }),
      );
    });
  });

  // ── archive ──────────────────────────────────────────────

  describe('archive', () => {
    it('soft-deletes the override', async () => {
      await service.archive('override-1', 'admin-1');
      expect(repo.softDelete).toHaveBeenCalledWith('override-1', 'admin-1');
    });

    it('creates history record', async () => {
      await service.archive('override-1', 'admin-1');
      expect(repo.createHistory).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ARCHIVED' }),
      );
    });

    it('emits ARCHIVED event', async () => {
      await service.archive('override-1', 'admin-1');
      expect(events.emit).toHaveBeenCalledWith(
        REWARD_OVERRIDE_EVENTS.ARCHIVED,
        expect.objectContaining({ overrideId: 'override-1' }),
      );
    });

    it('invalidates cache', async () => {
      await service.archive('override-1', 'admin-1');
      expect(cache.invalidateOverride).toHaveBeenCalledWith('override-1', 'store-1');
    });

    it('throws NotFoundException for missing override', async () => {
      repo.findById.mockResolvedValueOnce(null);
      await expect(service.archive('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── restore ──────────────────────────────────────────────

  describe('restore', () => {
    it('restores an archived override', async () => {
      const result = await service.restore('override-1', 'admin-1');
      expect(repo.restore).toHaveBeenCalledWith('override-1', 'admin-1');
      expect(result).toBeDefined();
    });

    it('creates history record', async () => {
      await service.restore('override-1', 'admin-1');
      expect(repo.createHistory).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'RESTORED' }),
      );
    });

    it('emits RESTORED event', async () => {
      await service.restore('override-1', 'admin-1');
      expect(events.emit).toHaveBeenCalledWith(
        REWARD_OVERRIDE_EVENTS.RESTORED,
        expect.objectContaining({ overrideId: 'override-1' }),
      );
    });

    it('throws NotFoundException for missing override', async () => {
      repo.findById.mockResolvedValueOnce(null);
      await expect(service.restore('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when duplicate active override exists', async () => {
      repo.findActiveByStoreAndRule.mockResolvedValueOnce(mockOverride);
      await expect(service.restore('override-1')).rejects.toThrow(ConflictException);
    });

    it('invalidates cache', async () => {
      await service.restore('override-1', 'admin-1');
      expect(cache.invalidateOverride).toHaveBeenCalledWith('override-1', 'store-1');
    });
  });

  // ── findHistory ──────────────────────────────────────────

  describe('findHistory', () => {
    it('returns history for a store', async () => {
      const result = await service.findHistory('store-1');
      expect(result).toEqual([]);
      expect(repo.findHistory).toHaveBeenCalledWith('store-1');
    });
  });

  // ── previewEffectiveRewards (Reward Resolution Engine) ──

  describe('previewEffectiveRewards', () => {
    it('returns resolved rewards with overrides applied', async () => {
      const result = await service.previewEffectiveRewards('store-1');
      expect(result).toHaveLength(2);

      const overriddenRule = result.find((r) => r.ruleId === 'rule-1');
      expect(overriddenRule?.source).toBe('OVERRIDE');
      expect(overriddenRule?.rewardReference).toBe('fries-1');
      expect(overriddenRule?.overrideId).toBe('override-1');

      const profileRule = result.find((r) => r.ruleId === 'rule-2');
      expect(profileRule?.source).toBe('PROFILE');
      expect(profileRule?.overrideId).toBeNull();
    });

    it('returns from cache when available', async () => {
      cache.getPreview.mockResolvedValueOnce([{ ruleId: 'rule-1', source: 'OVERRIDE' }]);
      const result = await service.previewEffectiveRewards('store-1');
      expect(result).toHaveLength(1);
      expect(assignmentRepo.findActiveByStore).not.toHaveBeenCalled();
    });

    it('returns empty array when no assignment exists', async () => {
      assignmentRepo.findActiveByStore.mockResolvedValueOnce(null);
      const result = await service.previewEffectiveRewards('store-1');
      expect(result).toEqual([]);
    });

    it('sorts by displayOrder then priority', async () => {
      const result = await service.previewEffectiveRewards('store-1');
      expect(result[0].displayOrder).toBeLessThanOrEqual(result[1].displayOrder);
    });

    it('caches the preview result', async () => {
      await service.previewEffectiveRewards('store-1');
      expect(cache.setPreview).toHaveBeenCalledWith('store-1', expect.any(Array));
    });

    it('uses override coinRequirement when provided', async () => {
      repo.findActiveByStore.mockResolvedValueOnce([
        {
          ...mockOverride,
          overrideCoinReq: 750,
          effectiveUntil: null,
        },
      ]);
      const result = await service.previewEffectiveRewards('store-1');
      const overriddenRule = result.find((r) => r.ruleId === 'rule-1');
      expect(overriddenRule?.coinRequirement).toBe(750);
    });

    it('uses override displayOrder when provided', async () => {
      repo.findActiveByStore.mockResolvedValueOnce([
        {
          ...mockOverride,
          overrideDisplayOrder: 99,
          effectiveUntil: null,
        },
      ]);
      const result = await service.previewEffectiveRewards('store-1');
      const overriddenRule = result.find((r) => r.ruleId === 'rule-1');
      expect(overriddenRule?.displayOrder).toBe(99);
    });

    it('uses override priority when provided', async () => {
      repo.findActiveByStore.mockResolvedValueOnce([
        {
          ...mockOverride,
          overridePriority: 10,
          effectiveUntil: null,
        },
      ]);
      const result = await service.previewEffectiveRewards('store-1');
      const overriddenRule = result.find((r) => r.ruleId === 'rule-1');
      expect(overriddenRule?.priority).toBe(10);
    });

    it('skips expired overrides', async () => {
      repo.findActiveByStore.mockResolvedValueOnce([
        {
          ...mockOverride,
          effectiveUntil: new Date('2020-01-01'),
        },
      ]);
      const result = await service.previewEffectiveRewards('store-1');
      const rule1 = result.find((r) => r.ruleId === 'rule-1');
      expect(rule1?.source).toBe('PROFILE');
    });

    it('falls back to profile values when override fields are null', async () => {
      repo.findActiveByStore.mockResolvedValueOnce([
        {
          ...mockOverride,
          overrideCoinReq: null,
          overrideDisplayOrder: null,
          overridePriority: null,
          overrideRewardRef: null,
          effectiveUntil: null,
        },
      ]);
      const result = await service.previewEffectiveRewards('store-1');
      const rule1 = result.find((r) => r.ruleId === 'rule-1');
      expect(rule1?.coinRequirement).toBe(500);
      expect(rule1?.displayOrder).toBe(2);
      expect(rule1?.priority).toBe(0);
      expect(rule1?.rewardReference).toBe('dessert-1');
    });
  });

  // ── edge cases ───────────────────────────────────────────

  describe('edge cases', () => {
    it('handles create without optional fields', async () => {
      const dto = {
        storeId: 'store-1',
        ruleId: 'rule-1',
        overrideRewardType: 'MENU_ITEM' as any,
      };
      await service.create(dto);
      const createArg = repo.create.mock.calls[0][0];
      expect(createArg.overrideRewardRef).toBeNull();
      expect(createArg.overrideCoinReq).toBeNull();
    });

    it('handles create without createdBy', async () => {
      const dto = {
        storeId: 'store-1',
        ruleId: 'rule-1',
        overrideRewardType: 'MENU_ITEM' as any,
      };
      await service.create(dto);
      const createArg = repo.create.mock.calls[0][0];
      expect(createArg.createdBy).toBeNull();
    });

    it('handles effectiveFrom on create', async () => {
      const dto = {
        storeId: 'store-1',
        ruleId: 'rule-1',
        overrideRewardType: 'MENU_ITEM' as any,
        effectiveFrom: '2027-01-01',
      };
      await service.create(dto);
      const createArg = repo.create.mock.calls[0][0];
      expect(createArg.effectiveFrom).toEqual(new Date('2027-01-01'));
    });

    it('sets effectiveFrom to now when not provided', async () => {
      const before = new Date();
      const dto = {
        storeId: 'store-1',
        ruleId: 'rule-1',
        overrideRewardType: 'MENU_ITEM' as any,
      };
      await service.create(dto);
      const createArg = repo.create.mock.calls[0][0];
      expect(createArg.effectiveFrom.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });
});
