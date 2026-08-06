import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RewardProfileService } from '../services/reward-profile.service';
import { RewardProfileRepository } from '../repositories/reward-profile.repository';
import { RewardProfileCacheService } from '../cache/reward-profile-cache.service';
import { REWARD_PROFILE_ERRORS, REWARD_PROFILE_EVENTS } from '../constants';

describe('RewardProfileService', () => {
  let service: RewardProfileService;
  let repo: Record<string, ReturnType<typeof vi.fn>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;
  let events: { emit: ReturnType<typeof vi.fn> };

  const mockProfile = {
    id: 'p1',
    name: 'Premium Rewards',
    slug: 'premium-rewards',
    description: 'Premium tier',
    status: 'ACTIVE',
    type: 'PREMIUM',
    isDefault: false,
    version: 1,
    createdBy: 'admin-1',
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { versions: 1, metadata: 0 },
  };

  const mockDefaultProfile = {
    ...mockProfile,
    id: 'p-default',
    name: 'Default Rewards',
    slug: 'default-rewards',
    isDefault: true,
    type: 'GLOBAL',
  };

  beforeEach(() => {
    repo = {
      findMany: vi.fn().mockResolvedValue([[mockProfile], 1]),
      findByIdOrSlug: vi.fn().mockResolvedValue(mockProfile),
      findBySlug: vi.fn().mockResolvedValue(null),
      findDefault: vi.fn().mockResolvedValue(mockDefaultProfile),
      create: vi.fn().mockResolvedValue(mockProfile),
      update: vi.fn().mockResolvedValue(mockProfile),
      softDelete: vi.fn().mockResolvedValue(undefined),
      restore: vi.fn().mockResolvedValue({ ...mockProfile, status: 'DRAFT', deletedAt: null }),
      clearDefault: vi.fn().mockResolvedValue(undefined),
      createVersion: vi.fn().mockResolvedValue({ id: 'v1', versionNumber: 1 }),
      findVersions: vi.fn().mockResolvedValue([]),
      findLatestVersion: vi.fn().mockResolvedValue(null),
      upsertMetadata: vi.fn().mockResolvedValue(undefined),
      findMetadata: vi.fn().mockResolvedValue([]),
      deleteMetadata: vi.fn().mockResolvedValue(undefined),
    };

    cache = {
      getItem: vi.fn().mockResolvedValue(null),
      setItem: vi.fn().mockResolvedValue(undefined),
      getDefault: vi.fn().mockResolvedValue(null),
      setDefault: vi.fn().mockResolvedValue(undefined),
      getList: vi.fn().mockResolvedValue(null),
      setList: vi.fn().mockResolvedValue(undefined),
      invalidateProfile: vi.fn().mockResolvedValue(undefined),
      invalidateAll: vi.fn().mockResolvedValue(undefined),
    };

    events = { emit: vi.fn() };

    service = new RewardProfileService(
      repo as unknown as RewardProfileRepository,
      cache as unknown as RewardProfileCacheService,
      events as unknown as EventEmitter2,
    );
  });

  // ─── CRUD ─────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated profiles', async () => {
      const result = await service.findAll({});
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('passes status filter', async () => {
      await service.findAll({ status: 'ACTIVE' as any });
      expect(repo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ACTIVE' }),
        undefined,
        0,
        20,
      );
    });

    it('passes type filter', async () => {
      await service.findAll({ type: 'PREMIUM' as any });
      expect(repo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'PREMIUM' }),
        undefined,
        0,
        20,
      );
    });

    it('passes search filter', async () => {
      await service.findAll({ search: 'premium' });
      expect(repo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ OR: expect.any(Array) }),
        undefined,
        0,
        20,
      );
    });
  });

  describe('findByIdOrSlug', () => {
    it('returns profile from cache', async () => {
      cache.getItem.mockResolvedValue(mockProfile);
      const result = await service.findByIdOrSlug('p1');
      expect(result).toEqual(mockProfile);
      expect(repo.findByIdOrSlug).not.toHaveBeenCalled();
    });

    it('returns profile from DB on cache miss', async () => {
      const result = await service.findByIdOrSlug('p1');
      expect(result).toEqual(mockProfile);
      expect(cache.setItem).toHaveBeenCalledWith('p1', mockProfile);
    });

    it('throws if not found', async () => {
      repo.findByIdOrSlug.mockResolvedValue(null);
      await expect(service.findByIdOrSlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findDefault', () => {
    it('returns default profile', async () => {
      const result = await service.findDefault();
      expect(result).toEqual(mockDefaultProfile);
    });

    it('returns from cache', async () => {
      cache.getDefault.mockResolvedValue(mockDefaultProfile);
      const result = await service.findDefault();
      expect(result).toEqual(mockDefaultProfile);
      expect(repo.findDefault).not.toHaveBeenCalled();
    });

    it('throws if no default', async () => {
      repo.findDefault.mockResolvedValue(null);
      await expect(service.findDefault()).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a profile', async () => {
      const result = await service.create({ name: 'Premium Rewards' }, 'admin-1');
      expect(result).toEqual(mockProfile);
      expect(repo.create).toHaveBeenCalled();
      expect(repo.createVersion).toHaveBeenCalled();
      expect(events.emit).toHaveBeenCalledWith(
        REWARD_PROFILE_EVENTS.CREATED,
        expect.any(Object),
      );
    });

    it('rejects duplicate slug', async () => {
      repo.findBySlug.mockResolvedValue({ id: 'existing', slug: 'premium-rewards' });
      await expect(
        service.create({ name: 'Premium Rewards' }),
      ).rejects.toThrow(ConflictException);
    });

    it('clears default when creating new default', async () => {
      await service.create({ name: 'New Default', isDefault: true });
      expect(repo.clearDefault).toHaveBeenCalled();
    });

    it('saves metadata', async () => {
      await service.create({
        name: 'With Metadata',
        metadata: { tier: 'gold', limit: 100 },
      });
      expect(repo.upsertMetadata).toHaveBeenCalledTimes(2);
    });
  });

  // ─── Slug ─────────────────────────────────────────

  describe('slug generation', () => {
    it('auto-generates slug from name', async () => {
      await service.create({ name: 'Premium Rewards' });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'premium-rewards' }),
      );
    });

    it('uses provided slug', async () => {
      await service.create({ name: 'Premium Rewards', slug: 'custom-slug' });
      expect(repo.findBySlug).toHaveBeenCalledWith('custom-slug');
    });
  });

  // ─── Update ───────────────────────────────────────

  describe('update', () => {
    it('updates and versions', async () => {
      const result = await service.update('p1', { name: 'Updated' }, 'admin-1');
      expect(repo.update).toHaveBeenCalled();
      expect(repo.createVersion).toHaveBeenCalledWith(
        expect.objectContaining({ versionNumber: 2 }),
      );
      expect(events.emit).toHaveBeenCalledWith(
        REWARD_PROFILE_EVENTS.UPDATED,
        expect.any(Object),
      );
    });

    it('throws on not found', async () => {
      repo.findByIdOrSlug.mockResolvedValue(null);
      await expect(service.update('bad', { name: 'x' })).rejects.toThrow(NotFoundException);
    });

    it('prevents archiving default', async () => {
      repo.findByIdOrSlug.mockResolvedValue(mockDefaultProfile);
      await expect(
        service.update('p-default', { status: 'ARCHIVED' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('prevents disabling default', async () => {
      repo.findByIdOrSlug.mockResolvedValue(mockDefaultProfile);
      await expect(
        service.update('p-default', { status: 'DISABLED' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('emits activated event on status change to ACTIVE', async () => {
      repo.findByIdOrSlug.mockResolvedValue({ ...mockProfile, status: 'DRAFT' });
      repo.update.mockResolvedValue({ ...mockProfile, status: 'ACTIVE' });
      await service.update('p1', { status: 'ACTIVE' as any });
      expect(events.emit).toHaveBeenCalledWith(
        REWARD_PROFILE_EVENTS.ACTIVATED,
        expect.any(Object),
      );
    });

    it('emits default changed on setting new default', async () => {
      repo.findByIdOrSlug.mockResolvedValue({ ...mockProfile, isDefault: false });
      await service.update('p1', { isDefault: true });
      expect(repo.clearDefault).toHaveBeenCalled();
      expect(events.emit).toHaveBeenCalledWith(
        REWARD_PROFILE_EVENTS.DEFAULT_CHANGED,
        expect.any(Object),
      );
    });
  });

  // ─── Archive / Restore ────────────────────────────

  describe('archive', () => {
    it('soft-deletes and versions', async () => {
      await service.archive('p1', 'admin-1');
      expect(repo.softDelete).toHaveBeenCalledWith('p1', 'admin-1');
      expect(repo.createVersion).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ARCHIVED' }),
      );
      expect(events.emit).toHaveBeenCalledWith(
        REWARD_PROFILE_EVENTS.ARCHIVED,
        expect.any(Object),
      );
    });

    it('rejects archiving the default profile', async () => {
      repo.findByIdOrSlug.mockResolvedValue(mockDefaultProfile);
      await expect(service.archive('p-default')).rejects.toThrow(BadRequestException);
    });

    it('throws on not found', async () => {
      repo.findByIdOrSlug.mockResolvedValue(null);
      await expect(service.archive('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore', () => {
    it('restores and versions', async () => {
      const result = await service.restore('p1', 'admin-1');
      expect(repo.restore).toHaveBeenCalledWith('p1', 'admin-1');
      expect(repo.createVersion).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'DRAFT' }),
      );
      expect(events.emit).toHaveBeenCalledWith(
        REWARD_PROFILE_EVENTS.RESTORED,
        expect.any(Object),
      );
    });

    it('throws on not found', async () => {
      repo.findByIdOrSlug.mockResolvedValue(null);
      await expect(service.restore('bad')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Duplicate ────────────────────────────────────

  describe('duplicate', () => {
    it('creates a copy with draft status', async () => {
      await service.duplicate('p1', {}, 'admin-1');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Premium Rewards (Copy)',
          status: 'DRAFT',
          isDefault: false,
        }),
      );
      expect(events.emit).toHaveBeenCalledWith(
        REWARD_PROFILE_EVENTS.DUPLICATED,
        expect.any(Object),
      );
    });

    it('copies metadata from source', async () => {
      repo.findMetadata.mockResolvedValue([
        { key: 'tier', value: 'gold' },
        { key: 'limit', value: 100 },
      ]);
      await service.duplicate('p1', {});
      expect(repo.upsertMetadata).toHaveBeenCalledTimes(2);
    });

    it('uses custom name if provided', async () => {
      await service.duplicate('p1', { name: 'Custom Copy' });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Custom Copy' }),
      );
    });

    it('appends timestamp if slug conflicts', async () => {
      repo.findBySlug.mockResolvedValue({ id: 'existing' });
      await service.duplicate('p1', { name: 'Premium Rewards' });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: expect.stringMatching(/^premium-rewards-\d+$/),
        }),
      );
    });

    it('throws on not found', async () => {
      repo.findByIdOrSlug.mockResolvedValue(null);
      await expect(service.duplicate('bad', {})).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Versions ─────────────────────────────────────

  describe('findVersions', () => {
    it('returns versions for existing profile', async () => {
      const versions = [{ id: 'v1', versionNumber: 1 }];
      repo.findVersions.mockResolvedValue(versions);
      const result = await service.findVersions('p1');
      expect(result).toEqual(versions);
    });

    it('throws if profile not found', async () => {
      repo.findByIdOrSlug.mockResolvedValue(null);
      await expect(service.findVersions('bad')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Cache ────────────────────────────────────────

  describe('cache invalidation', () => {
    it('invalidates on create', async () => {
      await service.create({ name: 'Test' });
      expect(cache.invalidateProfile).toHaveBeenCalled();
    });

    it('invalidates on update', async () => {
      await service.update('p1', { name: 'Updated' });
      expect(cache.invalidateProfile).toHaveBeenCalled();
    });

    it('invalidates on archive', async () => {
      await service.archive('p1');
      expect(cache.invalidateProfile).toHaveBeenCalled();
    });

    it('invalidates on restore', async () => {
      await service.restore('p1');
      expect(cache.invalidateProfile).toHaveBeenCalled();
    });

    it('invalidates on duplicate', async () => {
      await service.duplicate('p1', {});
      expect(cache.invalidateProfile).toHaveBeenCalled();
    });
  });

  // ─── Audit events ────────────────────────────────

  describe('event emission', () => {
    it('emits CREATED', async () => {
      await service.create({ name: 'Test' });
      expect(events.emit).toHaveBeenCalledWith(REWARD_PROFILE_EVENTS.CREATED, expect.any(Object));
    });

    it('emits UPDATED', async () => {
      await service.update('p1', { name: 'Updated' });
      expect(events.emit).toHaveBeenCalledWith(REWARD_PROFILE_EVENTS.UPDATED, expect.any(Object));
    });

    it('emits ARCHIVED', async () => {
      await service.archive('p1');
      expect(events.emit).toHaveBeenCalledWith(REWARD_PROFILE_EVENTS.ARCHIVED, expect.any(Object));
    });

    it('emits RESTORED', async () => {
      await service.restore('p1');
      expect(events.emit).toHaveBeenCalledWith(REWARD_PROFILE_EVENTS.RESTORED, expect.any(Object));
    });

    it('emits DUPLICATED', async () => {
      await service.duplicate('p1', {});
      expect(events.emit).toHaveBeenCalledWith(REWARD_PROFILE_EVENTS.DUPLICATED, expect.any(Object));
    });
  });

  // ─── Default profile validation ───────────────────

  describe('default profile', () => {
    it('exactly one default at a time', async () => {
      await service.create({ name: 'New Default', isDefault: true });
      expect(repo.clearDefault).toHaveBeenCalled();
    });

    it('clears previous default on update', async () => {
      repo.findByIdOrSlug.mockResolvedValue({ ...mockProfile, isDefault: false });
      await service.update('p1', { isDefault: true });
      expect(repo.clearDefault).toHaveBeenCalledWith('p1');
    });
  });
});
