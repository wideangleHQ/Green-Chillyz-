"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  getWalletSummary,
  getWalletBalance,
  getTransactions,
} from "@/lib/api/walletApi";
import type { TransactionQueryParams } from "@/types/wallet";

export const WALLET_KEYS = {
  all: ["wallet"] as const,
  summary: () => [...WALLET_KEYS.all, "summary"] as const,
  balance: () => [...WALLET_KEYS.all, "balance"] as const,
  transactions: (params?: Omit<TransactionQueryParams, "page">) =>
    [...WALLET_KEYS.all, "transactions", params] as const,
};

export function useWalletSummary(enabled = true) {
  return useQuery({
    queryKey: WALLET_KEYS.summary(),
    queryFn: getWalletSummary,
    enabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useWalletBalance(enabled = true) {
  return useQuery({
    queryKey: WALLET_KEYS.balance(),
    queryFn: getWalletBalance,
    enabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useTransactions(
  filters?: Omit<TransactionQueryParams, "page">,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: WALLET_KEYS.transactions(filters),
    queryFn: ({ pageParam = 1 }) =>
      getTransactions({ ...filters, page: pageParam, pageSize: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    enabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
