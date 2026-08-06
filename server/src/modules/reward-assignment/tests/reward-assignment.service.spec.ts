import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RewardAssignmentService } from '../services/reward-assignment.service';
import { RewardAssignmentRepository } from '../repositories/reward-assignment.repository';
import { RewardAssignmentCacheService } from '../cache/reward-assignment-cache.service';
import { RewardProfileRepository } from '../../reward-profile/repositories/reward-profile.repository';
import { REWARD_ASSIGNMENT_ERRORS, REWARD_ASSIGNMENT_EVENTS } from '../constants';

describe('RewardAssignmentService', () => {
  let service: RewardAssignmentService;
  let repo: Record<string, ReturnType<typeof vi.fn>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;
  let profileRepo: Record<string, ReturnType<typeof vi.fn>>;
  let events: { emit: ReturnType<typeof vi.fn> };

  const mockProfile = {
    id: 'profile-1',
    name: 'Premium Rewards',
    slug: 'premium-rewards',
    status: 'ACTIVE',
    type: 'GLOBAL',
    isDefault: false,
    version: 1,
  };

  const mockAssignment = {
    id: 'assign-1',
    storeId: 'store-1',
    profileId: 'profile-1',
    status: 'ACTIVE',
    assignmentType: 'STORE',
    effectiveFrom: new Date(),
    effectiveUntil: null,
    assignedBy: 'admin-1',
    updatedBy: null,
    reason: 'Initial assignment',
    createdAt: new Date(),
    updatedAt: new Date(),
    archivedAt: null,
    store: { id: 'store-1', name: 'GC-INFOS', code: 'GC-INFOS' },
    profile: { id: 'profile-1', name: 'Premium Rewards', slug: 'premium-rewards' },
    _count: { metadata: 0 },
  };

  const mockHistory = {
    id: 'hist-1',
    assignmentId: 'assign-1',
    storeId: 'store-1',
    profileId: 'profile-1',
    status: 'ACTIVE',
    assignmentType: 'STORE',
    action: 'ASSIGNED',
    reason: 'Initial assignment',
    changedBy: 'admin-1',
    snapshot: {},
    createdAt: new Date(),
  };

  beforeEach(() => {
    repo = {
      findMany: vi.fn().mockResolvedValue([[mockAssignment], 1]),
      findById: vi.fn().mockResolvedValue(mockAssignment),
      findActiveByStore: vi.fn().mockResolvedValue(null),
      findByStore: vi.fn().mockResolvedValue([mockAssignment]),
      create: vi.fn().mockResolvedValue(mockAssignment),
      update: vi.fn().mockResolvedValue(mockAssignment),
      archiveActiveForStore: vi.fn().mockResolvedValue({ count: 1 }),
      softDelete: vi.fn().mockResolvedValue(undefined),
      restore: vi.fn().mockResolvedValue({ ...mockAssignment, status: 'ACTIVE', deletedAt: null }),
      createHistory: vi.fn().mockResolvedValue(mockHistory),
      findHistory: vi.fn().mockResolvedValue([mockHistory]),
      findHistoryByAssignment: vi.fn().mockResolvedValue([mockHistory]),
      upsertMetadata: vi.fn().mockResolvedValue(undefined),
      storeExists: vi.fn().mockResolvedValue(true),
    };

    cache = {
      getItem: vi.fn().mockResolvedValue(null),
      setItem: vi.fn().mockResolvedValue(undefined),
      getStoreAssignment: vi.fn().mockResolvedValue(null),
      setStoreAssignment: vi.fn().mockResolvedValue(undefined),
      getStoreProfile: vi.fn().mockResolvedValue(null),
      setStoreProfile: vi.fn().mockResolvedValue(undefined),
      invalidateAssignment: vi.fn().mockResolvedValue(undefined),
    };

    profileRepo = {
      findByIdOrSlug: vi.fn().mockResolvedValue(mockProfile),
    };

    events = { emit: vi.fn() };

    service = new RewardAssignmentService(
      repo as unknown as RewardAssignmentRepository,
      cache as unknown as RewardAssignmentCacheService,
      profileRepo as unknown as RewardProfileRepository,
      events as unknown as EventEmitter2,
    );
  });

  // ── findAll ──────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated assignments', async () => {
      const result = await service.findAll({ page: 1, pageSize: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(repo.findMany).toHaveBeenCalled();
    });

    it('applies storeId filter', async () => {
      await service.findAll({ storeId: 'store-1' });
      const where = repo.findMany.mock.calls[0][0];
      expect(where.storeId).toBe('store-1');
    });

    it('applies profileId filter', async () => {
      await service.findAll({ profileId: 'profile-1' });
      const where = repo.findMany.mock.calls[0][0];
      expect(where.profileId).toBe('profile-1');
    });

    it('applies status filter', async () => {
      await service.findAll({ status: 'ACTIVE' as any });
      const where = repo.findMany.mock.calls[0][0];
      expect(where.status).toBe('ACTIVE');
    });

    it('applies assignmentType filter', async () => {
      await service.findAll({ assignmentType: 'GLOBAL' as any });
      const where = repo.findMany.mock.calls[0][0];
      expect(where.assignmentType).toBe('GLOBAL');
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

  // ── findById ─────────────────────────────────────────────────

  describe('findById', () => {
    it('returns assignment by ID', async () => {
      const result = await service.findById('assign-1');
      expect(result).toEqual(mockAssignment);
      expect(repo.findById).toHaveBeenCalledWith('assign-1');
    });

    it('returns from cache when available', async () => {
      cache.getItem.mockResolvedValueOnce(mockAssignment);
      const result = await service.findById('assign-1');
      expect(result).toEqual(mockAssignment);
      expect(repo.findById).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when not found', async () => {
      repo.findById.mockResolvedValueOnce(null);
      await expect(service.findById('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('populates cache after DB hit', async () => {
      await service.findById('assign-1');
      expect(cache.setItem).toHaveBeenCalledWith('assign-1', mockAssignment);
    });
  });

  // ── findByStore ──────────────────────────────────────────────

  describe('findByStore', () => {
    it('returns active assignment for store', async () => {
      repo.findActiveByStore.mockResolvedValueOnce(mockAssignment);
      const result = await service.findByStore('store-1');
      expect(result).toEqual(mockAssignment);
    });

    it('returns from cache when available', async () => {
      cache.getStoreAssignment.mockResolvedValueOnce(mockAssignment);
      const result = await service.findByStore('store-1');
      expect(result).toEqual(mockAssignment);
      expect(repo.findActiveByStore).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when no active assignment', async () => {
      repo.findActiveByStore.mockResolvedValueOnce(null);
      await expect(service.findByStore('store-1')).rejects.toThrow(NotFoundException);
    });

    it('populates cache after DB hit', async () => {
      repo.findActiveByStore.mockResolvedValueOnce(mockAssignment);
      await service.findByStore('store-1');
      expect(cache.setStoreAssignment).toHaveBeenCalledWith('store-1', mockAssignment);
    });
  });

  // ── resolveStoreProfile ──────────────────────────────────────

  describe('resolveStoreProfile', () => {
    it('returns profile for store with active assignment', async () => {
      repo.findActiveByStore.mockResolvedValueOnce(mockAssignment);
      const result = await service.resolveStoreProfile('store-1');
      expect(result).toEqual(mockProfile);
      expect(profileRepo.findByIdOrSlug).toHaveBeenCalledWith('profile-1');
    });

    it('returns from cache when available', async () => {
      cache.getStoreProfile.mockResolvedValueOnce(mockProfile);
      const result = await service.resolveStoreProfile('store-1');
      expect(result).toEqual(mockProfile);
      expect(repo.findActiveByStore).not.toHaveBeenCalled();
    });

    it('returns null when no active assignment', async () => {
      repo.findActiveByStore.mockResolvedValueOnce(null);
      const result = await service.resolveStoreProfile('store-1');
      expect(result).toBeNull();
    });

    it('caches the resolved profile', async () => {
      repo.findActiveByStore.mockResolvedValueOnce(mockAssignment);
      await service.resolveStoreProfile('store-1');
      expect(cache.setStoreProfile).toHaveBeenCalledWith('store-1', mockProfile);
    });
  });

  // ── findHistory ──────────────────────────────────────────────

  describe('findHistory', () => {
    it('returns history for a store', async () => {
      const result = await service.findHistory('store-1');
      expect(result).toEqual([mockHistory]);
      expect(repo.findHistory).toHaveBeenCalledWith('store-1');
    });
  });

  // ── assign ───────────────────────────────────────────────────

  describe('assign', () => {
    it('creates a new assignment', async () => {
      const dto = { storeId: 'store-1', profileId: 'profile-1', reason: 'test' };
      const result = await service.assign(dto, 'admin-1');
      expect(result).toEqual(mockAssignment);
      expect(repo.create).toHaveBeenCalled();
    });

    it('creates history record on assign', async () => {
      const dto = { storeId: 'store-1', profileId: 'profile-1' };
      await service.assign(dto, 'admin-1');
      expect(repo.createHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ASSIGNED',
          storeId: 'store-1',
          profileId: 'profile-1',
        }),
      );
    });

    it('emits ASSIGNED event', async () => {
      const dto = { storeId: 'store-1', profileId: 'profile-1' };
      await service.assign(dto, 'admin-1');
      expect(events.emit).toHaveBeenCalledWith(
        REWARD_ASSIGNMENT_EVENTS.ASSIGNED,
        expect.objectContaining({ storeId: 'store-1', profileId: 'profile-1' }),
      );
    });

    it('invalidates cache after assign', async () => {
      const dto = { storeId: 'store-1', profileId: 'profile-1' };
      await service.assign(dto, 'admin-1');
      expect(cache.invalidateAssignment).toHaveBeenCalled();
    });

    it('throws NotFoundException for missing store', async () => {
      repo.storeExists.mockResolvedValueOnce(false);
      const dto = { storeId: 'bad-store', profileId: 'profile-1' };
      await expect(service.assign(dto)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for missing profile', async () => {
      profileRepo.findByIdOrSlug.mockResolvedValueOnce(null);
      const dto = { storeId: 'store-1', profileId: 'bad-profile' };
      await expect(service.assign(dto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for archived profile', async () => {
      profileRepo.findByIdOrSlug.mockResolvedValueOnce({ ...mockProfile, status: 'ARCHIVED' });
      const dto = { storeId: 'store-1', profileId: 'profile-1' };
      await expect(service.assign(dto)).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when store already has active assignment', async () => {
      repo.findActiveByStore.mockResolvedValueOnce(mockAssignment);
      const dto = { storeId: 'store-1', profileId: 'profile-1' };
      await expect(service.assign(dto)).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException for invalid date range', async () => {
      const dto = {
        storeId: 'store-1',
        profileId: 'profile-1',
        effectiveFrom: '2026-12-31',
        effectiveUntil: '2026-01-01',
      };
      await expect(service.assign(dto)).rejects.toThrow(BadRequestException);
    });

    it('stores metadata when provided', async () => {
      const dto = {
        storeId: 'store-1',
        profileId: 'profile-1',
        metadata: { tier: 'premium', notes: 'VIP store' },
      };
      await service.assign(dto, 'admin-1');
      expect(repo.upsertMetadata).toHaveBeenCalledTimes(2);
    });

    it('uses STORE as default assignmentType', async () => {
      const dto = { storeId: 'store-1', profileId: 'profile-1' };
      await service.assign(dto);
      const createArg = repo.create.mock.calls[0][0];
      expect(createArg.assignmentType).toBe('STORE');
    });

    it('accepts custom assignmentType', async () => {
      const dto = { storeId: 'store-1', profileId: 'profile-1', assignmentType: 'GLOBAL' as any };
      await service.assign(dto);
      const createArg = repo.create.mock.calls[0][0];
      expect(createArg.assignmentType).toBe('GLOBAL');
    });
  });

  // ── changeProfile ────────────────────────────────────────────

  describe('changeProfile', () => {
    const newProfile = {
      ...mockProfile,
      id: 'profile-2',
      name: 'Standard Rewards',
      slug: 'standard-rewards',
    };

    beforeEach(() => {
      repo.findActiveByStore.mockResolvedValue(mockAssignment);
      profileRepo.findByIdOrSlug.mockResolvedValue(newProfile);
    });

    it('archives previous and creates new assignment', async () => {
      const dto = { profileId: 'profile-2' };
      await service.changeProfile('store-1', dto, 'admin-1');
      expect(repo.archiveActiveForStore).toHaveBeenCalledWith('store-1', 'admin-1');
      expect(repo.create).toHaveBeenCalled();
    });

    it('creates history for both archive and new assignment', async () => {
      const dto = { profileId: 'profile-2' };
      await service.changeProfile('store-1', dto, 'admin-1');
      expect(repo.createHistory).toHaveBeenCalledTimes(2);
      const calls = repo.createHistory.mock.calls;
      expect(calls[0][0].action).toBe('CHANGED');
      expect(calls[1][0].action).toBe('ASSIGNED');
    });

    it('emits CHANGED event', async () => {
      const dto = { profileId: 'profile-2' };
      await service.changeProfile('store-1', dto, 'admin-1');
      expect(events.emit).toHaveBeenCalledWith(
        REWARD_ASSIGNMENT_EVENTS.CHANGED,
        expect.objectContaining({
          storeId: 'store-1',
          previousProfileId: 'profile-1',
          newProfileId: 'profile-2',
        }),
      );
    });

    it('invalidates cache for both old and new assignments', async () => {
      const dto = { profileId: 'profile-2' };
      await service.changeProfile('store-1', dto, 'admin-1');
      expect(cache.invalidateAssignment).toHaveBeenCalledTimes(2);
    });

    it('works when no previous assignment exists', async () => {
      repo.findActiveByStore.mockResolvedValueOnce(null);
      const dto = { profileId: 'profile-2' };
      const result = await service.changeProfile('store-1', dto, 'admin-1');
      expect(result).toEqual(mockAssignment);
      expect(repo.archiveActiveForStore).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for missing store', async () => {
      repo.storeExists.mockResolvedValueOnce(false);
      const dto = { profileId: 'profile-2' };
      await expect(service.changeProfile('store-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for missing profile', async () => {
      profileRepo.findByIdOrSlug.mockResolvedValueOnce(null);
      const dto = { profileId: 'bad-profile' };
      await expect(service.changeProfile('store-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for archived profile', async () => {
      profileRepo.findByIdOrSlug.mockResolvedValueOnce({ ...newProfile, status: 'ARCHIVED' });
      const dto = { profileId: 'profile-2' };
      await expect(service.changeProfile('store-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for invalid date range', async () => {
      const dto = {
        profileId: 'profile-2',
        effectiveFrom: '2026-12-31',
        effectiveUntil: '2026-01-01',
      };
      await expect(service.changeProfile('store-1', dto)).rejects.toThrow(BadRequestException);
    });
  });

  // ── update ───────────────────────────────────────────────────

  describe('update', () => {
    it('updates an assignment', async () => {
      const dto = { reason: 'Updated reason' };
      const result = await service.update('assign-1', dto, 'admin-1');
      expect(result).toEqual(mockAssignment);
      expect(repo.update).toHaveBeenCalled();
    });

    it('throws NotFoundException for missing assignment', async () => {
      repo.findById.mockResolvedValueOnce(null);
      await expect(service.update('bad-id', {})).rejects.toThrow(NotFoundException);
    });

    it('invalidates cache after update', async () => {
      await service.update('assign-1', { reason: 'test' }, 'admin-1');
      expect(cache.invalidateAssignment).toHaveBeenCalledWith('assign-1', 'store-1');
    });

    it('stores metadata when provided', async () => {
      const dto = { metadata: { priority: 'high' } };
      await service.update('assign-1', dto, 'admin-1');
      expect(repo.upsertMetadata).toHaveBeenCalledWith('assign-1', 'priority', 'high');
    });

    it('updates effectiveUntil', async () => {
      const dto = { effectiveUntil: '2027-01-01' };
      await service.update('assign-1', dto);
      const updateArg = repo.update.mock.calls[0][1];
      expect(updateArg.effectiveUntil).toEqual(new Date('2027-01-01'));
    });

    it('clears effectiveUntil when null', async () => {
      const dto = { effectiveUntil: undefined };
      await service.update('assign-1', dto);
      expect(repo.update).toHaveBeenCalled();
    });
  });

  // ── archive ──────────────────────────────────────────────────

  describe('archive', () => {
    it('soft-deletes the assignment', async () => {
      await service.archive('assign-1', 'admin-1');
      expect(repo.softDelete).toHaveBeenCalledWith('assign-1', 'admin-1');
    });

    it('creates history record on archive', async () => {
      await service.archive('assign-1', 'admin-1');
      expect(repo.createHistory).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ARCHIVED' }),
      );
    });

    it('emits ARCHIVED event', async () => {
      await service.archive('assign-1', 'admin-1');
      expect(events.emit).toHaveBeenCalledWith(
        REWARD_ASSIGNMENT_EVENTS.ARCHIVED,
        expect.objectContaining({
          assignmentId: 'assign-1',
          storeId: 'store-1',
        }),
      );
    });

    it('invalidates cache after archive', async () => {
      await service.archive('assign-1', 'admin-1');
      expect(cache.invalidateAssignment).toHaveBeenCalledWith('assign-1', 'store-1');
    });

    it('throws NotFoundException for missing assignment', async () => {
      repo.findById.mockResolvedValueOnce(null);
      await expect(service.archive('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── restore ──────────────────────────────────────────────────

  describe('restore', () => {
    beforeEach(() => {
      repo.findActiveByStore.mockResolvedValue(null);
    });

    it('restores an archived assignment', async () => {
      const result = await service.restore('assign-1', 'admin-1');
      expect(repo.restore).toHaveBeenCalledWith('assign-1', 'admin-1');
      expect(result).toBeDefined();
    });

    it('creates history record on restore', async () => {
      await service.restore('assign-1', 'admin-1');
      expect(repo.createHistory).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'RESTORED' }),
      );
    });

    it('emits RESTORED event', async () => {
      await service.restore('assign-1', 'admin-1');
      expect(events.emit).toHaveBeenCalledWith(
        REWARD_ASSIGNMENT_EVENTS.RESTORED,
        expect.objectContaining({
          assignmentId: 'assign-1',
          storeId: 'store-1',
        }),
      );
    });

    it('invalidates cache after restore', async () => {
      await service.restore('assign-1', 'admin-1');
      expect(cache.invalidateAssignment).toHaveBeenCalledWith('assign-1', 'store-1');
    });

    it('throws NotFoundException for missing assignment', async () => {
      repo.findById.mockResolvedValueOnce(null);
      await expect(service.restore('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when store already has active assignment', async () => {
      repo.findActiveByStore.mockResolvedValueOnce(mockAssignment);
      await expect(service.restore('assign-1')).rejects.toThrow(ConflictException);
    });
  });

  // ── edge cases ───────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles assign without optional fields', async () => {
      const dto = { storeId: 'store-1', profileId: 'profile-1' };
      const result = await service.assign(dto);
      expect(result).toEqual(mockAssignment);
    });

    it('handles assign without assignedBy', async () => {
      const dto = { storeId: 'store-1', profileId: 'profile-1' };
      await service.assign(dto);
      const createArg = repo.create.mock.calls[0][0];
      expect(createArg.assignedBy).toBeNull();
    });

    it('handles changeProfile with reason', async () => {
      repo.findActiveByStore.mockResolvedValueOnce(mockAssignment);
      profileRepo.findByIdOrSlug.mockResolvedValueOnce({
        ...mockProfile,
        id: 'profile-2',
        name: 'Economy',
      });
      const dto = { profileId: 'profile-2', reason: 'Downgrading store' };
      await service.changeProfile('store-1', dto, 'admin-1');
      expect(repo.create).toHaveBeenCalled();
    });

    it('handles effectiveFrom on assign', async () => {
      const dto = {
        storeId: 'store-1',
        profileId: 'profile-1',
        effectiveFrom: '2027-01-01',
      };
      await service.assign(dto);
      const createArg = repo.create.mock.calls[0][0];
      expect(createArg.effectiveFrom).toEqual(new Date('2027-01-01'));
    });

    it('sets effectiveFrom to now when not provided', async () => {
      const before = new Date();
      const dto = { storeId: 'store-1', profileId: 'profile-1' };
      await service.assign(dto);
      const createArg = repo.create.mock.calls[0][0];
      expect(createArg.effectiveFrom.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });
});
