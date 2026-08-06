import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

const RULE_SELECT = {
  id: true,
  profileId: true,
  name: true,
  description: true,
  ruleType: true,
  coinRequirement: true,
  rewardType: true,
  rewardReference: true,
  priority: true,
  displayOrder: true,
  status: true,
  validFrom: true,
  expiryDate: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { rewards: true, metadata: true } },
} satisfies Prisma.ProfileRewardRuleSelect;

const RULE_WITH_REWARDS_SELECT = {
  ...RULE_SELECT,
  rewards: {
    select: {
      id: true,
      rewardType: true,
      rewardReference: true,
      quantity: true,
      metadata: true,
    },
  },
} satisfies Prisma.ProfileRewardRuleSelect;

@Injectable()
export class RewardRulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    where: Prisma.ProfileRewardRuleWhereInput,
    orderBy: Prisma.ProfileRewardRuleOrderByWithRelationInput[] = [
      { displayOrder: 'asc' },
      { coinRequirement: 'asc' },
    ],
    skip = 0,
    take = 20,
  ) {
    const [items, total] = await Promise.all([
      this.prisma.profileRewardRule.findMany({
        where: { deletedAt: null, ...where },
        select: RULE_WITH_REWARDS_SELECT,
        orderBy,
        skip,
        take,
      }),
      this.prisma.profileRewardRule.count({ where: { deletedAt: null, ...where } }),
    ]);
    return [items, total] as const;
  }

  async findById(id: string) {
    return this.prisma.profileRewardRule.findFirst({
      where: { id: this.asUuid(id), deletedAt: null },
      select: RULE_WITH_REWARDS_SELECT,
    });
  }

  async findByProfile(profileId: string) {
    return this.prisma.profileRewardRule.findMany({
      where: { profileId, deletedAt: null },
      select: RULE_WITH_REWARDS_SELECT,
      orderBy: [{ displayOrder: 'asc' }, { coinRequirement: 'asc' }],
    });
  }

  async findActiveMilestones(profileId?: string) {
    const where: Prisma.ProfileRewardRuleWhereInput = {
      status: 'ACTIVE',
      ruleType: 'COIN_MILESTONE',
      deletedAt: null,
    };
    if (profileId) where.profileId = profileId;
    return this.prisma.profileRewardRule.findMany({
      where,
      select: RULE_WITH_REWARDS_SELECT,
      orderBy: [{ coinRequirement: 'asc' }],
    });
  }

  async findDuplicateCoinMilestone(profileId: string, coinRequirement: number, excludeId?: string) {
    const where: Prisma.ProfileRewardRuleWhereInput = {
      profileId,
      coinRequirement,
      status: 'ACTIVE',
      deletedAt: null,
    };
    if (excludeId) where.id = { not: excludeId };
    return this.prisma.profileRewardRule.findFirst({ where, select: { id: true } });
  }

  async findDuplicateDisplayOrder(profileId: string, displayOrder: number, excludeId?: string) {
    const where: Prisma.ProfileRewardRuleWhereInput = {
      profileId,
      displayOrder,
      deletedAt: null,
    };
    if (excludeId) where.id = { not: excludeId };
    return this.prisma.profileRewardRule.findFirst({ where, select: { id: true } });
  }

  async create(data: Prisma.ProfileRewardRuleCreateInput) {
    return this.prisma.profileRewardRule.create({
      data,
      select: RULE_WITH_REWARDS_SELECT,
    });
  }

  async update(id: string, data: Prisma.ProfileRewardRuleUpdateInput) {
    return this.prisma.profileRewardRule.update({
      where: { id },
      data,
      select: RULE_WITH_REWARDS_SELECT,
    });
  }

  async softDelete(id: string, deletedBy?: string) {
    return this.prisma.profileRewardRule.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'ARCHIVED',
        updatedBy: deletedBy ?? null,
      },
    });
  }

  async restore(id: string, restoredBy?: string) {
    return this.prisma.profileRewardRule.update({
      where: { id },
      data: {
        deletedAt: null,
        status: 'DRAFT',
        updatedBy: restoredBy ?? null,
      },
      select: RULE_WITH_REWARDS_SELECT,
    });
  }

  async getMaxDisplayOrder(profileId: string): Promise<number> {
    const result = await this.prisma.profileRewardRule.aggregate({
      where: { profileId, deletedAt: null },
      _max: { displayOrder: true },
    });
    return result._max.displayOrder ?? 0;
  }

  async upsertMetadata(ruleId: string, key: string, value: unknown) {
    return this.prisma.profileRewardRuleMetadata.upsert({
      where: { uq_profile_rule_metadata_key: { ruleId, key } },
      update: { value: value as Prisma.InputJsonValue },
      create: {
        ruleId,
        key,
        value: value as Prisma.InputJsonValue,
      },
    });
  }

  async findMetadata(ruleId: string) {
    return this.prisma.profileRewardRuleMetadata.findMany({
      where: { ruleId },
      orderBy: { key: 'asc' },
    });
  }

  async createReward(data: Prisma.ProfileRewardRuleRewardCreateInput) {
    return this.prisma.profileRewardRuleReward.create({ data });
  }

  async findRewards(ruleId: string) {
    return this.prisma.profileRewardRuleReward.findMany({
      where: { ruleId },
      orderBy: { createdAt: 'asc' },
    });
  }

  private asUuid(value: string): string {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    return isUuid ? value : '00000000-0000-4000-8000-000000000000';
  }
}
