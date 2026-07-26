import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, TransactionType, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { WalletCacheService } from './wallet-cache.service';
import { CreditWalletDto, DebitWalletDto, TransactionQueryDto } from '../dto';
import {
  WalletResponse,
  WalletSummary,
  TransactionResponse,
  CreditDebitResult,
} from '../interfaces';
import { WALLET_ERRORS } from '../constants';
import { PaginatedResponse } from '../../../common/interfaces';
import { paginate } from '../../../common/pagination/paginator';
import { NOTIFICATION_EVENTS } from '../../notification/constants';
import {
  WalletCreditedEvent,
  WalletDebitedEvent,
  CoinsExpiredEvent,
} from '../../notification/events';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: WalletCacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getOrCreateWallet(userId: string): Promise<WalletResponse> {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId },
      });
      this.logger.log(`Wallet created for user ${userId}`);
    }

    return this.toWalletResponse(wallet);
  }

  async getBalance(userId: string): Promise<{ balance: number; pendingBalance: number }> {
    const cached = await this.cache.getBalance<{ balance: number; pendingBalance: number }>(userId);
    if (cached) return cached;

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return { balance: 0, pendingBalance: 0 };
    }

    const result = {
      balance: Number(wallet.balance),
      pendingBalance: Number(wallet.pendingBalance),
    };

    await this.cache.setBalance(userId, result);
    return result;
  }

  async getSummary(userId: string): Promise<WalletSummary> {
    const cached = await this.cache.getSummary<WalletSummary>(userId);
    if (cached) {
      this.logger.debug(`Cache hit: wallet summary for ${userId}`);
      return cached;
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      const empty: WalletSummary = {
        balance: 0,
        pendingBalance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        lifetimeExpired: 0,
        todayEarnings: 0,
        monthEarnings: 0,
        recentTransactions: [],
      };
      return empty;
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayAgg, monthAgg, recentTxns] = await Promise.all([
      this.prisma.walletTransaction.aggregate({
        where: {
          walletId: wallet.id,
          type: TransactionType.CREDIT,
          status: TransactionStatus.COMPLETED,
          createdAt: { gte: startOfDay },
        },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          walletId: wallet.id,
          type: TransactionType.CREDIT,
          status: TransactionStatus.COMPLETED,
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const summary: WalletSummary = {
      balance: Number(wallet.balance),
      pendingBalance: Number(wallet.pendingBalance),
      lifetimeEarned: Number(wallet.lifetimeEarned),
      lifetimeSpent: Number(wallet.lifetimeSpent),
      lifetimeExpired: Number(wallet.lifetimeExpired),
      todayEarnings: Number(todayAgg._sum.amount ?? 0),
      monthEarnings: Number(monthAgg._sum.amount ?? 0),
      recentTransactions: recentTxns.map((t) => this.toTransactionResponse(t)),
    };

    await this.cache.setSummary(userId, summary);
    return summary;
  }

  async credit(dto: CreditWalletDto, initiatorId?: string, ip?: string, device?: string): Promise<CreditDebitResult> {
    if (dto.idempotencyKey) {
      const existing = await this.prisma.walletTransaction.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) {
        throw new ConflictException(WALLET_ERRORS.DUPLICATE_TRANSACTION);
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: dto.userId },
      });

      // Wallets are provisioned at registration by CustomerBootstrapService,
      // so a missing wallet is an error rather than a lazy-create trigger.
      if (!wallet) {
        throw new NotFoundException(WALLET_ERRORS.NOT_FOUND);
      }
      if (!wallet.isActive) {
        throw new BadRequestException(WALLET_ERRORS.INACTIVE);
      }

      // Row lock via FOR UPDATE
      const locked = await tx.$queryRaw<{ balance: string }[]>`
        SELECT balance FROM wallets WHERE id = ${wallet.id}::uuid FOR UPDATE
      `;
      const walletId = wallet.id;
      const balanceBefore = Number(locked[0].balance);

      const newBalance = balanceBefore + dto.amount;

      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: newBalance,
          lifetimeEarned: { increment: dto.amount },
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId,
          type: TransactionType.CREDIT,
          source: dto.source,
          status: TransactionStatus.COMPLETED,
          amount: dto.amount,
          balanceBefore,
          balanceAfter: newBalance,
          description: dto.description,
          idempotencyKey: dto.idempotencyKey,
          referenceId: dto.referenceId,
          referenceType: dto.referenceType,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          ipAddress: ip,
          deviceInfo: device,
          createdBy: initiatorId,
          metadata: dto.metadata ? (dto.metadata as any) : Prisma.JsonNull,
        },
      });

      return { transaction, newBalance };
    });

    await this.cache.invalidate(dto.userId);
    this.logger.log(`Credit ${dto.amount} to user ${dto.userId} | source=${dto.source}`);

    // Fire-and-forget domain event. The wallet knows nothing about
    // notifications; subscribers decide what (if anything) to send.
    this.eventEmitter.emit(
      NOTIFICATION_EVENTS.WALLET_CREDITED,
      new WalletCreditedEvent(
        dto.userId,
        dto.amount,
        result.newBalance,
        dto.source,
        dto.description,
        result.transaction.id,
      ),
    );

    return {
      transaction: this.toTransactionResponse(result.transaction),
      newBalance: result.newBalance,
    };
  }

  async debit(dto: DebitWalletDto, initiatorId?: string, ip?: string, device?: string): Promise<CreditDebitResult> {
    if (dto.idempotencyKey) {
      const existing = await this.prisma.walletTransaction.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) {
        throw new ConflictException(WALLET_ERRORS.DUPLICATE_TRANSACTION);
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: dto.userId },
      });

      if (!wallet) {
        throw new NotFoundException(WALLET_ERRORS.NOT_FOUND);
      }
      if (!wallet.isActive) {
        throw new BadRequestException(WALLET_ERRORS.INACTIVE);
      }

      const locked = await tx.$queryRaw<{ balance: string }[]>`
        SELECT balance FROM wallets WHERE id = ${wallet.id}::uuid FOR UPDATE
      `;
      const balanceBefore = Number(locked[0].balance);

      if (balanceBefore < dto.amount) {
        throw new BadRequestException(WALLET_ERRORS.INSUFFICIENT_BALANCE);
      }

      const newBalance = balanceBefore - dto.amount;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: newBalance,
          lifetimeSpent: { increment: dto.amount },
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.DEBIT,
          source: dto.source,
          status: TransactionStatus.COMPLETED,
          amount: dto.amount,
          balanceBefore,
          balanceAfter: newBalance,
          description: dto.description,
          idempotencyKey: dto.idempotencyKey,
          referenceId: dto.referenceId,
          referenceType: dto.referenceType,
          ipAddress: ip,
          deviceInfo: device,
          createdBy: initiatorId,
          metadata: dto.metadata ? (dto.metadata as any) : Prisma.JsonNull,
        },
      });

      return { transaction, newBalance };
    });

    await this.cache.invalidate(dto.userId);
    this.logger.log(`Debit ${dto.amount} from user ${dto.userId} | source=${dto.source}`);

    this.eventEmitter.emit(
      NOTIFICATION_EVENTS.WALLET_DEBITED,
      new WalletDebitedEvent(
        dto.userId,
        dto.amount,
        result.newBalance,
        dto.source,
        dto.description,
        result.transaction.id,
      ),
    );

    return {
      transaction: this.toTransactionResponse(result.transaction),
      newBalance: result.newBalance,
    };
  }

  async getTransactions(
    userId: string,
    query: TransactionQueryDto,
  ): Promise<PaginatedResponse<TransactionResponse>> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!wallet) {
      return paginate<TransactionResponse>([], 0, query.page, query.pageSize);
    }

    const where: Prisma.WalletTransactionWhereInput = {
      walletId: wallet.id,
    };

    if (query.type) where.type = query.type;
    if (query.source) where.source = query.source;
    if (query.status) where.status = query.status;
    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) where.createdAt.gte = new Date(query.fromDate);
      if (query.toDate) where.createdAt.lte = new Date(query.toDate);
    }

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return paginate(
      transactions.map((t) => this.toTransactionResponse(t)),
      total,
      query.page,
      query.pageSize,
    );
  }

  async expireCoins(): Promise<number> {
    const now = new Date();

    const expiredTxns = await this.prisma.walletTransaction.findMany({
      where: {
        type: TransactionType.CREDIT,
        status: TransactionStatus.COMPLETED,
        expiresAt: { lte: now },
        expiredAt: null,
      },
      include: { wallet: { select: { id: true, userId: true } } },
    });

    if (expiredTxns.length === 0) return 0;

    let expiredCount = 0;
    const affectedUserIds = new Set<string>();
    // Coins can expire in several batches per user; aggregate so the
    // user receives one notification rather than one per batch.
    const expiredByUser = new Map<string, { amount: number; newBalance: number }>();

    for (const txn of expiredTxns) {
      await this.prisma.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<{ balance: string }[]>`
          SELECT balance FROM wallets WHERE id = ${txn.walletId}::uuid FOR UPDATE
        `;
        const currentBalance = Number(locked[0].balance);
        const expireAmount = Math.min(Number(txn.amount), currentBalance);

        if (expireAmount <= 0) {
          await tx.walletTransaction.update({
            where: { id: txn.id },
            data: { expiredAt: now },
          });
          return;
        }

        const newBalance = currentBalance - expireAmount;

        await tx.wallet.update({
          where: { id: txn.walletId },
          data: {
            balance: newBalance,
            lifetimeExpired: { increment: expireAmount },
          },
        });

        await tx.walletTransaction.update({
          where: { id: txn.id },
          data: { expiredAt: now },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: txn.walletId,
            type: TransactionType.EXPIRE,
            source: txn.source,
            status: TransactionStatus.COMPLETED,
            amount: expireAmount,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            description: `Expired coins from: ${txn.description}`,
          },
        });

        const prior = expiredByUser.get(txn.wallet.userId);
        expiredByUser.set(txn.wallet.userId, {
          amount: (prior?.amount ?? 0) + expireAmount,
          newBalance,
        });
      });

      affectedUserIds.add(txn.wallet.userId);
      expiredCount++;
    }

    for (const uid of affectedUserIds) {
      await this.cache.invalidate(uid);
    }

    for (const [userId, summary] of expiredByUser) {
      this.eventEmitter.emit(
        NOTIFICATION_EVENTS.COINS_EXPIRED,
        new CoinsExpiredEvent(userId, summary.amount, summary.newBalance),
      );
    }

    this.logger.log(`Expired ${expiredCount} coin batches for ${affectedUserIds.size} users`);
    return expiredCount;
  }

  private toWalletResponse(wallet: any): WalletResponse {
    return {
      id: wallet.id,
      userId: wallet.userId,
      balance: Number(wallet.balance),
      pendingBalance: Number(wallet.pendingBalance),
      lifetimeEarned: Number(wallet.lifetimeEarned),
      lifetimeSpent: Number(wallet.lifetimeSpent),
      lifetimeExpired: Number(wallet.lifetimeExpired),
      isActive: wallet.isActive,
      createdAt: wallet.createdAt,
    };
  }

  private toTransactionResponse(txn: any): TransactionResponse {
    return {
      id: txn.id,
      walletId: txn.walletId,
      type: txn.type,
      source: txn.source,
      status: txn.status,
      amount: Number(txn.amount),
      balanceBefore: Number(txn.balanceBefore),
      balanceAfter: Number(txn.balanceAfter),
      description: txn.description,
      referenceId: txn.referenceId,
      referenceType: txn.referenceType,
      expiresAt: txn.expiresAt,
      expiredAt: txn.expiredAt,
      metadata: txn.metadata,
      createdAt: txn.createdAt,
    };
  }
}
