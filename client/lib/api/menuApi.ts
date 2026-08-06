import { api } from "./client";
import type { Dish, MenuCategory, MenuQueryParams } from "@/types/menu";

export async function getStoreMenu(
  storeId: string,
  params?: MenuQueryParams
): Promise<Dish[]> {
  const { data } = await api.get<Dish[]>(`/stores/${storeId}/menu`, { params });
  return data;
}

export async function getFeaturedDishes(storeId: string): Promise<Dish[]> {
  const { data } = await api.get<Dish[]>(`/stores/${storeId}/menu/featured`);
  return data;
}

export async function getMenuCategories(): Promise<MenuCategory[]> {
  const { data } = await api.get<MenuCategory[]>("/menu/categories");
  return data;
}

export async function getMenuItemBySlug(slug: string): Promise<Dish | null> {
  try {
    const { data } = await api.get<any>(`/menu/items/${slug}`);
    return data;
  } catch {
    return null;
  }
}

export async function searchMenu(q: string): Promise<{ items: Dish[]; total: number }> {
  if (!q || q.length < 2) return { items: [], total: 0 };
  const { data } = await api.get<{ items: Dish[]; total: number }>("/menu/items/search", {
    params: { q },
  });
  return data;
}
