import { api } from "./client";
import type {
  Store,
  NearbyStore,
  StoreDetail,
  StoreQueryParams,
  NearbyQueryParams,
  PaginatedStores,
  NearbyStoreLocatorResponse,
} from "@/types/store";

export async function getStores(params?: StoreQueryParams): Promise<PaginatedStores> {
  const { data } = await api.get<PaginatedStores>("/stores", { params });
  return data;
}

export async function getActiveStores(): Promise<Store[]> {
  const { data } = await api.get<Store[]>("/stores/active");
  return data;
}

export async function getFeaturedStores(): Promise<Store[]> {
  const { data } = await api.get<Store[]>("/stores/featured");
  return data;
}

export async function searchStores(params: StoreQueryParams): Promise<PaginatedStores> {
  const { data } = await api.get<PaginatedStores>("/stores/search", { params });
  return data;
}

export async function getNearbyStores(params: NearbyQueryParams): Promise<NearbyStoreLocatorResponse> {
  const { data } = await api.get<NearbyStoreLocatorResponse>("/stores/nearby", { params });
  return data;
}

export async function getStoreBySlug(slug: string): Promise<StoreDetail> {
  const { data } = await api.get<StoreDetail>(`/stores/slug/${slug}`);
  return data;
}

export async function getStoreById(id: string): Promise<StoreDetail> {
  const { data } = await api.get<StoreDetail>(`/stores/${id}`);
  return data;
}

export async function checkStoreOpenNow(id: string): Promise<boolean> {
  const { data } = await api.get<{ isOpen: boolean }>(`/stores/${id}/open-now`);
  return data.isOpen;
}
