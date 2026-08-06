import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DashboardRewardProfilesService } from '../services/dashboard-reward-profiles.service';
import { DASHBOARD_REWARDS_EVENTS } from '../constants';

describe('DashboardRewardProfilesService', () => {
  let service: DashboardRewardProfilesService;
  let profileService: Record<string, ReturnType<typeof vi.fn>>;
  let profileRepo: Record<string, ReturnType<typeof vi.fn>>;
  let opsCache: Record<string, ReturnType<typeof vi.fn>>;
  let events: { emit: ReturnType<typeof vi.fn> };

  const mockProfile = {
    id: 'profile-1',
    name: 'Standard Rewards',
    slug: 'standard-rewards',
    description: 'Default rewards profile',
    type: 'STANDARD',
    status: 'ACTIVE',
    isDefault: false,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    profileService = {
      findAll: vi.fn().mockResolvedValue({ data: [mockProfile], total: 1 }),
      findByIdOrSlug: vi.fn().mockResolvedValue(mockProfile),
      findDefault: vi.fn().mockResolvedValue(mockProfile),
      create: vi.fn().mockResolvedValue(mockProfile),
      update: vi.fn().mockResolvedValue(mockProfile),
      archive: vi.fn().mockResolvedValue(undefined),
      restore: vi.fn().mockResolvedValue(mockProfile),
      duplicate: vi.fn().mockResolvedValue({ ...mockProfile, id: 'profile-2', name: 'Copy' }),
      findVersions: vi.fn().mockResolvedValue([]),
    };
    profileRepo = {};
    opsCache = {
      invalidateSection: vi.fn().mockResolvedValue(undefined),
    };
    events = { emit: vi.fn() };

    service = new DashboardRewardProfilesService(
      profileService as any,
      profileRepo as any,
      opsCache as any,
      events as any,
    );
  });

  describe('list', () => {
    it('delegates to profileService.findAll', async () => {
      const query = { search: 'test', page: 1, pageSize: 10 };
      const result = await service.list(query as any);
      expect(profileService.findAll).toHaveBeenCalledWith({
        search: 'test',
        status: undefined,
        type: undefined,
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual({ data: [mockProfile], total: 1 });
    });
  });

  describe('getById', () => {
    it('returns profile by id', async () => {
      const result = await service.getById('profile-1');
      expect(profileService.findByIdOrSlug).toHaveBeenCalledWith('profile-1');
      expect(result).toEqual(mockProfile);
    });

    it('returns profile by slug', async () => {
      await service.getById('standard-rewards');
      expect(profileService.findByIdOrSlug).toHaveBeenCalledWith('standard-rewards');
    });
  });

  describe('getDefault', () => {
    it('returns default profile', async () => {
      const result = await service.getDefault();
      expect(profileService.findDefault).toHaveBeenCalled();
      expect(result).toEqual(mockProfile);
    });
  });

  describe('create', () => {
    it('creates profile and invalidates cache', async () => {
      const dto = { name: 'New Profile', description: 'desc', type: 'STANDARD' };
      const result = await service.create(dto as any, 'store-1');
      expect(profileService.create).toHaveBeenCalled();
      expect(opsCache.invalidateSection).toHaveBeenCalledWith('store-1', 'rewards');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('update', () => {
    it('updates profile and invalidates cache', async () => {
      const dto = { name: 'Updated' };
      await service.update('profile-1', dto as any, 'store-1');
      expect(profileService.update).toHaveBeenCalledWith('profile-1', dto, 'store-1');
      expect(opsCache.invalidateSection).toHaveBeenCalledWith('store-1', 'rewards');
    });
  });

  describe('archive', () => {
    it('archives profile and invalidates cache', async () => {
      await service.archive('profile-1', 'store-1');
      expect(profileService.archive).toHaveBeenCalledWith('profile-1', 'store-1');
      expect(opsCache.invalidateSection).toHaveBeenCalledWith('store-1', 'rewards');
    });
  });

  describe('restore', () => {
    it('restores profile and invalidates cache', async () => {
      await service.restore('profile-1', 'store-1');
      expect(profileService.restore).toHaveBeenCalledWith('profile-1', 'store-1');
      expect(opsCache.invalidateSection).toHaveBeenCalledWith('store-1', 'rewards');
    });
  });

  describe('duplicate', () => {
    it('duplicates profile and invalidates cache', async () => {
      const dto = { name: 'Copy' };
      await service.duplicate('profile-1', dto as any, 'store-1');
      expect(profileService.duplicate).toHaveBeenCalledWith('profile-1', { name: 'Copy' }, 'store-1');
      expect(opsCache.invalidateSection).toHaveBeenCalledWith('store-1', 'rewards');
    });
  });

  describe('setDefault', () => {
    it('sets default and emits event', async () => {
      await service.setDefault('profile-1', 'store-1');
      expect(profileService.update).toHaveBeenCalledWith(
        'profile-1',
        expect.objectContaining({ isDefault: true }),
        'store-1',
      );
      expect(events.emit).toHaveBeenCalledWith(
        DASHBOARD_REWARDS_EVENTS.DEFAULT_PROFILE_CHANGED,
        expect.objectContaining({ profileId: 'profile-1' }),
      );
      expect(opsCache.invalidateSection).toHaveBeenCalledWith('store-1', 'rewards');
    });
  });

  describe('publish', () => {
    it('publishes profile (sets ACTIVE) and emits event', async () => {
      const dto = { changeReason: 'Ready for launch' };
      await service.publish('profile-1', dto as any, 'store-1');
      expect(profileService.update).toHaveBeenCalledWith(
        'profile-1',
        expect.objectContaining({ status: 'ACTIVE' }),
        'store-1',
      );
      expect(events.emit).toHaveBeenCalledWith(
        DASHBOARD_REWARDS_EVENTS.PROFILE_PUBLISHED,
        expect.objectContaining({ profileId: 'profile-1' }),
      );
    });
  });

  describe('getVersions', () => {
    it('delegates to profileService.findVersions', async () => {
      await service.getVersions('profile-1');
      expect(profileService.findVersions).toHaveBeenCalledWith('profile-1');
    });
  });

  describe('rollbackVersion', () => {
    it('throws NotFoundException when version not found', async () => {
      profileService.findVersions.mockResolvedValue([]);
      await expect(service.rollbackVersion('profile-1', 3, 'store-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when snapshot is null', async () => {
      profileService.findVersions.mockResolvedValue([
        { versionNumber: 1, snapshot: null },
      ]);
      await expect(service.rollbackVersion('profile-1', 1, 'store-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rolls back to snapshot and invalidates cache', async () => {
      profileService.findVersions.mockResolvedValue([
        {
          versionNumber: 1,
          snapshot: { name: 'Old Name', description: 'Old Desc', type: 'STANDARD', status: 'ACTIVE' },
        },
      ]);
      await service.rollbackVersion('profile-1', 1, 'store-1');
      expect(profileService.update).toHaveBeenCalledWith(
        'profile-1',
        expect.objectContaining({
          name: 'Old Name',
          changeReason: 'Rollback to version 1',
        }),
        'store-1',
      );
      expect(opsCache.invalidateSection).toHaveBeenCalledWith('store-1', 'rewards');
    });
  });

  describe('cache resilience', () => {
    it('does not throw when cache invalidation fails', async () => {
      opsCache.invalidateSection.mockRejectedValue(new Error('Redis down'));
      await expect(service.create({ name: 'Test' } as any, 'store-1')).resolves.toBeDefined();
    });
  });
});
