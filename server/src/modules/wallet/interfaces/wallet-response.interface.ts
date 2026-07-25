import { TransactionType, TransactionSource, TransactionStatus } from '@prisma/client';

export interface WalletResponse {
  id: string;
  userId: string;
  balance: number;
  pendingBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  lifetimeExpired: number;
  isActive: boolean;
  createdAt: Date;
}

export interface WalletSummary {
  balance: number;
  pendingBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  lifetimeExpired: number;
  todayEarnings: number;
  monthEarnings: number;
  recentTransactions: TransactionResponse[];
}

export interface TransactionResponse {
  id: string;
  walletId: string;
  type: TransactionType;
  source: TransactionSource;
  status: TransactionStatus;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceId: string | null;
  referenceType: string | null;
  expiresAt: Date | null;
  expiredAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface CreditDebitResult {
  transaction: TransactionResponse;
  newBalance: number;
}
