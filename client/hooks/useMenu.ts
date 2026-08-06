"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getStoreMenu, getFeaturedDishes, getMenuCategories } from "@/lib/api/menuApi";
import type { MenuQueryParams } from "@/types/menu";

export const MENU_KEYS = {
  all: ["menu"] as const,
  storeMenu: (storeId: string, params?: MenuQueryParams) =>
    [...MENU_KEYS.all, "store", storeId, params] as const,
  featured: (storeId: string) =>
    [...MENU_KEYS.all, "featured", storeId] as const,
  categories: () => [...MENU_KEYS.all, "categories"] as const,
};

export function useStoreMenu(storeId: string, params?: MenuQueryParams, enabled = true) {
  return useQuery({
    queryKey: MENU_KEYS.storeMenu(storeId, params),
    queryFn: () => getStoreMenu(storeId, params),
    enabled: enabled && !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes stale time for menu items
    gcTime: 15 * 60 * 1000,   // 15 minutes garbage collection
    placeholderData: keepPreviousData,
  });
}

export function useFeaturedDishes(storeId: string, enabled = true) {
  return useQuery({
    queryKey: MENU_KEYS.featured(storeId),
    queryFn: () => getFeaturedDishes(storeId),
    enabled: enabled && !!storeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useMenuCategories() {
  return useQuery({
    queryKey: MENU_KEYS.categories(),
    queryFn: getMenuCategories,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
