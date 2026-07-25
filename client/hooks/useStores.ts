"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getActiveStores,
  getFeaturedStores,
  getNearbyStores,
  searchStores,
  getStoreBySlug,
  getStoreById,
  checkStoreOpenNow,
} from "@/lib/api/storeApi";
import type { NearbyQueryParams, StoreQueryParams } from "@/types/store";

export const STORE_KEYS = {
  all: ["stores"] as const,
  active: () => [...STORE_KEYS.all, "active"] as const,
  featured: () => [...STORE_KEYS.all, "featured"] as const,
  nearby: (params: NearbyQueryParams) => [...STORE_KEYS.all, "nearby", params] as const,
  search: (params: StoreQueryParams) => [...STORE_KEYS.all, "search", params] as const,
  detail: (id: string) => [...STORE_KEYS.all, "detail", id] as const,
  slug: (slug: string) => [...STORE_KEYS.all, "slug", slug] as const,
  openNow: (id: string) => [...STORE_KEYS.all, "open-now", id] as const,
};

export function useActiveStores() {
  return useQuery({
    queryKey: STORE_KEYS.active(),
    queryFn: getActiveStores,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useFeaturedStores() {
  return useQuery({
    queryKey: STORE_KEYS.featured(),
    queryFn: getFeaturedStores,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useNearbyStores(params: NearbyQueryParams | null) {
  return useQuery({
    queryKey: STORE_KEYS.nearby(params!),
    queryFn: () => getNearbyStores(params!),
    enabled: params !== null,
    staleTime: 90 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useSearchStores(params: StoreQueryParams | null) {
  return useQuery({
    queryKey: STORE_KEYS.search(params!),
    queryFn: () => searchStores(params!),
    enabled: params !== null && !!params.search,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useStoreBySlug(slug: string | null) {
  return useQuery({
    queryKey: STORE_KEYS.slug(slug!),
    queryFn: () => getStoreBySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useStoreById(id: string | null) {
  return useQuery({
    queryKey: STORE_KEYS.detail(id!),
    queryFn: () => getStoreById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useStoreOpenNow(id: string | null) {
  return useQuery({
    queryKey: STORE_KEYS.openNow(id!),
    queryFn: () => checkStoreOpenNow(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
