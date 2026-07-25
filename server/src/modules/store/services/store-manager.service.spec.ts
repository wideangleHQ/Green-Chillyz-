import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { StoreManagerService } from './store-manager.service';
import { PrismaService } from '../../../database/prisma.service';
import { StoreCacheService } from './store-cache.service';
import { StoreManagerRole, AnnouncementPriority } from '@prisma/client';

describe('StoreManagerService', () => {
  let service: StoreManagerService;
  let prisma: any;
  let cache: { invalidateStore: ReturnType<typeof vi.fn> };

  const storeId = 'store-uuid';
  const userId = 'user-uuid';

  beforeEach(() => {
    prisma = {
      store: { findFirst: vi.fn() },
      user: { findUnique: vi.fn() },
      storeManager: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      storeFacility: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      storeAnnouncement: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    cache = { invalidateStore: vi.fn() };
    service = new StoreManagerService(
      prisma as unknown as PrismaService,
      cache as unknown as StoreCacheService,
    );
  });

  function mockStoreExists(exists = true) {
    prisma.store.findFirst.mockResolvedValue(exists ? { id: storeId } : null);
  }

  // ─── Managers ──────────────────────────────────────────

  describe('assignManager', () => {
    it('should assign a user as store manager', async () => {
      mockStoreExists();
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        fullName: 'John Doe',
        email: 'john@example.com',
      });
      prisma.storeManager.findUnique.mockResolvedValue(null);
      prisma.storeManager.create.mockResolvedValue({
        id: 'm-1',
        userId,
        role: StoreManagerRole.STAFF,
        createdAt: new Date(),
        user: { fullName: 'John Doe', email: 'john@example.com' },
      });

      const result = await service.assignManager(storeId, { userId });

      expect(result.fullName).toBe('John Doe');
      expect(result.role).toBe(StoreManagerRole.STAFF);
      expect(cache.invalidateStore).toHaveBeenCalledWith(storeId);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockStoreExists();
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.assignManager(storeId, { userId }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when already assigned', async () => {
      mockStoreExists();
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.storeManager.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.assignManager(storeId, { userId }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when store missing', async () => {
      mockStoreExists(false);
      await expect(
        service.assignManager(storeId, { userId }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getManagers', () => {
    it('should return managers ordered by role', async () => {
      mockStoreExists();
      prisma.storeManager.findMany.mockResolvedValue([
        {
          id: 'm-1',
          userId,
          role: StoreManagerRole.MANAGER,
          createdAt: new Date(),
          user: { fullName: 'Jane', email: 'jane@test.com' },
        },
      ]);

      const result = await service.getManagers(storeId);
      expect(result).toHaveLength(1);
      expect(result[0].fullName).toBe('Jane');
    });
  });

  describe('updateManager', () => {
    it('should update manager role', async () => {
      prisma.storeManager.findFirst.mockResolvedValue({ id: 'm-1', storeId });
      prisma.storeManager.update.mockResolvedValue({
        id: 'm-1',
        userId,
        role: StoreManagerRole.SUPERVISOR,
        createdAt: new Date(),
        user: { fullName: 'John', email: 'john@test.com' },
      });

      const result = await service.updateManager(storeId, 'm-1', {
        role: StoreManagerRole.SUPERVISOR,
      });

      expect(result.role).toBe(StoreManagerRole.SUPERVISOR);
    });

    it('should throw NotFoundException when manager not found', async () => {
      prisma.storeManager.findFirst.mockResolvedValue(null);
      await expect(
        service.updateManager(storeId, 'bad', { role: StoreManagerRole.MANAGER }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeManager', () => {
    it('should delete manager and invalidate cache', async () => {
      prisma.storeManager.findFirst.mockResolvedValue({ id: 'm-1', storeId });
      prisma.storeManager.delete.mockResolvedValue({ id: 'm-1' });

      await service.removeManager(storeId, 'm-1');

      expect(prisma.storeManager.delete).toHaveBeenCalledWith({
        where: { id: 'm-1' },
      });
      expect(cache.invalidateStore).toHaveBeenCalledWith(storeId);
    });
  });

  // ─── Facilities ────────────────────────────────────────

  describe('addFacility', () => {
    it('should add a facility to the store', async () => {
      mockStoreExists();
      prisma.storeFacility.findUnique.mockResolvedValue(null);
      prisma.storeFacility.create.mockResolvedValue({
        id: 'f-1',
        name: 'WiFi',
        icon: 'wifi-icon',
      });

      const result = await service.addFacility(storeId, {
        name: 'WiFi',
        icon: 'wifi-icon',
      });

      expect(result.name).toBe('WiFi');
      expect(cache.invalidateStore).toHaveBeenCalledWith(storeId);
    });

    it('should throw ConflictException when facility already exists', async () => {
      mockStoreExists();
      prisma.storeFacility.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.addFacility(storeId, { name: 'WiFi' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getFacilities', () => {
    it('should return facilities ordered by name', async () => {
      mockStoreExists();
      prisma.storeFacility.findMany.mockResolvedValue([
        { id: 'f-1', name: 'AC', icon: null },
        { id: 'f-2', name: 'WiFi', icon: 'wifi' },
      ]);

      const result = await service.getFacilities(storeId);
      expect(result).toHaveLength(2);
    });
  });

  describe('removeFacility', () => {
    it('should delete facility', async () => {
      prisma.storeFacility.findFirst.mockResolvedValue({ id: 'f-1', storeId });
      prisma.storeFacility.delete.mockResolvedValue({ id: 'f-1' });

      await service.removeFacility(storeId, 'f-1');
      expect(prisma.storeFacility.delete).toHaveBeenCalledWith({
        where: { id: 'f-1' },
      });
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.storeFacility.findFirst.mockResolvedValue(null);
      await expect(
        service.removeFacility(storeId, 'bad'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Announcements ────────────────────────────────────

  describe('createAnnouncement', () => {
    it('should create an announcement', async () => {
      mockStoreExists();
      const now = new Date();
      const future = new Date(now.getTime() + 86400000 * 7);
      prisma.storeAnnouncement.create.mockResolvedValue({
        id: 'a-1',
        storeId,
        title: 'Sale',
        description: '50% off',
        startDate: now,
        endDate: future,
        priority: AnnouncementPriority.HIGH,
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.createAnnouncement(storeId, {
        title: 'Sale',
        description: '50% off',
        startDate: now.toISOString(),
        endDate: future.toISOString(),
        priority: AnnouncementPriority.HIGH,
      });

      expect(result.title).toBe('Sale');
      expect(result.isActive).toBe(true);
      expect(cache.invalidateStore).toHaveBeenCalledWith(storeId);
    });

    it('should reject when endDate <= startDate', async () => {
      mockStoreExists();
      const now = new Date();
      const past = new Date(now.getTime() - 86400000);

      await expect(
        service.createAnnouncement(storeId, {
          title: 'Sale',
          startDate: now.toISOString(),
          endDate: past.toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAnnouncements', () => {
    it('should return all announcements', async () => {
      mockStoreExists();
      prisma.storeAnnouncement.findMany.mockResolvedValue([]);
      const result = await service.getAnnouncements(storeId);
      expect(result).toEqual([]);
    });
  });

  describe('getActiveAnnouncements', () => {
    it('should filter by current date range', async () => {
      mockStoreExists();
      prisma.storeAnnouncement.findMany.mockResolvedValue([]);

      await service.getActiveAnnouncements(storeId);

      const where = prisma.storeAnnouncement.findMany.mock.calls[0][0].where;
      expect(where.startDate).toHaveProperty('lte');
      expect(where.endDate).toHaveProperty('gte');
    });
  });

  describe('updateAnnouncement', () => {
    it('should update announcement fields', async () => {
      const startDate = new Date('2026-07-01');
      const endDate = new Date('2026-08-01');
      prisma.storeAnnouncement.findFirst.mockResolvedValue({
        id: 'a-1',
        storeId,
        startDate,
        endDate,
      });
      prisma.storeAnnouncement.update.mockResolvedValue({
        id: 'a-1',
        title: 'Updated Sale',
        description: null,
        startDate,
        endDate,
        priority: AnnouncementPriority.MEDIUM,
        createdAt: startDate,
        updatedAt: new Date(),
      });

      const result = await service.updateAnnouncement(storeId, 'a-1', {
        title: 'Updated Sale',
      });

      expect(result.title).toBe('Updated Sale');
    });

    it('should reject invalid date range on update', async () => {
      prisma.storeAnnouncement.findFirst.mockResolvedValue({
        id: 'a-1',
        storeId,
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-09-01'),
      });

      await expect(
        service.updateAnnouncement(storeId, 'a-1', {
          endDate: '2026-07-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.storeAnnouncement.findFirst.mockResolvedValue(null);
      await expect(
        service.updateAnnouncement(storeId, 'bad', { title: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAnnouncement', () => {
    it('should delete announcement', async () => {
      prisma.storeAnnouncement.findFirst.mockResolvedValue({ id: 'a-1', storeId });
      prisma.storeAnnouncement.delete.mockResolvedValue({ id: 'a-1' });

      await service.deleteAnnouncement(storeId, 'a-1');
      expect(prisma.storeAnnouncement.delete).toHaveBeenCalledWith({
        where: { id: 'a-1' },
      });
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.storeAnnouncement.findFirst.mockResolvedValue(null);
      await expect(
        service.deleteAnnouncement(storeId, 'bad'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
