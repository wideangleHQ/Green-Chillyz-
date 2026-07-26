import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/lib/api/rewardsApi", () => ({
  getRewards: vi.fn(),
  getRewardCategories: vi.fn(),
  getFeaturedRewards: vi.fn(),
  getPopularRewards: vi.fn(),
  getReward: vi.fn(),
  getRelatedRewards: vi.fn(),
  getRewardEligibility: vi.fn(),
  redeemReward: vi.fn(),
  getMyVouchers: vi.fn(),
  getVoucher: vi.fn(),
  trackRewardEvent: vi.fn(),
}));

import * as rewardsApi from "@/lib/api/rewardsApi";
import {
  useRewardsCatalog,
  useRewardCategories,
  useReward,
  useRewardEligibility,
  useMyVouchers,
  useRedeemReward,
  REWARDS_KEYS,
} from "./useRewards";
import { WALLET_KEYS } from "./useWallet";

const makeWrapper = (client: QueryClient) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
};

const makeClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const page = (items: unknown[], hasNextPage = false, pageNum = 1) => ({
  items,
  meta: {
    page: pageNum,
    pageSize: 12,
    totalItems: items.length,
    totalPages: hasNextPage ? pageNum + 1 : pageNum,
    hasNextPage,
    hasPreviousPage: pageNum > 1,
  },
});

describe("useRewards hooks", () => {
  let client: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = makeClient();
  });

  describe("query keys", () => {
    it("should namespace every key under rewards", () => {
      expect(REWARDS_KEYS.catalog()[0]).toBe("rewards");
      expect(REWARDS_KEYS.detail("x")[0]).toBe("rewards");
      expect(REWARDS_KEYS.vouchers()[0]).toBe("rewards");
    });

    it("should vary the catalog key by filters", () => {
      const a = JSON.stringify(REWARDS_KEYS.catalog({ category: "food" }));
      const b = JSON.stringify(REWARDS_KEYS.catalog({ category: "drinks" }));

      expect(a).not.toBe(b);
    });
  });

  describe("useRewardsCatalog", () => {
    it("should load the first page", async () => {
      vi.mocked(rewardsApi.getRewards).mockResolvedValue(
        page([{ id: "r1" }]) as never,
      );

      const { result } = renderHook(() => useRewardsCatalog(), {
        wrapper: makeWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.pages[0].items).toHaveLength(1);
    });

    it("should request page 1 with a fixed page size", async () => {
      vi.mocked(rewardsApi.getRewards).mockResolvedValue(page([]) as never);

      const { result } = renderHook(() => useRewardsCatalog({ category: "food" }), {
        wrapper: makeWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(rewardsApi.getRewards).toHaveBeenCalledWith({
        category: "food",
        page: 1,
        pageSize: 12,
      });
    });

    it("should expose a next page when more results exist", async () => {
      vi.mocked(rewardsApi.getRewards).mockResolvedValue(
        page([{ id: "r1" }], true) as never,
      );

      const { result } = renderHook(() => useRewardsCatalog(), {
        wrapper: makeWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.hasNextPage).toBe(true);
    });

    it("should stop paginating on the last page", async () => {
      vi.mocked(rewardsApi.getRewards).mockResolvedValue(page([{ id: "r1" }]) as never);

      const { result } = renderHook(() => useRewardsCatalog(), {
        wrapper: makeWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.hasNextPage).toBe(false);
    });

    it("should not fetch when disabled", () => {
      renderHook(() => useRewardsCatalog(undefined, false), {
        wrapper: makeWrapper(client),
      });

      expect(rewardsApi.getRewards).not.toHaveBeenCalled();
    });
  });

  describe("useRewardCategories", () => {
    it("should load categories", async () => {
      vi.mocked(rewardsApi.getRewardCategories).mockResolvedValue([
        { id: "c1", name: "Food", slug: "food", description: null, icon: null, sortOrder: 0 },
      ]);

      const { result } = renderHook(() => useRewardCategories(), {
        wrapper: makeWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(1);
    });
  });

  describe("useReward", () => {
    it("should fetch by slug", async () => {
      vi.mocked(rewardsApi.getReward).mockResolvedValue({ id: "r1" } as never);

      const { result } = renderHook(() => useReward("free-coffee"), {
        wrapper: makeWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(rewardsApi.getReward).toHaveBeenCalledWith("free-coffee");
    });

    it("should skip fetching for an empty slug", () => {
      renderHook(() => useReward(""), { wrapper: makeWrapper(client) });

      expect(rewardsApi.getReward).not.toHaveBeenCalled();
    });
  });

  describe("useRewardEligibility", () => {
    it("should fetch eligibility", async () => {
      vi.mocked(rewardsApi.getRewardEligibility).mockResolvedValue({
        eligible: true, checks: [], balance: 500, coinCost: 100, shortBy: 0,
      });

      const { result } = renderHook(() => useRewardEligibility("free-coffee"), {
        wrapper: makeWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.eligible).toBe(true);
    });
  });

  describe("useMyVouchers", () => {
    it("should load vouchers with a status filter", async () => {
      vi.mocked(rewardsApi.getMyVouchers).mockResolvedValue(page([{ id: "v1" }]) as never);

      const { result } = renderHook(() => useMyVouchers({ status: "ACTIVE" }), {
        wrapper: makeWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(rewardsApi.getMyVouchers).toHaveBeenCalledWith({
        status: "ACTIVE", page: 1, pageSize: 10,
      });
    });
  });

  describe("useRedeemReward", () => {
    const redemption = {
      id: "redemption-1",
      status: "COMPLETED",
      coinsSpent: 100,
      newBalance: 400,
      createdAt: new Date().toISOString(),
      reward: { id: "r1", title: "Free Coffee", slug: "free-coffee", image: null },
      voucher: { id: "voucher-1", code: "ABCD" },
    };

    it("should redeem and return the redemption", async () => {
      vi.mocked(rewardsApi.redeemReward).mockResolvedValue(redemption as never);

      const { result } = renderHook(() => useRedeemReward(), {
        wrapper: makeWrapper(client),
      });

      const value = await result.current.mutateAsync({ idOrSlug: "free-coffee" });

      expect(value.newBalance).toBe(400);
      expect(rewardsApi.redeemReward).toHaveBeenCalledWith("free-coffee", undefined);
    });

    it("should forward a chosen store", async () => {
      vi.mocked(rewardsApi.redeemReward).mockResolvedValue(redemption as never);

      const { result } = renderHook(() => useRedeemReward(), {
        wrapper: makeWrapper(client),
      });

      await result.current.mutateAsync({ idOrSlug: "free-coffee", storeId: "store-1" });

      expect(rewardsApi.redeemReward).toHaveBeenCalledWith("free-coffee", {
        storeId: "store-1",
      });
    });

    it("should invalidate wallet caches so the balance refreshes", async () => {
      vi.mocked(rewardsApi.redeemReward).mockResolvedValue(redemption as never);
      const invalidateSpy = vi.spyOn(client, "invalidateQueries");

      const { result } = renderHook(() => useRedeemReward(), {
        wrapper: makeWrapper(client),
      });

      await result.current.mutateAsync({ idOrSlug: "free-coffee" });

      await waitFor(() =>
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: WALLET_KEYS.all }),
      );
    });

    it("should invalidate reward caches so stock refreshes", async () => {
      vi.mocked(rewardsApi.redeemReward).mockResolvedValue(redemption as never);
      const invalidateSpy = vi.spyOn(client, "invalidateQueries");

      const { result } = renderHook(() => useRedeemReward(), {
        wrapper: makeWrapper(client),
      });

      await result.current.mutateAsync({ idOrSlug: "free-coffee" });

      await waitFor(() =>
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: REWARDS_KEYS.all }),
      );
    });

    it("should seed the new voucher into the cache", async () => {
      vi.mocked(rewardsApi.redeemReward).mockResolvedValue(redemption as never);

      const { result } = renderHook(() => useRedeemReward(), {
        wrapper: makeWrapper(client),
      });

      await result.current.mutateAsync({ idOrSlug: "free-coffee" });

      await waitFor(() =>
        expect(client.getQueryData(REWARDS_KEYS.voucher("voucher-1"))).toBeDefined(),
      );
    });

    it("should not touch caches when redemption fails", async () => {
      vi.mocked(rewardsApi.redeemReward).mockRejectedValue(new Error("Out of stock"));
      const invalidateSpy = vi.spyOn(client, "invalidateQueries");

      const { result } = renderHook(() => useRedeemReward(), {
        wrapper: makeWrapper(client),
      });

      await expect(
        result.current.mutateAsync({ idOrSlug: "free-coffee" }),
      ).rejects.toThrow("Out of stock");

      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });
});
