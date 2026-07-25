export type TransactionType = "CREDIT" | "DEBIT" | "REFUND" | "EXPIRE" | "ADJUSTMENT";

export type TransactionSource =
  | "ORDER_CASHBACK"
  | "REFERRAL_BONUS"
  | "SIGNUP_BONUS"
  | "REVIEW_REWARD"
  | "PROMO_CODE"
  | "ADMIN_ADJUSTMENT"
  | "ORDER_PAYMENT"
  | "EXPIRATION"
  | "REFUND"
  | "LOYALTY_TIER";

export type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED" | "REVERSED";

export interface WalletSummary {
  balance: number;
  pendingBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  lifetimeExpired: number;
  todayEarnings: number;
  monthEarnings: number;
  recentTransactions: WalletTransaction[];
}

export interface WalletTransaction {
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
  expiresAt: string | null;
  expiredAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface WalletBalance {
  balance: number;
  pendingBalance: number;
}

export interface TransactionQueryParams {
  page?: number;
  pageSize?: number;
  type?: TransactionType;
  source?: TransactionSource;
  status?: TransactionStatus;
  fromDate?: string;
  toDate?: string;
}

export interface PaginatedTransactions {
  items: WalletTransaction[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function formatCoins(amount: number): string {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return amount.toFixed(0);
}

export function transactionTypeLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    CREDIT: "Earned",
    DEBIT: "Spent",
    REFUND: "Refunded",
    EXPIRE: "Expired",
    ADJUSTMENT: "Adjusted",
  };
  return labels[type];
}

export function transactionSourceLabel(source: TransactionSource): string {
  const labels: Record<TransactionSource, string> = {
    ORDER_CASHBACK: "Order Cashback",
    REFERRAL_BONUS: "Referral Bonus",
    SIGNUP_BONUS: "Signup Bonus",
    REVIEW_REWARD: "Review Reward",
    PROMO_CODE: "Promo Code",
    ADMIN_ADJUSTMENT: "Admin Adjustment",
    ORDER_PAYMENT: "Order Payment",
    EXPIRATION: "Expiration",
    REFUND: "Refund",
    LOYALTY_TIER: "Loyalty Tier",
  };
  return labels[source];
}
