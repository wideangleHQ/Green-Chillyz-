import { Injectable } from '@nestjs/common';
import { CoinRuleType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

const MULTIPLIER_SELECT = {
  id: true,
  name: true,
  description: true,
  type: true,
  multiplier: true,
  ruleId: true,
  ruleType: true,
  storeId: true,
  campaignReference: true,
  daysOfWeek: true,
  stackable: true,
  priority: true,
  enabled: true,
  status: true,
  effectiveFrom: true,
  effectiveUntil: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CoinMultiplierSelect;

export type CoinMultiplierRecord = Prisma.CoinMultiplierGetPayload<{
  select: typeof MULTIPLIER_SELECT;
}>;

@Injectable()
export class CoinMultiplierRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    where: Prisma.CoinMultiplierWhereInput,
    skip = 0,
    take = 20,
  ): Promise<readonly [CoinMultiplierRecord[], number]> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.coinMultiplier.findMany({
        where: { deletedAt: null, ...where },
        select: MULTIPLIER_SELECT,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.coinMultiplier.count({ where: { deletedAt: null, ...where } }),
    ]);
    return [items, total] as const;
  }

  async findById(id: string): Promise<CoinMultiplierRecord | null> {
    return this.prisma.coinMultiplier.findFirst({
      where: { id, deletedAt: null },
      select: MULTIPLIER_SELECT,
    });
  }

  /**
   * Every multiplier that could apply to one grant, in a single query:
   * rule-scoped, rule-type-scoped, store-scoped and unscoped alike. Date and
   * day-of-week filtering happens in the calculation service so the same row
   * set can be cached across requests within a TTL.
   */
  async findCandidates(
    ruleId: string,
    ruleType: CoinRuleType,
    storeId: string | null,
  ): Promise<CoinMultiplierRecord[]> {
    return this.prisma.coinMultiplier.findMany({
      where: {
        enabled: true,
        status: 'ACTIVE',
        deletedAt: null,
        AND: [
          { OR: [{ ruleId }, { ruleId: null }] },
          { OR: [{ ruleType }, { ruleType: null }] },
          { OR: storeId ? [{ storeId }, { storeId: null }] : [{ storeId: null }] },
        ],
      },
      select: MULTIPLIER_SELECT,
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async create(data: Prisma.CoinMultiplierCreateInput): Promise<CoinMultiplierRecord> {
    return this.prisma.coinMultiplier.create({ data, select: MULTIPLIER_SELECT });
  }

  async update(
    id: string,
    data: Prisma.CoinMultiplierUpdateInput,
  ): Promise<CoinMultiplierRecord> {
    return this.prisma.coinMultiplier.update({
      where: { id },
      data,
      select: MULTIPLIER_SELECT,
    });
  }

  async softDelete(id: string, deletedBy: string | null): Promise<void> {
    await this.prisma.coinMultiplier.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        enabled: false,
        status: 'ARCHIVED',
        updatedBy: deletedBy,
      },
    });
  }

  async restore(id: string, restoredBy: string | null): Promise<CoinMultiplierRecord> {
    return this.prisma.coinMultiplier.update({
      where: { id },
      data: { deletedAt: null, status: 'DRAFT', updatedBy: restoredBy },
      select: MULTIPLIER_SELECT,
    });
  }
}
