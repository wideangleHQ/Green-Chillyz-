import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StoreTimingService } from './store-timing.service';
import { PrismaService } from '../../../database/prisma.service';
import { StoreCacheService } from './store-cache.service';
import { DayOfWeek } from '@prisma/client';

describe('StoreTimingService', () => {
  let service: StoreTimingService;
  let prisma: any;
  let cache: { invalidateStore: ReturnType<typeof vi.fn> };

  const storeId = 'store-uuid';
  const timingId = 'timing-uuid';

  beforeEach(() => {
    prisma = {
      store: { findFirst: vi.fn() },
      storeTiming: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        deleteMany: vi.fn(),
        createManyAndReturn: vi.fn(),
        update: vi.fn(),
      },
      storeHoliday: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    cache = { invalidateStore: vi.fn() };
    service = new StoreTimingService(
      prisma as unknown as PrismaService,
      cache as unknown as StoreCacheService,
    );
  });

  function mockStoreExists(exists = true) {
    prisma.store.findFirst.mockResolvedValue(exists ? { id: storeId } : null);
  }

  describe('setTimings', () => {
    it('should delete existing and create new timings in transaction', async () => {
      mockStoreExists();
      const timings = [
        { dayOfWeek: DayOfWeek.MONDAY, opensAt: '09:00', closesAt: '21:00', isClosed: false },
        { dayOfWeek: DayOfWeek.SUNDAY, opensAt: '10:00', closesAt: '20:00', isClosed: false },
      ];

      const created = timings.map((t, i) => ({
        id: `t-${i}`,
        ...t,
        isClosed: false,
      }));

      prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));
      prisma.storeTiming.deleteMany.mockResolvedValue({ count: 0 });
      prisma.storeTiming.createManyAndReturn.mockResolvedValue(created);

      const result = await service.setTimings(storeId, { timings });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result[0].dayOfWeek).toBe(DayOfWeek.MONDAY);
      expect(cache.invalidateStore).toHaveBeenCalledWith(storeId);
    });

    it('should reject when opensAt >= closesAt and not closed', async () => {
      mockStoreExists();
      const timings = [
        { dayOfWeek: DayOfWeek.MONDAY, opensAt: '21:00', closesAt: '09:00', isClosed: false },
      ];

      await expect(service.setTimings(storeId, { timings })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow opensAt >= closesAt when isClosed is true', async () => {
      mockStoreExists();
      const timings = [
        { dayOfWeek: DayOfWeek.MONDAY, opensAt: '21:00', closesAt: '09:00', isClosed: true },
      ];

      prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));
      prisma.storeTiming.deleteMany.mockResolvedValue({ count: 0 });
      prisma.storeTiming.createManyAndReturn.mockResolvedValue([
        { id: 't-1', ...timings[0] },
      ]);

      await expect(service.setTimings(storeId, { timings })).resolves.toBeDefined();
    });

    it('should throw NotFoundException when store does not exist', async () => {
      mockStoreExists(false);
      await expect(service.setTimings(storeId, { timings: [] })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTimings', () => {
    it('should return timings ordered by dayOfWeek', async () => {
      mockStoreExists();
      const timings = [
        { id: 't-1', dayOfWeek: DayOfWeek.MONDAY, opensAt: '09:00', closesAt: '21:00', isClosed: false },
      ];
      prisma.storeTiming.findMany.mockResolvedValue(timings);

      const result = await service.getTimings(storeId);

      expect(prisma.storeTiming.findMany).toHaveBeenCalledWith({
        where: { storeId },
        orderBy: { dayOfWeek: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('t-1');
    });
  });

  describe('updateTiming', () => {
    it('should update existing timing', async () => {
      const existing = {
        id: timingId,
        storeId,
        dayOfWeek: DayOfWeek.MONDAY,
        opensAt: '09:00',
        closesAt: '21:00',
        isClosed: false,
      };
      prisma.storeTiming.findFirst.mockResolvedValue(existing);
      prisma.storeTiming.update.mockResolvedValue({
        ...existing,
        closesAt: '22:00',
      });

      const result = await service.updateTiming(storeId, timingId, {
        closesAt: '22:00',
      });

      expect(result.closesAt).toBe('22:00');
      expect(cache.invalidateStore).toHaveBeenCalledWith(storeId);
    });

    it('should throw NotFoundException when timing not found', async () => {
      prisma.storeTiming.findFirst.mockResolvedValue(null);
      await expect(
        service.updateTiming(storeId, 'bad-id', { closesAt: '22:00' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject invalid time range on update', async () => {
      prisma.storeTiming.findFirst.mockResolvedValue({
        id: timingId,
        opensAt: '09:00',
        closesAt: '21:00',
        isClosed: false,
      });

      await expect(
        service.updateTiming(storeId, timingId, { opensAt: '22:00' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createHoliday', () => {
    it('should create a new holiday', async () => {
      mockStoreExists();
      prisma.storeHoliday.findUnique.mockResolvedValue(null);
      const created = {
        id: 'h-1',
        storeId,
        date: new Date('2026-12-25'),
        reason: 'Christmas',
        isClosed: true,
      };
      prisma.storeHoliday.create.mockResolvedValue(created);

      const result = await service.createHoliday(storeId, {
        date: '2026-12-25',
        reason: 'Christmas',
      });

      expect(result.id).toBe('h-1');
      expect(result.reason).toBe('Christmas');
      expect(cache.invalidateStore).toHaveBeenCalledWith(storeId);
    });

    it('should reject duplicate holiday date', async () => {
      mockStoreExists();
      prisma.storeHoliday.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createHoliday(storeId, { date: '2026-12-25' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getHolidays', () => {
    it('should return holidays ordered by date', async () => {
      mockStoreExists();
      prisma.storeHoliday.findMany.mockResolvedValue([
        { id: 'h-1', date: new Date('2026-01-01'), reason: 'NY', isClosed: true },
      ]);

      const result = await service.getHolidays(storeId);
      expect(result).toHaveLength(1);
      expect(result[0].reason).toBe('NY');
    });
  });

  describe('updateHoliday', () => {
    it('should update existing holiday', async () => {
      const existing = {
        id: 'h-1',
        storeId,
        date: new Date('2026-12-25'),
        reason: 'Christmas',
        isClosed: true,
      };
      prisma.storeHoliday.findFirst.mockResolvedValue(existing);
      prisma.storeHoliday.update.mockResolvedValue({
        ...existing,
        reason: 'Christmas Day',
      });

      const result = await service.updateHoliday(storeId, 'h-1', {
        reason: 'Christmas Day',
      });

      expect(result.reason).toBe('Christmas Day');
    });

    it('should throw NotFoundException when holiday not found', async () => {
      prisma.storeHoliday.findFirst.mockResolvedValue(null);
      await expect(
        service.updateHoliday(storeId, 'bad', { reason: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteHoliday', () => {
    it('should delete existing holiday', async () => {
      prisma.storeHoliday.findFirst.mockResolvedValue({ id: 'h-1', storeId });
      prisma.storeHoliday.delete.mockResolvedValue({ id: 'h-1' });

      await service.deleteHoliday(storeId, 'h-1');

      expect(prisma.storeHoliday.delete).toHaveBeenCalledWith({
        where: { id: 'h-1' },
      });
      expect(cache.invalidateStore).toHaveBeenCalledWith(storeId);
    });

    it('should throw NotFoundException when holiday not found', async () => {
      prisma.storeHoliday.findFirst.mockResolvedValue(null);
      await expect(service.deleteHoliday(storeId, 'bad')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
