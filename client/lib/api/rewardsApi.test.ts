import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { api } from "./client";
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
} from "./rewardsApi";

const mockGet = api.get as unknown as ReturnType<typeof vi.fn>;
const mockPost = api.post as unknown as ReturnType<typeof vi.fn>;

describe("rewardsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: {} });
    mockPost.mockResolvedValue({ data: {} });
  });

  it("should request the catalog with query params", async () => {
    mockGet.mockResolvedValue({ data: { items: [], meta: {} } });

    await getRewards({ page: 2, category: "food" });

    expect(mockGet).toHaveBeenCalledWith("/rewards-catalog", {
      params: { page: 2, category: "food" },
    });
  });

  it("should request categories", async () => {
    mockGet.mockResolvedValue({ data: [] });

    await getRewardCategories();

    expect(mockGet).toHaveBeenCalledWith("/rewards-catalog/categories");
  });

  it("should request featured rewards", async () => {
    mockGet.mockResolvedValue({ data: [] });

    await getFeaturedRewards();

    expect(mockGet).toHaveBeenCalledWith("/rewards-catalog/featured");
  });

  it("should request popular rewards", async () => {
    mockGet.mockResolvedValue({ data: [] });

    await getPopularRewards();

    expect(mockGet).toHaveBeenCalledWith("/rewards-catalog/popular");
  });

  it("should request a reward by slug", async () => {
    mockGet.mockResolvedValue({ data: { id: "r1" } });

    const result = await getReward("free-coffee");

    expect(mockGet).toHaveBeenCalledWith("/rewards-catalog/free-coffee");
    expect(result.id).toBe("r1");
  });

  it("should request related rewards", async () => {
    mockGet.mockResolvedValue({ data: [] });

    await getRelatedRewards("free-coffee");

    expect(mockGet).toHaveBeenCalledWith("/rewards-catalog/free-coffee/related");
  });

  it("should request eligibility", async () => {
    mockGet.mockResolvedValue({ data: { eligible: true } });

    const result = await getRewardEligibility("free-coffee");

    expect(mockGet).toHaveBeenCalledWith("/rewards-catalog/free-coffee/eligibility");
    expect(result.eligible).toBe(true);
  });

  it("should post a redemption with an empty body by default", async () => {
    mockPost.mockResolvedValue({ data: { id: "redemption-1" } });

    await redeemReward("free-coffee");

    expect(mockPost).toHaveBeenCalledWith("/rewards-catalog/free-coffee/redeem", {});
  });

  it("should forward a chosen store on redemption", async () => {
    mockPost.mockResolvedValue({ data: { id: "redemption-1" } });

    await redeemReward("free-coffee", { storeId: "store-1" });

    expect(mockPost).toHaveBeenCalledWith("/rewards-catalog/free-coffee/redeem", {
      storeId: "store-1",
    });
  });

  it("should request my vouchers with filters", async () => {
    mockGet.mockResolvedValue({ data: { items: [], meta: {} } });

    await getMyVouchers({ status: "ACTIVE", page: 1 });

    expect(mockGet).toHaveBeenCalledWith("/rewards-catalog/vouchers/me", {
      params: { status: "ACTIVE", page: 1 },
    });
  });

  it("should request a single voucher", async () => {
    mockGet.mockResolvedValue({ data: { id: "v1" } });

    await getVoucher("v1");

    expect(mockGet).toHaveBeenCalledWith("/rewards-catalog/vouchers/v1");
  });

  it("should post an analytics event", async () => {
    await trackRewardEvent("free-coffee", "REWARD_CLICK", { source: "grid" });

    expect(mockPost).toHaveBeenCalledWith("/rewards-catalog/free-coffee/track", {
      eventType: "REWARD_CLICK",
      metadata: { source: "grid" },
    });
  });
});
