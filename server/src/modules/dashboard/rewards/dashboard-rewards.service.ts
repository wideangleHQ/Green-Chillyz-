import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { paginate } from '../../../common/pagination';
import { RewardCatalogService } from '../../rewards/services/reward-catalog.service';
import { RewardAnalyticsService } from '../../rewards/services/reward-analytics.service';
import { RewardQueryDto } from '../../rewards/dto';
import { DashboardRedemptionQueryDto } from './dto/dashboard-reward.dto';

/**
 * The store's view of the reward catalog.
 *
 * Listing and detail delegate to `RewardCatalogService` with the store id
 * forced from the principal, so availability, stock and pricing rules are the
 * catalog's — the dashboard cannot see a reward its store cannot serve.
 */
@Injectable()
export class DashboardRewardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogService: RewardCatalogService,
    private readonly analyticsService: RewardAnalyticsService,
  ) {}

  async list(storeId: string, query: RewardQueryDto) {
    query.storeId = storeId;
    return this.catalogService.listCatalog(query);
  }

  /** Catalog detail enriched with redemption statistics. */
  async getDetail(idOrSlug: string) {
    const detail = await this.catalogService.getDetail(idOrSlug);
    const stats = await this.analyticsService.getRewardStats(detail.id);
    return { ...detail, stats };
  }

  /** Redemptions of one reward at this store, most recent first. */
  async getRedemptions(
    storeId: string,
    rewardId: string,
    query: DashboardRedemptionQueryDto,
  ) {
    const where: Prisma.RewardRedemptionWhereInput = {
      rewardId,
      storeId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.rewardRedemption.findMany({
        where,
        select: {
          id: true,
          status: true,
          coinsSpent: true,
          createdAt: true,
          user: { select: { id: true, fullName: true, email: true } },
          voucher: { select: { id: true, code: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.rewardRedemption.count({ where }),
    ]);

    return paginate(rows, totalItems, query.page, query.pageSize);
  }
}
