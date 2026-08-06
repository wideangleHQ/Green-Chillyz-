import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { paginate } from '../../../common/pagination';
import { PaginatedResponse } from '../../../common/interfaces';
import { WalletService } from '../../wallet/services';
import { TransactionQueryDto } from '../../wallet/dto';
import { DashboardCustomerScopeService } from '../common/services/dashboard-customer-scope.service';
import { DashboardWalletQueryDto } from './dto/dashboard-wallet.dto';

export interface DashboardWalletListItem {
  customerId: string;
  customerName: string;
  customerEmail: string;
  balance: number;
  pendingBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  lifetimeExpired: number;
  isActive: boolean;
  updatedAt: Date;
}

/**
 * Store-scoped wallet views. The list is the only read implemented here;
 * balances, summaries and ledgers come from `WalletService` untouched, so
 * every balance figure the dashboard shows is computed by exactly the same
 * code the customer app uses.
 */
@Injectable()
export class DashboardWalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: DashboardCustomerScopeService,
    private readonly walletService: WalletService,
  ) {}

  async list(
    storeId: string,
    query: DashboardWalletQueryDto,
  ): Promise<PaginatedResponse<DashboardWalletListItem>> {
    const where: Prisma.WalletWhereInput = {
      user: {
        ...this.scope.storeScopedUserFilter(storeId),
        ...(query.search
          ? {
              OR: [
                { fullName: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { phone: { contains: query.search } },
              ],
            }
          : {}),
      },
    };

    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.wallet.findMany({
        where,
        select: {
          userId: true,
          balance: true,
          pendingBalance: true,
          lifetimeEarned: true,
          lifetimeSpent: true,
          lifetimeExpired: true,
          isActive: true,
          updatedAt: true,
          user: { select: { fullName: true, email: true } },
        },
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.wallet.count({ where }),
    ]);

    return paginate(
      rows.map((w) => ({
        customerId: w.userId,
        customerName: w.user.fullName,
        customerEmail: w.user.email,
        balance: Number(w.balance),
        pendingBalance: Number(w.pendingBalance),
        lifetimeEarned: Number(w.lifetimeEarned),
        lifetimeSpent: Number(w.lifetimeSpent),
        lifetimeExpired: Number(w.lifetimeExpired),
        isActive: w.isActive,
        updatedAt: w.updatedAt,
      })),
      totalItems,
      query.page,
      query.pageSize,
    );
  }

  async getSummary(storeId: string, customerId: string) {
    await this.scope.assertCustomerInStore(customerId, storeId);
    return this.walletService.getSummary(customerId);
  }

  async getTransactions(
    storeId: string,
    customerId: string,
    query: TransactionQueryDto,
  ) {
    await this.scope.assertCustomerInStore(customerId, storeId);
    return this.walletService.getTransactions(customerId, query);
  }
}
