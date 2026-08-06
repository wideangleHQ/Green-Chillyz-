import { Injectable } from '@nestjs/common';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { COIN_RULE_REFERENCE_TYPE } from '../constants';
import { CoinUsage } from '../interfaces';

/** A named window the limit engine wants counted. `since: null` means forever. */
export interface UsageWindow {
  key: string;
  since: Date | null;
  storeId?: string | null;
  deviceId?: string | null;
}

interface GrantRow {
  amount: Prisma.Decimal;
  createdAt: Date;
  metadata: Prisma.JsonValue;
}

/**
 * Usage is read straight off the wallet ledger — the coin economy keeps no
 * second ledger of its own, so the two can never disagree. Wallet rows are
 * only ever read here; crediting stays entirely inside WalletService.
 */
@Injectable()
export class CoinUsageRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Counts every requested window with at most two queries: one aggregate for
   * unbounded windows and one scan of the rows inside the widest bounded
   * window, bucketed in memory.
   */
  async getUsage(
    userId: string,
    ruleId: string,
    windows: UsageWindow[],
  ): Promise<Map<string, CoinUsage>> {
    const result = new Map<string, CoinUsage>();
    if (windows.length === 0) return result;

    const bounded = windows.filter((w) => w.since !== null);
    const unbounded = windows.filter((w) => w.since === null);

    const earliest = bounded.reduce<Date | null>(
      (min, w) => (min === null || w.since! < min ? w.since! : min),
      null,
    );

    const [rows, unboundedTotals] = await Promise.all([
      earliest ? this.findGrants(userId, ruleId, earliest) : Promise.resolve([]),
      this.aggregateUnbounded(userId, ruleId, unbounded),
    ]);

    for (const window of bounded) {
      result.set(window.key, this.bucket(rows, window));
    }
    for (const [key, usage] of unboundedTotals) {
      result.set(key, usage);
    }

    return result;
  }

  /** Timestamp of the most recent grant, used when a cooldown key has expired. */
  async findLastGrantAt(userId: string, ruleId: string): Promise<Date | null> {
    const last = await this.prisma.walletTransaction.findFirst({
      where: this.grantWhere(userId, ruleId),
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    return last?.createdAt ?? null;
  }

  private async findGrants(
    userId: string,
    ruleId: string,
    since: Date,
  ): Promise<GrantRow[]> {
    return this.prisma.walletTransaction.findMany({
      where: { ...this.grantWhere(userId, ruleId), createdAt: { gte: since } },
      select: { amount: true, createdAt: true, metadata: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async aggregateUnbounded(
    userId: string,
    ruleId: string,
    windows: UsageWindow[],
  ): Promise<Map<string, CoinUsage>> {
    const result = new Map<string, CoinUsage>();
    if (windows.length === 0) return result;

    const aggregates = await Promise.all(
      windows.map((window) =>
        this.prisma.walletTransaction.aggregate({
          where: {
            ...this.grantWhere(userId, ruleId),
            ...this.metadataWhere(window),
          },
          _sum: { amount: true },
          _count: { _all: true },
        }),
      ),
    );

    windows.forEach((window, index) => {
      const agg = aggregates[index];
      result.set(window.key, {
        coins: Number(agg._sum.amount ?? 0),
        claims: agg._count._all,
      });
    });

    return result;
  }

  private bucket(rows: GrantRow[], window: UsageWindow): CoinUsage {
    let coins = 0;
    let claims = 0;

    for (const row of rows) {
      if (window.since && row.createdAt < window.since) continue;
      if (!this.matchesScope(row, window)) continue;
      coins += Number(row.amount);
      claims += 1;
    }

    return { coins, claims };
  }

  private matchesScope(row: GrantRow, window: UsageWindow): boolean {
    if (!window.storeId && !window.deviceId) return true;

    const metadata =
      row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {};

    if (window.storeId && metadata.storeId !== window.storeId) return false;
    if (window.deviceId && metadata.deviceId !== window.deviceId) return false;
    return true;
  }

  private metadataWhere(window: UsageWindow): Prisma.WalletTransactionWhereInput {
    const filters: Prisma.WalletTransactionWhereInput[] = [];
    if (window.storeId) {
      filters.push({ metadata: { path: ['storeId'], equals: window.storeId } });
    }
    if (window.deviceId) {
      filters.push({ metadata: { path: ['deviceId'], equals: window.deviceId } });
    }
    return filters.length > 0 ? { AND: filters } : {};
  }

  private grantWhere(
    userId: string,
    ruleId: string,
  ): Prisma.WalletTransactionWhereInput {
    return {
      wallet: { userId },
      type: TransactionType.CREDIT,
      status: TransactionStatus.COMPLETED,
      referenceType: COIN_RULE_REFERENCE_TYPE,
      referenceId: ruleId,
      expiredAt: null,
    };
  }
}
