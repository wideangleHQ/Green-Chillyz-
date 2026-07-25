import { api } from "./client";
import type {
  WalletSummary,
  WalletBalance,
  TransactionQueryParams,
  PaginatedTransactions,
} from "@/types/wallet";

export async function getWalletSummary(): Promise<WalletSummary> {
  const { data } = await api.get<WalletSummary>("/wallet/me");
  return data;
}

export async function getWalletBalance(): Promise<WalletBalance> {
  const { data } = await api.get<WalletBalance>("/wallet/me/balance");
  return data;
}

export async function getTransactions(
  params?: TransactionQueryParams,
): Promise<PaginatedTransactions> {
  const { data } = await api.get<PaginatedTransactions>("/wallet/me/transactions", {
    params,
  });
  return data;
}
