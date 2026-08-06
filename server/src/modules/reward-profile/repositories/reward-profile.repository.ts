import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

const PROFILE_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  status: true,
  type: true,
  isDefault: true,
  version: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { versions: true, metadata: true } },
} satisfies Prisma.RewardProfileSelect;

const VERSION_SELECT = {
  id: true,
  profileId: true,
  versionNumber: true,
  name: true,
  slug: true,
  description: true,
  status: true,
  type: true,
  isDefault: true,
  snapshot: true,
  changeReason: true,
  createdBy: true,
  createdAt: true,
} satisfies Prisma.RewardProfileVersionSelect;

@Injectable()
export class RewardProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    where: Prisma.RewardProfileWhereInput,
    orderBy: Prisma.RewardProfileOrderByWithRelationInput[] = [{ createdAt: 'desc' }],
    skip = 0,
    take = 20,
  ) {
    const [items, total] = await Promise.all([
      this.prisma.rewardProfile.findMany({
        where: { deletedAt: null, ...where },
        select: PROFILE_SELECT,
        orderBy,
        skip,
        take,
      }),
      this.prisma.rewardProfile.count({ where: { deletedAt: null, ...where } }),
    ]);
    return [items, total] as const;
  }

  async findByIdOrSlug(idOrSlug: string) {
    return this.prisma.rewardProfile.findFirst({
      where: {
        deletedAt: null,
        OR: [{ id: this.asUuid(idOrSlug) }, { slug: idOrSlug }],
      },
      select: PROFILE_SELECT,
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.rewardProfile.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true, slug: true },
    });
  }

  async findDefault() {
    return this.prisma.rewardProfile.findFirst({
      where: { isDefault: true, deletedAt: null },
      select: PROFILE_SELECT,
    });
  }

  async create(data: Prisma.RewardProfileCreateInput) {
    return this.prisma.rewardProfile.create({
      data,
      select: PROFILE_SELECT,
    });
  }

  async update(id: string, data: Prisma.RewardProfileUpdateInput) {
    return this.prisma.rewardProfile.update({
      where: { id },
      data,
      select: PROFILE_SELECT,
    });
  }

  async softDelete(id: string, deletedBy?: string) {
    return this.prisma.rewardProfile.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'ARCHIVED',
        updatedBy: deletedBy ?? null,
      },
    });
  }

  async restore(id: string, restoredBy?: string) {
    return this.prisma.rewardProfile.update({
      where: { id },
      data: {
        deletedAt: null,
        status: 'DRAFT',
        updatedBy: restoredBy ?? null,
      },
      select: PROFILE_SELECT,
    });
  }

  async clearDefault(excludeId?: string) {
    const where: Prisma.RewardProfileWhereInput = {
      isDefault: true,
      deletedAt: null,
    };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    await this.prisma.rewardProfile.updateMany({
      where,
      data: { isDefault: false },
    });
  }

  async createVersion(data: Prisma.RewardProfileVersionCreateInput) {
    return this.prisma.rewardProfileVersion.create({
      data,
      select: VERSION_SELECT,
    });
  }

  async findVersions(profileId: string) {
    return this.prisma.rewardProfileVersion.findMany({
      where: { profileId },
      select: VERSION_SELECT,
      orderBy: { versionNumber: 'desc' },
    });
  }

  async findLatestVersion(profileId: string) {
    return this.prisma.rewardProfileVersion.findFirst({
      where: { profileId },
      select: VERSION_SELECT,
      orderBy: { versionNumber: 'desc' },
    });
  }

  async upsertMetadata(profileId: string, key: string, value: unknown) {
    return this.prisma.rewardProfileMetadata.upsert({
      where: { uq_profile_metadata_key: { profileId, key } },
      update: { value: value as Prisma.InputJsonValue },
      create: {
        profileId,
        key,
        value: value as Prisma.InputJsonValue,
      },
    });
  }

  async findMetadata(profileId: string) {
    return this.prisma.rewardProfileMetadata.findMany({
      where: { profileId },
      orderBy: { key: 'asc' },
    });
  }

  async deleteMetadata(profileId: string, key: string) {
    return this.prisma.rewardProfileMetadata.deleteMany({
      where: { profileId, key },
    });
  }

  private asUuid(value: string): string {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    return isUuid ? value : '00000000-0000-4000-8000-000000000000';
  }
}
