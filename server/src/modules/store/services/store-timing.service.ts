import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { StoreCacheService } from './store-cache.service';
import {
  BulkStoreTimingDto,
  UpdateStoreTimingDto,
  CreateStoreHolidayDto,
  UpdateStoreHolidayDto,
} from '../dto';
import {
  StoreTimingResponse,
  StoreHolidayResponse,
} from '../interfaces';
import { STORE_ERRORS } from '../constants';

@Injectable()
export class StoreTimingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: StoreCacheService,
  ) {}

  async setTimings(
    storeId: string,
    dto: BulkStoreTimingDto,
  ): Promise<StoreTimingResponse[]> {
    await this.ensureStoreExists(storeId);

    for (const item of dto.timings) {
      if (!item.isClosed && item.opensAt >= item.closesAt) {
        throw new BadRequestException(
          `${STORE_ERRORS.INVALID_TIMING} for ${item.dayOfWeek}`,
        );
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.storeTiming.deleteMany({ where: { storeId } });

      return tx.storeTiming.createManyAndReturn({
        data: dto.timings.map((t) => ({
          storeId,
          dayOfWeek: t.dayOfWeek,
          opensAt: t.opensAt,
          closesAt: t.closesAt,
          isClosed: t.isClosed ?? false,
        })),
      });
    });

    await this.cache.invalidateStore(storeId);

    return result.map((t) => ({
      id: t.id,
      dayOfWeek: t.dayOfWeek,
      opensAt: t.opensAt,
      closesAt: t.closesAt,
      isClosed: t.isClosed,
    }));
  }

  async getTimings(storeId: string): Promise<StoreTimingResponse[]> {
    await this.ensureStoreExists(storeId);

    const timings = await this.prisma.storeTiming.findMany({
      where: { storeId },
      orderBy: { dayOfWeek: 'asc' },
    });

    return timings.map((t) => ({
      id: t.id,
      dayOfWeek: t.dayOfWeek,
      opensAt: t.opensAt,
      closesAt: t.closesAt,
      isClosed: t.isClosed,
    }));
  }

  async updateTiming(
    storeId: string,
    timingId: string,
    dto: UpdateStoreTimingDto,
  ): Promise<StoreTimingResponse> {
    const timing = await this.prisma.storeTiming.findFirst({
      where: { id: timingId, storeId },
    });

    if (!timing) {
      throw new NotFoundException(STORE_ERRORS.TIMING_NOT_FOUND);
    }

    const opensAt = dto.opensAt ?? timing.opensAt;
    const closesAt = dto.closesAt ?? timing.closesAt;
    const isClosed = dto.isClosed ?? timing.isClosed;

    if (!isClosed && opensAt >= closesAt) {
      throw new BadRequestException(STORE_ERRORS.INVALID_TIMING);
    }

    const updated = await this.prisma.storeTiming.update({
      where: { id: timingId },
      data: { opensAt, closesAt, isClosed },
    });

    await this.cache.invalidateStore(storeId);

    return {
      id: updated.id,
      dayOfWeek: updated.dayOfWeek,
      opensAt: updated.opensAt,
      closesAt: updated.closesAt,
      isClosed: updated.isClosed,
    };
  }

  async createHoliday(
    storeId: string,
    dto: CreateStoreHolidayDto,
  ): Promise<StoreHolidayResponse> {
    await this.ensureStoreExists(storeId);

    const date = new Date(dto.date);

    const existing = await this.prisma.storeHoliday.findUnique({
      where: { uq_store_holiday_date: { storeId, date } },
    });

    if (existing) {
      throw new BadRequestException(STORE_ERRORS.HOLIDAY_DATE_EXISTS);
    }

    const holiday = await this.prisma.storeHoliday.create({
      data: {
        storeId,
        date,
        reason: dto.reason,
        isClosed: dto.isClosed ?? true,
      },
    });

    await this.cache.invalidateStore(storeId);

    return {
      id: holiday.id,
      date: holiday.date,
      reason: holiday.reason,
      isClosed: holiday.isClosed,
    };
  }

  async getHolidays(storeId: string): Promise<StoreHolidayResponse[]> {
    await this.ensureStoreExists(storeId);

    const holidays = await this.prisma.storeHoliday.findMany({
      where: { storeId },
      orderBy: { date: 'asc' },
    });

    return holidays.map((h) => ({
      id: h.id,
      date: h.date,
      reason: h.reason,
      isClosed: h.isClosed,
    }));
  }

  async updateHoliday(
    storeId: string,
    holidayId: string,
    dto: UpdateStoreHolidayDto,
  ): Promise<StoreHolidayResponse> {
    const holiday = await this.prisma.storeHoliday.findFirst({
      where: { id: holidayId, storeId },
    });

    if (!holiday) {
      throw new NotFoundException(STORE_ERRORS.HOLIDAY_NOT_FOUND);
    }

    const updated = await this.prisma.storeHoliday.update({
      where: { id: holidayId },
      data: dto,
    });

    await this.cache.invalidateStore(storeId);

    return {
      id: updated.id,
      date: updated.date,
      reason: updated.reason,
      isClosed: updated.isClosed,
    };
  }

  async deleteHoliday(storeId: string, holidayId: string): Promise<void> {
    const holiday = await this.prisma.storeHoliday.findFirst({
      where: { id: holidayId, storeId },
    });

    if (!holiday) {
      throw new NotFoundException(STORE_ERRORS.HOLIDAY_NOT_FOUND);
    }

    await this.prisma.storeHoliday.delete({ where: { id: holidayId } });
    await this.cache.invalidateStore(storeId);
  }

  private async ensureStoreExists(storeId: string): Promise<void> {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, deletedAt: null },
      select: { id: true },
    });

    if (!store) {
      throw new NotFoundException(STORE_ERRORS.NOT_FOUND);
    }
  }
}
