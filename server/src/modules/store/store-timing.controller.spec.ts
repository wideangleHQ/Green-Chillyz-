import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StoreTimingController, StoreHolidayController } from './store-timing.controller';
import { StoreTimingService } from './services/store-timing.service';
import { DayOfWeek } from '@prisma/client';

const storeId = '550e8400-e29b-41d4-a716-446655440000';
const timingId = '660e8400-e29b-41d4-a716-446655440000';
const holidayId = '770e8400-e29b-41d4-a716-446655440000';

describe('StoreTimingController', () => {
  let controller: StoreTimingController;
  let service: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    service = {
      setTimings: vi.fn(),
      getTimings: vi.fn(),
      updateTiming: vi.fn(),
      createHoliday: vi.fn(),
      getHolidays: vi.fn(),
      updateHoliday: vi.fn(),
      deleteHoliday: vi.fn(),
    };
    controller = new StoreTimingController(service as unknown as StoreTimingService);
  });

  describe('setTimings', () => {
    it('should set store timings', async () => {
      const timings = [
        { dayOfWeek: DayOfWeek.MONDAY, opensAt: '09:00', closesAt: '21:00', isClosed: false },
      ];
      service.setTimings.mockResolvedValue(timings.map((t, i) => ({ id: `t-${i}`, ...t })));

      const result = await controller.setTimings(storeId, { timings } as any);

      expect(service.setTimings).toHaveBeenCalledWith(storeId, { timings });
      expect(result).toHaveLength(1);
    });
  });

  describe('getTimings', () => {
    it('should return timings', async () => {
      service.getTimings.mockResolvedValue([]);
      const result = await controller.getTimings(storeId);
      expect(service.getTimings).toHaveBeenCalledWith(storeId);
      expect(result).toEqual([]);
    });
  });

  describe('updateTiming', () => {
    it('should update a timing entry', async () => {
      service.updateTiming.mockResolvedValue({
        id: timingId,
        opensAt: '10:00',
        closesAt: '22:00',
      });

      const result = await controller.updateTiming(storeId, timingId, {
        opensAt: '10:00',
        closesAt: '22:00',
      });

      expect(service.updateTiming).toHaveBeenCalledWith(storeId, timingId, {
        opensAt: '10:00',
        closesAt: '22:00',
      });
      expect(result.opensAt).toBe('10:00');
    });
  });
});

describe('StoreHolidayController', () => {
  let controller: StoreHolidayController;
  let service: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    service = {
      setTimings: vi.fn(),
      getTimings: vi.fn(),
      updateTiming: vi.fn(),
      createHoliday: vi.fn(),
      getHolidays: vi.fn(),
      updateHoliday: vi.fn(),
      deleteHoliday: vi.fn(),
    };
    controller = new StoreHolidayController(service as unknown as StoreTimingService);
  });

  describe('createHoliday', () => {
    it('should create a holiday', async () => {
      service.createHoliday.mockResolvedValue({
        id: holidayId,
        date: new Date('2026-12-25'),
        reason: 'Christmas',
        isClosed: true,
      });

      const result = await controller.createHoliday(storeId, {
        date: '2026-12-25',
        reason: 'Christmas',
      });

      expect(result.reason).toBe('Christmas');
    });
  });

  describe('getHolidays', () => {
    it('should return holidays', async () => {
      service.getHolidays.mockResolvedValue([]);
      const result = await controller.getHolidays(storeId);
      expect(result).toEqual([]);
    });
  });

  describe('updateHoliday', () => {
    it('should update a holiday', async () => {
      service.updateHoliday.mockResolvedValue({
        id: holidayId,
        reason: 'Christmas Day',
      });

      const result = await controller.updateHoliday(storeId, holidayId, {
        reason: 'Christmas Day',
      });

      expect(result.reason).toBe('Christmas Day');
    });
  });

  describe('deleteHoliday', () => {
    it('should delete and return message', async () => {
      service.deleteHoliday.mockResolvedValue(undefined);
      const result = await controller.deleteHoliday(storeId, holidayId);
      expect(result.message).toBe('Holiday deleted successfully');
    });
  });
});
