import { api } from "./client";
import type {
  RewardCategory,
  RewardListItem,
  RewardDetail,
  EligibilityResult,
  Redemption,
  Voucher,
  RewardQueryParams,
  VoucherQueryParams,
  PaginatedRewards,
  PaginatedVouchers,
} from "@/types/rewards";

const BASE = "/rewards-catalog";

export async function getRewards(
  params?: RewardQueryParams,
): Promise<PaginatedRewards> {
  const { data } = await api.get<PaginatedRewards>(BASE, { params });
  return data;
}

export async function getRewardCategories(): Promise<RewardCategory[]> {
  const { data } = await api.get<RewardCategory[]>(`${BASE}/categories`);
  return data;
}

export async function getFeaturedRewards(): Promise<RewardListItem[]> {
  const { data } = await api.get<RewardListItem[]>(`${BASE}/featured`);
  return data;
}

export async function getPopularRewards(): Promise<RewardListItem[]> {
  const { data } = await api.get<RewardListItem[]>(`${BASE}/popular`);
  return data;
}

export async function getReward(idOrSlug: string): Promise<RewardDetail> {
  const { data } = await api.get<RewardDetail>(`${BASE}/${idOrSlug}`);
  return data;
}

export async function getRelatedRewards(
  idOrSlug: string,
): Promise<RewardListItem[]> {
  const { data } = await api.get<RewardListItem[]>(`${BASE}/${idOrSlug}/related`);
  return data;
}

export async function getRewardEligibility(
  idOrSlug: string,
): Promise<EligibilityResult> {
  const { data } = await api.get<EligibilityResult>(
    `${BASE}/${idOrSlug}/eligibility`,
  );
  return data;
}

export async function redeemReward(
  idOrSlug: string,
  body?: { storeId?: string; idempotencyKey?: string },
): Promise<Redemption> {
  const { data } = await api.post<Redemption>(`${BASE}/${idOrSlug}/redeem`, body ?? {});
  return data;
}

export async function getMyVouchers(
  params?: VoucherQueryParams,
): Promise<PaginatedVouchers> {
  const { data } = await api.get<PaginatedVouchers>(`${BASE}/vouchers/me`, {
    params,
  });
  return data;
}

export async function getVoucher(id: string): Promise<Voucher> {
  const { data } = await api.get<Voucher>(`${BASE}/vouchers/${id}`);
  return data;
}

export async function trackRewardEvent(
  idOrSlug: string,
  eventType: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await api.post(`${BASE}/${idOrSlug}/track`, { eventType, metadata });
}
