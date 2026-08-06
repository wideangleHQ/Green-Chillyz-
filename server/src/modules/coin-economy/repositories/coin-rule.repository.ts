import { Injectable } from '@nestjs/common';
import { CoinRuleType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

const RULE_SELECT = {
  id: true,
  name: true,
  description: true,
  ruleType: true,
  coinAmount: true,
  minCoins: true,
  maxCoins: true,
  dailyLimit: true,
  weeklyLimit: true,
  monthlyLimit: true,
  lifetimeLimit: true,
  cooldownSeconds: true,
  enabled: true,
  priority: true,
  status: true,
  effectiveFrom: true,
  effectiveUntil: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
} satisfies Prisma.CoinRuleSelect;

export type CoinRuleRecord = Prisma.CoinRuleGetPayload<{ select: typeof RULE_SELECT }>;

@Injectable()
export class CoinRuleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    where: Prisma.CoinRuleWhereInput,
    skip = 0,
    take = 20,
  ): Promise<readonly [CoinRuleRecord[], number]> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.coinRule.findMany({
        where,
        select: RULE_SELECT,
        orderBy: [{ priority: 'desc' }, { ruleType: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.coinRule.count({ where }),
    ]);
    return [items, total] as const;
  }

  async findById(id: string): Promise<CoinRuleRecord | null> {
    return this.prisma.coinRule.findFirst({
      where: { id, deletedAt: null },
      select: RULE_SELECT,
    });
  }

  /** Includes soft-deleted rows so restore can find its target. */
  async findByIdIncludingDeleted(id: string): Promise<CoinRuleRecord | null> {
    return this.prisma.coinRule.findUnique({ where: { id }, select: RULE_SELECT });
  }

  /**
   * The rule the engine resolves for a rule type: highest priority among the
   * enabled, active, non-deleted ones.
   */
  async findActiveByType(ruleType: CoinRuleType): Promise<CoinRuleRecord | null> {
    return this.prisma.coinRule.findFirst({
      where: { ruleType, status: 'ACTIVE', enabled: true, deletedAt: null },
      select: RULE_SELECT,
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async findAllActive(): Promise<CoinRuleRecord[]> {
    return this.prisma.coinRule.findMany({
      where: { status: 'ACTIVE', enabled: true, deletedAt: null },
      select: RULE_SELECT,
      orderBy: [{ priority: 'desc' }, { ruleType: 'asc' }],
    });
  }

  async findActiveByTypes(ruleTypes: CoinRuleType[]): Promise<CoinRuleRecord[]> {
    return this.prisma.coinRule.findMany({
      where: {
        ruleType: { in: ruleTypes },
        status: 'ACTIVE',
        enabled: true,
        deletedAt: null,
      },
      select: RULE_SELECT,
      orderBy: [{ priority: 'desc' }, { ruleType: 'asc' }],
    });
  }

  async findDuplicateActiveType(
    ruleType: CoinRuleType,
    excludeId?: string,
  ): Promise<{ id: string } | null> {
    const where: Prisma.CoinRuleWhereInput = {
      ruleType,
      status: 'ACTIVE',
      deletedAt: null,
    };
    if (excludeId) where.id = { not: excludeId };
    return this.prisma.coinRule.findFirst({ where, select: { id: true } });
  }

  async findDuplicateName(
    name: string,
    excludeId?: string,
  ): Promise<{ id: string } | null> {
    const where: Prisma.CoinRuleWhereInput = {
      name: { equals: name, mode: 'insensitive' },
      deletedAt: null,
    };
    if (excludeId) where.id = { not: excludeId };
    return this.prisma.coinRule.findFirst({ where, select: { id: true } });
  }

  async create(data: Prisma.CoinRuleCreateInput): Promise<CoinRuleRecord> {
    return this.prisma.coinRule.create({ data, select: RULE_SELECT });
  }

  async update(
    id: string,
    data: Prisma.CoinRuleUpdateInput,
  ): Promise<CoinRuleRecord> {
    return this.prisma.coinRule.update({ where: { id }, data, select: RULE_SELECT });
  }

  /**
   * Archive and history entry share one transaction: a rule must never move
   * status without the matching trail row.
   */
  async archiveWithHistory(
    id: string,
    snapshot: Prisma.InputJsonValue,
    archivedBy: string | null,
    reason: string | null,
  ): Promise<CoinRuleRecord> {
    const [rule] = await this.prisma.$transaction([
      this.prisma.coinRule.update({
        where: { id },
        data: {
          status: 'ARCHIVED',
          enabled: false,
          archivedAt: new Date(),
          deletedAt: new Date(),
          updatedBy: archivedBy,
        },
        select: RULE_SELECT,
      }),
      this.prisma.coinRuleHistory.create({
        data: {
          ruleId: id,
          action: 'ARCHIVED',
          status: 'ARCHIVED',
          reason,
          changedBy: archivedBy,
          snapshot,
        },
      }),
    ]);
    return rule;
  }

  async restoreWithHistory(
    id: string,
    snapshot: Prisma.InputJsonValue,
    restoredBy: string | null,
  ): Promise<CoinRuleRecord> {
    const [rule] = await this.prisma.$transaction([
      this.prisma.coinRule.update({
        where: { id },
        data: {
          status: 'DRAFT',
          enabled: false,
          archivedAt: null,
          deletedAt: null,
          updatedBy: restoredBy,
        },
        select: RULE_SELECT,
      }),
      this.prisma.coinRuleHistory.create({
        data: {
          ruleId: id,
          action: 'RESTORED',
          status: 'DRAFT',
          changedBy: restoredBy,
          snapshot,
        },
      }),
    ]);
    return rule;
  }

  async recordHistory(data: Prisma.CoinRuleHistoryUncheckedCreateInput) {
    return this.prisma.coinRuleHistory.create({ data });
  }

  async findHistory(ruleId: string, take = 50) {
    return this.prisma.coinRuleHistory.findMany({
      where: { ruleId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async upsertMetadata(ruleId: string, key: string, value: Prisma.InputJsonValue) {
    return this.prisma.coinRuleMetadata.upsert({
      where: { uq_coin_rule_metadata_key: { ruleId, key } },
      update: { value },
      create: { ruleId, key, value },
    });
  }

  /** One round trip per rule regardless of how many keys are written. */
  async replaceMetadata(
    ruleId: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const entries = Object.entries(metadata);
    if (entries.length === 0) return;

    await this.prisma.$transaction(
      entries.map(([key, value]) =>
        this.prisma.coinRuleMetadata.upsert({
          where: { uq_coin_rule_metadata_key: { ruleId, key } },
          update: { value: value as Prisma.InputJsonValue },
          create: { ruleId, key, value: value as Prisma.InputJsonValue },
        }),
      ),
    );
  }

  async findMetadata(ruleId: string) {
    return this.prisma.coinRuleMetadata.findMany({
      where: { ruleId },
      orderBy: { key: 'asc' },
    });
  }

  async countByType(): Promise<Array<{ ruleType: CoinRuleType; count: number }>> {
    const grouped = await this.prisma.coinRule.groupBy({
      by: ['ruleType'],
      where: { deletedAt: null },
      _count: { _all: true },
    });
    return grouped.map((g) => ({ ruleType: g.ruleType, count: g._count._all }));
  }
}
