import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { StoreCacheService } from './store-cache.service';
import {
  CreateStoreManagerDto,
  UpdateStoreManagerDto,
  CreateStoreFacilityDto,
  CreateStoreAnnouncementDto,
  UpdateStoreAnnouncementDto,
} from '../dto';
import {
  StoreManagerResponse,
  StoreFacilityResponse,
  StoreAnnouncementResponse,
} from '../interfaces';
import { STORE_ERRORS } from '../constants';

@Injectable()
export class StoreManagerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: StoreCacheService,
  ) {}

  // ─── Managers ──────────────────────────────────────────

  async assignManager(
    storeId: string,
    dto: CreateStoreManagerDto,
  ): Promise<StoreManagerResponse> {
    await this.ensureStoreExists(storeId);

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, fullName: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.storeManager.findUnique({
      where: { uq_store_manager_user: { storeId, userId: dto.userId } },
    });

    if (existing) {
      throw new ConflictException(STORE_ERRORS.MANAGER_EXISTS);
    }

    const manager = await this.prisma.storeManager.create({
      data: {
        storeId,
        userId: dto.userId,
        role: dto.role ?? 'STAFF',
      },
      include: { user: { select: { fullName: true, email: true } } },
    });

    await this.cache.invalidateStore(storeId);

    return {
      id: manager.id,
      userId: manager.userId,
      fullName: manager.user.fullName,
      email: manager.user.email,
      role: manager.role,
      createdAt: manager.createdAt,
    };
  }

  async getManagers(storeId: string): Promise<StoreManagerResponse[]> {
    await this.ensureStoreExists(storeId);

    const managers = await this.prisma.storeManager.findMany({
      where: { storeId },
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { role: 'asc' },
    });

    return managers.map((m) => ({
      id: m.id,
      userId: m.userId,
      fullName: m.user.fullName,
      email: m.user.email,
      role: m.role,
      createdAt: m.createdAt,
    }));
  }

  async updateManager(
    storeId: string,
    managerId: string,
    dto: UpdateStoreManagerDto,
  ): Promise<StoreManagerResponse> {
    const manager = await this.prisma.storeManager.findFirst({
      where: { id: managerId, storeId },
    });

    if (!manager) {
      throw new NotFoundException(STORE_ERRORS.MANAGER_NOT_FOUND);
    }

    const updated = await this.prisma.storeManager.update({
      where: { id: managerId },
      data: { role: dto.role },
      include: { user: { select: { fullName: true, email: true } } },
    });

    await this.cache.invalidateStore(storeId);

    return {
      id: updated.id,
      userId: updated.userId,
      fullName: updated.user.fullName,
      email: updated.user.email,
      role: updated.role,
      createdAt: updated.createdAt,
    };
  }

  async removeManager(storeId: string, managerId: string): Promise<void> {
    const manager = await this.prisma.storeManager.findFirst({
      where: { id: managerId, storeId },
    });

    if (!manager) {
      throw new NotFoundException(STORE_ERRORS.MANAGER_NOT_FOUND);
    }

    await this.prisma.storeManager.delete({ where: { id: managerId } });
    await this.cache.invalidateStore(storeId);
  }

  // ─── Facilities ────────────────────────────────────────

  async addFacility(
    storeId: string,
    dto: CreateStoreFacilityDto,
  ): Promise<StoreFacilityResponse> {
    await this.ensureStoreExists(storeId);

    const existing = await this.prisma.storeFacility.findUnique({
      where: { uq_store_facility_name: { storeId, name: dto.name } },
    });

    if (existing) {
      throw new ConflictException(STORE_ERRORS.FACILITY_EXISTS);
    }

    const facility = await this.prisma.storeFacility.create({
      data: {
        storeId,
        name: dto.name,
        icon: dto.icon,
      },
    });

    await this.cache.invalidateStore(storeId);

    return {
      id: facility.id,
      name: facility.name,
      icon: facility.icon,
    };
  }

  async getFacilities(storeId: string): Promise<StoreFacilityResponse[]> {
    await this.ensureStoreExists(storeId);

    const facilities = await this.prisma.storeFacility.findMany({
      where: { storeId },
      orderBy: { name: 'asc' },
    });

    return facilities.map((f) => ({
      id: f.id,
      name: f.name,
      icon: f.icon,
    }));
  }

  async removeFacility(storeId: string, facilityId: string): Promise<void> {
    const facility = await this.prisma.storeFacility.findFirst({
      where: { id: facilityId, storeId },
    });

    if (!facility) {
      throw new NotFoundException(STORE_ERRORS.FACILITY_NOT_FOUND);
    }

    await this.prisma.storeFacility.delete({ where: { id: facilityId } });
    await this.cache.invalidateStore(storeId);
  }

  // ─── Announcements ────────────────────────────────────

  async createAnnouncement(
    storeId: string,
    dto: CreateStoreAnnouncementDto,
  ): Promise<StoreAnnouncementResponse> {
    await this.ensureStoreExists(storeId);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException(STORE_ERRORS.INVALID_DATE_RANGE);
    }

    const announcement = await this.prisma.storeAnnouncement.create({
      data: {
        storeId,
        title: dto.title,
        description: dto.description,
        startDate,
        endDate,
        priority: dto.priority ?? 'MEDIUM',
      },
    });

    await this.cache.invalidateStore(storeId);

    return this.mapAnnouncement(announcement);
  }

  async getAnnouncements(storeId: string): Promise<StoreAnnouncementResponse[]> {
    await this.ensureStoreExists(storeId);

    const announcements = await this.prisma.storeAnnouncement.findMany({
      where: { storeId },
      orderBy: [{ priority: 'desc' }, { startDate: 'asc' }],
    });

    return announcements.map((a) => this.mapAnnouncement(a));
  }

  async getActiveAnnouncements(storeId: string): Promise<StoreAnnouncementResponse[]> {
    await this.ensureStoreExists(storeId);

    const now = new Date();
    const announcements = await this.prisma.storeAnnouncement.findMany({
      where: {
        storeId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: [{ priority: 'desc' }, { startDate: 'asc' }],
    });

    return announcements.map((a) => this.mapAnnouncement(a));
  }

  async updateAnnouncement(
    storeId: string,
    announcementId: string,
    dto: UpdateStoreAnnouncementDto,
  ): Promise<StoreAnnouncementResponse> {
    const announcement = await this.prisma.storeAnnouncement.findFirst({
      where: { id: announcementId, storeId },
    });

    if (!announcement) {
      throw new NotFoundException(STORE_ERRORS.ANNOUNCEMENT_NOT_FOUND);
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : announcement.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : announcement.endDate;

    if (endDate <= startDate) {
      throw new BadRequestException(STORE_ERRORS.INVALID_DATE_RANGE);
    }

    const updated = await this.prisma.storeAnnouncement.update({
      where: { id: announcementId },
      data: {
        title: dto.title,
        description: dto.description,
        startDate: dto.startDate ? startDate : undefined,
        endDate: dto.endDate ? endDate : undefined,
        priority: dto.priority,
      },
    });

    await this.cache.invalidateStore(storeId);

    return this.mapAnnouncement(updated);
  }

  async deleteAnnouncement(
    storeId: string,
    announcementId: string,
  ): Promise<void> {
    const announcement = await this.prisma.storeAnnouncement.findFirst({
      where: { id: announcementId, storeId },
    });

    if (!announcement) {
      throw new NotFoundException(STORE_ERRORS.ANNOUNCEMENT_NOT_FOUND);
    }

    await this.prisma.storeAnnouncement.delete({
      where: { id: announcementId },
    });
    await this.cache.invalidateStore(storeId);
  }

  // ─── Helpers ───────────────────────────────────────────

  private mapAnnouncement(a: any): StoreAnnouncementResponse {
    const now = new Date();
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      startDate: a.startDate,
      endDate: a.endDate,
      priority: a.priority,
      isActive: now >= a.startDate && now <= a.endDate,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
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
