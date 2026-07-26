import { api } from "./client";
import type { Dish, MenuQueryParams } from "@/types/menu";

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
