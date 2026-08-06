import { Injectable } from '@nestjs/common';
import { CoinLimitScope, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

const LIMIT_SELECT = {
  id: true,
  ruleId: true,
  name: true,
  description: true,
  scope: true,
  maxCoins: true,
  maxClaims: true,
  windowSeconds: true,
  storeId: true,
  enabled: true,
  priority: true,
  effectiveFrom: true,
  effectiveUntil: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CoinLimitSelect;

export type CoinLimitRecord = Prisma.CoinLimitGetPayload<{ select: typeof LIMIT_SELECT }>;

@Injectable()
export class CoinLimitRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    where: Prisma.CoinLimitWhereInput,
    skip = 0,
    take = 20,
  ): Promise<readonly [CoinLimitRecord[], number]> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.coinLimit.findMany({
        where: { deletedAt: null, ...where },
        select: LIMIT_SELECT,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.coinLimit.count({ where: { deletedAt: null, ...where } }),
    ]);
    return [items, total] as const;
  }

  async findById(id: string): Promise<CoinLimitRecord | null> {
    return this.prisma.coinLimit.findFirst({
      where: { id, deletedAt: null },
      select: LIMIT_SELECT,
    });
  }

  /**
   * Limits that could bind a grant: the rule's own plus the global ones.
   * Fetched in one query so evaluation never fans out per scope.
   */
  async findApplicable(ruleId: string): Promise<CoinLimitRecord[]> {
    return this.prisma.coinLimit.findMany({
      where: {
        enabled: true,
        deletedAt: null,
        OR: [{ ruleId }, { ruleId: null }],
      },
      select: LIMIT_SELECT,
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findByRule(ruleId: string | null): Promise<CoinLimitRecord[]> {
    return this.prisma.coinLimit.findMany({
      where: { ruleId, deletedAt: null },
      select: LIMIT_SELECT,
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findDuplicateScope(
    ruleId: string | null,
    scope: CoinLimitScope,
    storeId: string | null,
    excludeId?: string,
  ): Promise<{ id: string } | null> {
    const where: Prisma.CoinLimitWhereInput = {
      ruleId,
      scope,
      storeId,
      deletedAt: null,
    };
    if (excludeId) where.id = { not: excludeId };
    return this.prisma.coinLimit.findFirst({ where, select: { id: true } });
  }

  async create(data: Prisma.CoinLimitCreateInput): Promise<CoinLimitRecord> {
    return this.prisma.coinLimit.create({ data, select: LIMIT_SELECT });
  }

  async update(
    id: string,
    data: Prisma.CoinLimitUpdateInput,
  ): Promise<CoinLimitRecord> {
    return this.prisma.coinLimit.update({ where: { id }, data, select: LIMIT_SELECT });
  }

  async softDelete(id: string, deletedBy: string | null): Promise<void> {
    await this.prisma.coinLimit.update({
      where: { id },
      data: { deletedAt: new Date(), enabled: false, updatedBy: deletedBy },
    });
  }

  async restore(id: string, restoredBy: string | null): Promise<CoinLimitRecord> {
    return this.prisma.coinLimit.update({
      where: { id },
      data: { deletedAt: null, updatedBy: restoredBy },
      select: LIMIT_SELECT,
    });
  }
}
