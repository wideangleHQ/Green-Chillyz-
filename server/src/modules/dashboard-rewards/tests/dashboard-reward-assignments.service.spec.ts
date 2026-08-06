import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DashboardRewardAssignmentsService } from '../services/dashboard-reward-assignments.service';
import { DASHBOARD_REWARDS_EVENTS } from '../constants';

describe('DashboardRewardAssignmentsService', () => {
  let service: DashboardRewardAssignmentsService;
  let assignmentService: Record<string, ReturnType<typeof vi.fn>>;
  let opsCache: Record<string, ReturnType<typeof vi.fn>>;
  let events: { emit: ReturnType<typeof vi.fn> };

  const mockAssignment = {
    id: 'assign-1',
    storeId: 'store-1',
    profileId: 'profile-1',
    status: 'ACTIVE',
    assignmentType: 'MANUAL',
  };

  beforeEach(() => {
    assignmentService = {
      findAll: vi.fn().mockResolvedValue({ data: [mockAssignment], total: 1 }),
      findById: vi.fn().mockResolvedValue(mockAssignment),
      findByStore: vi.fn().mockResolvedValue(mockAssignment),
      findHistory: vi.fn().mockResolvedValue([mockAssignment]),
      assign: vi.fn().mockResolvedValue(mockAssignment),
      changeProfile: vi.fn().mockResolvedValue({ ...mockAssignment, profileId: 'profile-2' }),
      archive: vi.fn().mockResolvedValue(undefined),
      restore: vi.fn().mockResolvedValue(mockAssignment),
      resolveStoreProfile: vi.fn().mockResolvedValue({ id: 'profile-1', name: 'Standard' }),
    };
    opsCache = { invalidateSection: vi.fn().mockResolvedValue(undefined) };
    events = { emit: vi.fn() };

    service = new DashboardRewardAssignmentsService(
      assignmentService as any,
      opsCache as any,
      events as any,
    );
  });

  describe('list', () => {
    it('delegates to assignmentService.findAll', async () => {
      await service.list({ storeId: 'store-1' });
      expect(assignmentService.findAll).toHaveBeenCalledWith({ storeId: 'store-1' });
    });
  });

  describe('getById', () => {
    it('returns assignment by id', async () => {
      const result = await service.getById('assign-1');
      expect(result).toEqual(mockAssignment);
    });
  });

  describe('getByStore', () => {
    it('returns assignment for store', async () => {
      const result = await service.getByStore('store-1');
      expect(assignmentService.findByStore).toHaveBeenCalledWith('store-1');
      expect(result).toEqual(mockAssignment);
    });
  });

  describe('getHistory', () => {
    it('returns assignment history', async () => {
      await service.getHistory('store-1');
      expect(assignmentService.findHistory).toHaveBeenCalledWith('store-1');
    });
  });

  describe('assign', () => {
    it('creates assignment, emits event, invalidates cache', async () => {
      const dto = { storeId: 'store-1', profileId: 'profile-1' };
      await service.assign(dto as any, 'admin-1');
      expect(assignmentService.assign).toHaveBeenCalledWith(dto, 'admin-1');
      expect(events.emit).toHaveBeenCalledWith(
        DASHBOARD_REWARDS_EVENTS.ASSIGNMENT_CHANGED,
        expect.objectContaining({ action: 'ASSIGNED' }),
      );
      expect(opsCache.invalidateSection).toHaveBeenCalledWith('store-1', 'rewards');
    });
  });

  describe('changeProfile', () => {
    it('changes profile, emits event, invalidates cache', async () => {
      const dto = { profileId: 'profile-2', reason: 'Switching to premium' };
      await service.changeProfile('store-1', dto as any, 'admin-1');
      expect(assignmentService.changeProfile).toHaveBeenCalledWith(
        'store-1',
        { profileId: 'profile-2', reason: 'Switching to premium' },
        'admin-1',
      );
      expect(events.emit).toHaveBeenCalledWith(
        DASHBOARD_REWARDS_EVENTS.ASSIGNMENT_CHANGED,
        expect.objectContaining({ action: 'CHANGED' }),
      );
    });
  });

  describe('archive', () => {
    it('archives and emits event', async () => {
      await service.archive('assign-1', 'store-1', 'admin-1');
      expect(assignmentService.archive).toHaveBeenCalledWith('assign-1', 'admin-1');
      expect(events.emit).toHaveBeenCalledWith(
        DASHBOARD_REWARDS_EVENTS.ASSIGNMENT_CHANGED,
        expect.objectContaining({ action: 'ARCHIVED' }),
      );
    });
  });

  describe('restore', () => {
    it('restores and invalidates cache', async () => {
      await service.restore('assign-1', 'store-1', 'admin-1');
      expect(assignmentService.restore).toHaveBeenCalledWith('assign-1', 'admin-1');
      expect(opsCache.invalidateSection).toHaveBeenCalledWith('store-1', 'rewards');
    });
  });

  describe('bulkAssign', () => {
    it('assigns new stores and changes existing', async () => {
      assignmentService.findByStore
        .mockResolvedValueOnce(mockAssignment)
        .mockRejectedValueOnce(new Error('Not found'));

      const dto = { profileId: 'profile-2', storeIds: ['store-1', 'store-2'], reason: 'Bulk' };
      const results = await service.bulkAssign(dto as any, 'admin-1');
      expect(results).toHaveLength(2);
      expect(assignmentService.changeProfile).toHaveBeenCalledTimes(1);
      expect(assignmentService.assign).toHaveBeenCalledTimes(1);
    });

    it('returns error for failed stores without throwing', async () => {
      assignmentService.findByStore.mockRejectedValue(new Error('Not found'));
      assignmentService.assign.mockRejectedValue(new Error('Invalid profile'));

      const dto = { profileId: 'bad-profile', storeIds: ['store-1'], reason: 'test' };
      const results = await service.bulkAssign(dto as any, 'admin-1');
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Invalid profile');
    });
  });

  describe('resolveStoreProfile', () => {
    it('delegates to assignmentService', async () => {
      await service.resolveStoreProfile('store-1');
      expect(assignmentService.resolveStoreProfile).toHaveBeenCalledWith('store-1');
    });
  });

  describe('cache resilience', () => {
    it('does not throw when cache invalidation fails', async () => {
      opsCache.invalidateSection.mockRejectedValue(new Error('Redis down'));
      const dto = { storeId: 'store-1', profileId: 'profile-1' };
      await expect(service.assign(dto as any, 'admin-1')).resolves.toBeDefined();
    });
  });
});
