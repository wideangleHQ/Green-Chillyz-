import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

const OVERRIDE_SELECT = {
  id: true,
  storeId: true,
  ruleId: true,
  overrideRewardType: true,
  overrideRewardRef: true,
  overrideCoinReq: true,
  overrideDisplayOrder: true,
  overridePriority: true,
  status: true,
  effectiveFrom: true,
  effectiveUntil: true,
  reason: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
  store: { select: { id: true, name: true, code: true } },
  rule: {
    select: {
      id: true,
      name: true,
      coinRequirement: true,
      rewardType: true,
      ruleType: true,
      displayOrder: true,
      priority: true,
      status: true,
      rewardReference: true,
      validFrom: true,
      expiryDate: true,
    },
  },
  _count: { select: { metadata: true } },
} satisfies Prisma.RewardOverrideSelect;

const HISTORY_SELECT = {
  id: true,
  overrideId: true,
  storeId: true,
  ruleId: true,
  status: true,
  action: true,
  reason: true,
  changedBy: true,
  snapshot: true,
  createdAt: true,
} satisfies Prisma.RewardOverrideHistorySelect;

@Injectable()
export class RewardOverridesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    where: Prisma.RewardOverrideWhereInput,
    skip = 0,
    take = 20,
  ) {
    const [items, total] = await Promise.all([
      this.prisma.rewardOverride.findMany({
        where: { deletedAt: null, ...where },
        select: OVERRIDE_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.rewardOverride.count({ where: { deletedAt: null, ...where } }),
    ]);
    return [items, total] as const;
  }

  async findById(id: string) {
    return this.prisma.rewardOverride.findFirst({
      where: { id, deletedAt: null },
      select: OVERRIDE_SELECT,
    });
  }

  async findActiveByStore(storeId: string) {
    return this.prisma.rewardOverride.findMany({
      where: { storeId, status: 'ACTIVE', deletedAt: null },
      select: OVERRIDE_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveByStoreAndRule(storeId: string, ruleId: string) {
    return this.prisma.rewardOverride.findFirst({
      where: { storeId, ruleId, status: 'ACTIVE', deletedAt: null },
      select: OVERRIDE_SELECT,
    });
  }

  async findDuplicateCoinMilestone(storeId: string, coinReq: number, excludeId?: string) {
    return this.prisma.rewardOverride.findFirst({
      where: {
        storeId,
        overrideCoinReq: coinReq,
        status: 'ACTIVE',
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
  }

  async create(data: Prisma.RewardOverrideCreateInput) {
    return this.prisma.rewardOverride.create({
      data,
      select: OVERRIDE_SELECT,
    });
  }

  async update(id: string, data: Prisma.RewardOverrideUpdateInput) {
    return this.prisma.rewardOverride.update({
      where: { id },
      data,
      select: OVERRIDE_SELECT,
    });
  }

  async softDelete(id: string, deletedBy?: string) {
    return this.prisma.rewardOverride.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'ARCHIVED',
        archivedAt: new Date(),
        updatedBy: deletedBy ?? null,
      },
    });
  }

  async restore(id: string, restoredBy?: string) {
    return this.prisma.rewardOverride.update({
      where: { id },
      data: {
        deletedAt: null,
        status: 'ACTIVE',
        archivedAt: null,
        updatedBy: restoredBy ?? null,
      },
      select: OVERRIDE_SELECT,
    });
  }

  async createHistory(data: Prisma.RewardOverrideHistoryCreateInput) {
    return this.prisma.rewardOverrideHistory.create({
      data,
      select: HISTORY_SELECT,
    });
  }

  async findHistory(storeId: string) {
    return this.prisma.rewardOverrideHistory.findMany({
      where: { storeId },
      select: HISTORY_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsertMetadata(overrideId: string, key: string, value: unknown) {
    return this.prisma.rewardOverrideMetadata.upsert({
      where: { uq_override_metadata_key: { overrideId, key } },
      update: { value: value as Prisma.InputJsonValue },
      create: {
        overrideId,
        key,
        value: value as Prisma.InputJsonValue,
      },
    });
  }

  async storeExists(storeId: string): Promise<boolean> {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, deletedAt: null },
      select: { id: true },
    });
    return !!store;
  }

  async ruleExists(ruleId: string) {
    return this.prisma.profileRewardRule.findFirst({
      where: { id: ruleId, deletedAt: null },
      select: {
        id: true,
        name: true,
        status: true,
        ruleType: true,
        coinRequirement: true,
        rewardType: true,
        rewardReference: true,
        displayOrder: true,
        priority: true,
        validFrom: true,
        expiryDate: true,
        profileId: true,
      },
    });
  }
}
