"use client";

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getRewards,
  getRewardCategories,
  getFeaturedRewards,
  getPopularRewards,
  getReward,
  getRelatedRewards,
  getRewardEligibility,
  redeemReward,
  getMyVouchers,
  getVoucher,
  trackRewardEvent,
} from "@/lib/api/rewardsApi";
import { WALLET_KEYS } from "./useWallet";
import type {
  RewardQueryParams,
  VoucherQueryParams,
  Redemption,
} from "@/types/rewards";

export const REWARDS_KEYS = {
  all: ["rewards"] as const,
  catalog: (params?: Omit<RewardQueryParams, "page">) =>
    [...REWARDS_KEYS.all, "catalog", params] as const,
  categories: () => [...REWARDS_KEYS.all, "categories"] as const,
  featured: () => [...REWARDS_KEYS.all, "featured"] as const,
  popular: () => [...REWARDS_KEYS.all, "popular"] as const,
  detail: (idOrSlug: string) => [...REWARDS_KEYS.all, "detail", idOrSlug] as const,
  related: (idOrSlug: string) => [...REWARDS_KEYS.all, "related", idOrSlug] as const,
  eligibility: (idOrSlug: string) =>
    [...REWARDS_KEYS.all, "eligibility", idOrSlug] as const,
  vouchers: (params?: Omit<VoucherQueryParams, "page">) =>
    [...REWARDS_KEYS.all, "vouchers", params] as const,
  voucher: (id: string) => [...REWARDS_KEYS.all, "voucher", id] as const,
};

/** Catalog changes rarely within a session; keep it warm to avoid refetch churn. */
const CATALOG_STALE = 2 * 60 * 1000;
const CATALOG_GC = 10 * 60 * 1000;

export function useRewardsCatalog(
  filters?: Omit<RewardQueryParams, "page">,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: REWARDS_KEYS.catalog(filters),
    queryFn: ({ pageParam = 1 }) =>
      getRewards({ ...filters, page: pageParam, pageSize: 12 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    enabled,
    staleTime: CATALOG_STALE,
    gcTime: CATALOG_GC,
  });
}

export function useRewardCategories(enabled = true) {
  return useQuery({
    queryKey: REWARDS_KEYS.categories(),
    queryFn: getRewardCategories,
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useFeaturedRewards(enabled = true) {
  return useQuery({
    queryKey: REWARDS_KEYS.featured(),
    queryFn: getFeaturedRewards,
    enabled,
    staleTime: CATALOG_STALE,
    gcTime: CATALOG_GC,
  });
}

export function usePopularRewards(enabled = true) {
  return useQuery({
    queryKey: REWARDS_KEYS.popular(),
    queryFn: getPopularRewards,
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: CATALOG_GC,
  });
}

export function useReward(idOrSlug: string, enabled = true) {
  return useQuery({
    queryKey: REWARDS_KEYS.detail(idOrSlug),
    queryFn: () => getReward(idOrSlug),
    enabled: enabled && Boolean(idOrSlug),
    staleTime: CATALOG_STALE,
    gcTime: CATALOG_GC,
  });
}

export function useRelatedRewards(idOrSlug: string, enabled = true) {
  return useQuery({
    queryKey: REWARDS_KEYS.related(idOrSlug),
    queryFn: () => getRelatedRewards(idOrSlug),
    enabled: enabled && Boolean(idOrSlug),
    staleTime: CATALOG_STALE,
    gcTime: CATALOG_GC,
  });
}

/**
 * Eligibility depends on live wallet balance, so it is kept short-lived and
 * refetched when the window regains focus.
 */
export function useRewardEligibility(idOrSlug: string, enabled = true) {
  return useQuery({
    queryKey: REWARDS_KEYS.eligibility(idOrSlug),
    queryFn: () => getRewardEligibility(idOrSlug),
    enabled: enabled && Boolean(idOrSlug),
    staleTime: 15 * 1000,
    gcTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useMyVouchers(
  filters?: Omit<VoucherQueryParams, "page">,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: REWARDS_KEYS.vouchers(filters),
    queryFn: ({ pageParam = 1 }) =>
      getMyVouchers({ ...filters, page: pageParam, pageSize: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useVoucher(id: string, enabled = true) {
  return useQuery({
    queryKey: REWARDS_KEYS.voucher(id),
    queryFn: () => getVoucher(id),
    enabled: enabled && Boolean(id),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Redemption mutation.
 *
 * No optimistic update: coins and stock are server-authoritative and a failed
 * redemption must never leave a phantom balance on screen. On success every
 * affected cache — wallet, catalog, vouchers — is invalidated so the quick
 * view and listings reflect the new balance immediately.
 */
export function useRedeemReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      idOrSlug,
      storeId,
    }: {
      idOrSlug: string;
      storeId?: string;
    }) => redeemReward(idOrSlug, storeId ? { storeId } : undefined),

    onSuccess: (redemption: Redemption, variables) => {
      // Wallet balance changed — refresh summary, balance and transactions.
      void queryClient.invalidateQueries({ queryKey: WALLET_KEYS.all });
      // Stock and availability changed.
      void queryClient.invalidateQueries({ queryKey: REWARDS_KEYS.all });
      // Seed the new voucher so the success screen renders instantly.
      queryClient.setQueryData(
        REWARDS_KEYS.voucher(redemption.voucher.id),
        redemption.voucher,
      );
      void queryClient.invalidateQueries({
        queryKey: REWARDS_KEYS.eligibility(variables.idOrSlug),
      });
    },
  });
}

export function useTrackRewardEvent() {
  return useMutation({
    mutationFn: ({
      idOrSlug,
      eventType,
      metadata,
    }: {
      idOrSlug: string;
      eventType: string;
      metadata?: Record<string, unknown>;
    }) => trackRewardEvent(idOrSlug, eventType, metadata),
  });
}
