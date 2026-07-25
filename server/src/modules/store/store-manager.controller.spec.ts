import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  StoreManagerController,
  StoreFacilityController,
  StoreAnnouncementController,
} from './store-manager.controller';
import { StoreManagerService } from './services/store-manager.service';
import { StoreManagerRole, AnnouncementPriority } from '@prisma/client';

const storeId = '550e8400-e29b-41d4-a716-446655440000';
const managerId = '660e8400-e29b-41d4-a716-446655440000';
const userId = '770e8400-e29b-41d4-a716-446655440000';
const facilityId = '880e8400-e29b-41d4-a716-446655440000';
const announcementId = '990e8400-e29b-41d4-a716-446655440000';

function createMockService() {
  return {
    assignManager: vi.fn(),
    getManagers: vi.fn(),
    updateManager: vi.fn(),
    removeManager: vi.fn(),
    addFacility: vi.fn(),
    getFacilities: vi.fn(),
    removeFacility: vi.fn(),
    createAnnouncement: vi.fn(),
    getAnnouncements: vi.fn(),
    getActiveAnnouncements: vi.fn(),
    updateAnnouncement: vi.fn(),
    deleteAnnouncement: vi.fn(),
  };
}

describe('StoreManagerController', () => {
  let controller: StoreManagerController;
  let service: ReturnType<typeof createMockService>;

  beforeEach(() => {
    service = createMockService();
    controller = new StoreManagerController(service as unknown as StoreManagerService);
  });

  describe('assign', () => {
    it('should assign a manager', async () => {
      service.assignManager.mockResolvedValue({
        id: managerId,
        userId,
        fullName: 'John Doe',
        email: 'john@test.com',
        role: StoreManagerRole.MANAGER,
        createdAt: new Date(),
      });

      const result = await controller.assign(storeId, {
        userId,
        role: StoreManagerRole.MANAGER,
      });

      expect(service.assignManager).toHaveBeenCalledWith(storeId, {
        userId,
        role: StoreManagerRole.MANAGER,
      });
      expect(result.fullName).toBe('John Doe');
    });
  });

  describe('list', () => {
    it('should return managers', async () => {
      service.getManagers.mockResolvedValue([]);
      const result = await controller.list(storeId);
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update manager role', async () => {
      service.updateManager.mockResolvedValue({
        id: managerId,
        role: StoreManagerRole.SUPERVISOR,
      });

      const result = await controller.update(storeId, managerId, {
        role: StoreManagerRole.SUPERVISOR,
      });

      expect(result.role).toBe(StoreManagerRole.SUPERVISOR);
    });
  });

  describe('remove', () => {
    it('should remove and return message', async () => {
      service.removeManager.mockResolvedValue(undefined);
      const result = await controller.remove(storeId, managerId);
      expect(result.message).toBe('Manager removed successfully');
    });
  });
});

describe('StoreFacilityController', () => {
  let controller: StoreFacilityController;
  let service: ReturnType<typeof createMockService>;

  beforeEach(() => {
    service = createMockService();
    controller = new StoreFacilityController(service as unknown as StoreManagerService);
  });

  describe('add', () => {
    it('should add a facility', async () => {
      service.addFacility.mockResolvedValue({
        id: facilityId,
        name: 'WiFi',
        icon: 'wifi',
      });

      const result = await controller.add(storeId, { name: 'WiFi', icon: 'wifi' });
      expect(result.name).toBe('WiFi');
    });
  });

  describe('list', () => {
    it('should return facilities', async () => {
      service.getFacilities.mockResolvedValue([
        { id: facilityId, name: 'WiFi', icon: 'wifi' },
      ]);
      const result = await controller.list(storeId);
      expect(result).toHaveLength(1);
    });
  });

  describe('remove', () => {
    it('should remove and return message', async () => {
      service.removeFacility.mockResolvedValue(undefined);
      const result = await controller.remove(storeId, facilityId);
      expect(result.message).toBe('Facility removed successfully');
    });
  });
});

describe('StoreAnnouncementController', () => {
  let controller: StoreAnnouncementController;
  let service: ReturnType<typeof createMockService>;

  beforeEach(() => {
    service = createMockService();
    controller = new StoreAnnouncementController(service as unknown as StoreManagerService);
  });

  describe('create', () => {
    it('should create an announcement', async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 86400000 * 7);
      service.createAnnouncement.mockResolvedValue({
        id: announcementId,
        title: 'Summer Sale',
        description: '50% off',
        startDate: now,
        endDate: future,
        priority: AnnouncementPriority.HIGH,
        isActive: true,
      });

      const result = await controller.create(storeId, {
        title: 'Summer Sale',
        description: '50% off',
        startDate: now.toISOString(),
        endDate: future.toISOString(),
        priority: AnnouncementPriority.HIGH,
      });

      expect(result.title).toBe('Summer Sale');
    });
  });

  describe('list', () => {
    it('should return all announcements', async () => {
      service.getAnnouncements.mockResolvedValue([]);
      const result = await controller.list(storeId);
      expect(result).toEqual([]);
    });
  });

  describe('listActive', () => {
    it('should return active announcements', async () => {
      service.getActiveAnnouncements.mockResolvedValue([]);
      const result = await controller.listActive(storeId);
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update an announcement', async () => {
      service.updateAnnouncement.mockResolvedValue({
        id: announcementId,
        title: 'Updated Sale',
      });

      const result = await controller.update(storeId, announcementId, {
        title: 'Updated Sale',
      });

      expect(result.title).toBe('Updated Sale');
    });
  });

  describe('remove', () => {
    it('should delete and return message', async () => {
      service.deleteAnnouncement.mockResolvedValue(undefined);
      const result = await controller.remove(storeId, announcementId);
      expect(result.message).toBe('Announcement deleted successfully');
    });
  });
});
