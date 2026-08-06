import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ChallengeStatus } from '../enums';
import { PrismaService } from '../../../database/prisma.service';

const CHALLENGE_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  shortDescription: true,
  image: true,
  icon: true,
  type: true,
  status: true,
  priority: true,
  isFeatured: true,
  maxParticipants: true,
  currentParticipants: true,
  startsAt: true,
  endsAt: true,
  storeIds: true,
  brandIds: true,
  campaignRef: true,
  autoEnroll: true,
  repeatableAfterDays: true,
  publishedAt: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.ChallengeSelect;

const CHALLENGE_WITH_DETAILS_SELECT = {
  ...CHALLENGE_SELECT,
  rules: {
    select: {
      id: true,
      challengeId: true,
      ruleType: true,
      targetCount: true,
      targetAmount: true,
      gameSlug: true,
      storeId: true,
      sortOrder: true,
      description: true,
      metadata: true,
    },
    orderBy: { sortOrder: 'asc' as const },
  },
  rewards: {
    select: {
      id: true,
      challengeId: true,
      rewardType: true,
      coinAmount: true,
      rewardReference: true,
      quantity: true,
      sortOrder: true,
      description: true,
      metadata: true,
    },
    orderBy: { sortOrder: 'asc' as const },
  },
} satisfies Prisma.ChallengeSelect;

export type ChallengeRecord = Prisma.ChallengeGetPayload<{
  select: typeof CHALLENGE_SELECT;
}>;

export type ChallengeWithDetailsRecord = Prisma.ChallengeGetPayload<{
  select: typeof CHALLENGE_WITH_DETAILS_SELECT;
}>;

@Injectable()
export class ChallengeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    where: Prisma.ChallengeWhereInput,
    skip: number,
    take: number,
  ): Promise<[ChallengeRecord[], number]> {
    const [items, total] = await Promise.all([
      this.prisma.challenge.findMany({
        where,
        select: CHALLENGE_SELECT,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.challenge.count({ where }),
    ]);
    return [items, total];
  }

  async findById(id: string): Promise<ChallengeWithDetailsRecord | null> {
    return this.prisma.challenge.findFirst({
      where: { id, deletedAt: null },
      select: CHALLENGE_WITH_DETAILS_SELECT,
    });
  }

  async findByIdIncludingDeleted(id: string): Promise<ChallengeRecord | null> {
    return this.prisma.challenge.findUnique({
      where: { id },
      select: CHALLENGE_SELECT,
    });
  }

  async findBySlug(slug: string, excludeId?: string): Promise<ChallengeRecord | null> {
    return this.prisma.challenge.findFirst({
      where: {
        slug,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: CHALLENGE_SELECT,
    });
  }

  async findDuplicateName(name: string, excludeId?: string): Promise<ChallengeRecord | null> {
    return this.prisma.challenge.findFirst({
      where: {
        name,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: CHALLENGE_SELECT,
    });
  }

  async findActive(now: Date): Promise<ChallengeWithDetailsRecord[]> {
    return this.prisma.challenge.findMany({
      where: {
        status: { in: [ChallengeStatus.ACTIVE, ChallengeStatus.PUBLISHED] },
        startsAt: { lte: now },
        endsAt: { gte: now },
        deletedAt: null,
      },
      select: CHALLENGE_WITH_DETAILS_SELECT,
      orderBy: [{ priority: 'desc' }, { startsAt: 'asc' }],
    });
  }

  async findUpcoming(now: Date): Promise<ChallengeWithDetailsRecord[]> {
    return this.prisma.challenge.findMany({
      where: {
        status: { in: [ChallengeStatus.PUBLISHED, ChallengeStatus.ACTIVE] },
        startsAt: { gt: now },
        deletedAt: null,
      },
      select: CHALLENGE_WITH_DETAILS_SELECT,
      orderBy: { startsAt: 'asc' },
      take: 20,
    });
  }

  async create(data: Prisma.ChallengeCreateInput): Promise<ChallengeWithDetailsRecord> {
    const created = await this.prisma.challenge.create({ data, select: { id: true } });
    return this.findById(created.id) as Promise<ChallengeWithDetailsRecord>;
  }

  async update(
    id: string,
    data: Prisma.ChallengeUpdateInput,
  ): Promise<ChallengeWithDetailsRecord> {
    await this.prisma.challenge.update({ where: { id }, data });
    return this.findById(id) as Promise<ChallengeWithDetailsRecord>;
  }

  async softDelete(id: string, actorId: string | null): Promise<void> {
    await this.prisma.challenge.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: ChallengeStatus.ARCHIVED,
        updatedBy: actorId,
      },
    });
  }

  async restore(id: string, actorId: string | null): Promise<ChallengeWithDetailsRecord> {
    await this.prisma.challenge.update({
      where: { id },
      data: {
        deletedAt: null,
        status: ChallengeStatus.DRAFT,
        updatedBy: actorId,
      },
    });
    return this.findById(id) as Promise<ChallengeWithDetailsRecord>;
  }

  async recordHistory(data: {
    challengeId: string;
    action: string;
    status: ChallengeStatus;
    reason?: string | null;
    changedBy?: string | null;
    snapshot?: unknown;
  }): Promise<void> {
    await this.prisma.challengeHistory.create({
      data: {
        challenge: { connect: { id: data.challengeId } },
        action: data.action,
        status: data.status,
        reason: data.reason ?? null,
        changedBy: data.changedBy ?? null,
        snapshot: data.snapshot as Prisma.InputJsonValue,
      },
    });
  }

  async findHistory(challengeId: string) {
    return this.prisma.challengeHistory.findMany({
      where: { challengeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async replaceMetadata(
    challengeId: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.challengeMetadata.deleteMany({ where: { challengeId } });
      const entries = Object.entries(metadata);
      if (entries.length > 0) {
        await tx.challengeMetadata.createMany({
          data: entries.map(([key, value]) => ({
            challengeId,
            key,
            value: value as Prisma.InputJsonValue,
          })),
        });
      }
    });
  }

  async findMetadata(challengeId: string) {
    return this.prisma.challengeMetadata.findMany({
      where: { challengeId },
    });
  }

  async incrementParticipants(id: string): Promise<void> {
    await this.prisma.challenge.update({
      where: { id },
      data: { currentParticipants: { increment: 1 } },
    });
  }
}
