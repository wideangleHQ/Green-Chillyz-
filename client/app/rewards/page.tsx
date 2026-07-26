"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Gift, Ticket, Sparkles, Loader2 } from "lucide-react";
import {
  useRewardsCatalog,
  useRewardCategories,
  useFeaturedRewards,
} from "@/hooks/useRewards";
import { useWalletBalance } from "@/hooks/useWallet";
import { ProtectedRoute } from "@/components/auth";
import {
  RewardCard,
  RewardFilters,
  RewardGridSkeleton,
} from "@/components/rewards";
import { formatCoins } from "@/types/wallet";
import type { RewardSort } from "@/types/rewards";

/** Debounce keystrokes so typing does not fire a request per character. */
function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function RewardsPage() {
  return (
    <ProtectedRoute>
      <RewardsCatalog />
    </ProtectedRoute>
  );
}

function RewardsCatalog() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const [sort, setSort] = useState<RewardSort>("priority");

  const debouncedSearch = useDebounced(search);

  const filters = useMemo(
    () => ({
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(category && { category }),
      sort,
    }),
    [debouncedSearch, category, sort],
  );

  const { data: balanceData } = useWalletBalance();
  const { data: categories } = useRewardCategories();
  const { data: featured } = useFeaturedRewards();
  const {
    data: pages,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useRewardsCatalog(filters);

  const rewards = useMemo(
    () => pages?.pages.flatMap((p) => p.items) ?? [],
    [pages],
  );

  const balance = balanceData?.balance;
  const isFiltered = Boolean(debouncedSearch || category);

  // Infinite scroll via IntersectionObserver — no scroll listener churn.
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="min-h-screen bg-[#FFF8F1]">
      <div className="container-site py-6 md:py-10 flex flex-col gap-6 md:gap-8 max-w-5xl mx-auto">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="Back to home"
              className="size-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center border border-white/80 shadow-xs transition-all"
            >
              <ArrowLeft className="size-5 text-on-surface" />
            </Link>
            <div className="flex items-center gap-2">
              <Gift className="size-5 text-brand-green" aria-hidden="true" />
              <h1 className="text-xl md:text-2xl font-heading font-extrabold uppercase text-on-surface tracking-tight">
                Rewards
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {balance !== undefined && (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-sans font-extrabold text-brand-green border border-white/80 shadow-xs">
                {formatCoins(balance)} coins
              </span>
            )}
            <Link
              href="/rewards/vouchers"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-green px-4 py-2 font-heading text-xs uppercase tracking-wider text-white shadow-soft transition-all hover:bg-brand-green-hover hover:shadow-hover"
            >
              <Ticket className="size-4" aria-hidden="true" />
              My Vouchers
            </Link>
          </div>
        </header>

        {!isFiltered && featured && featured.length > 0 && (
          <section aria-labelledby="featured-heading" className="flex flex-col gap-4">
            <h2
              id="featured-heading"
              className="inline-flex items-center gap-2 text-lg font-heading font-extrabold uppercase text-on-surface tracking-tight"
            >
              <Sparkles className="size-4 text-brand-green" aria-hidden="true" />
              Featured
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((reward) => (
                <RewardCard key={reward.id} reward={reward} balance={balance} />
              ))}
            </div>
          </section>
        )}

        <RewardFilters
          search={search}
          onSearchChange={setSearch}
          categories={categories ?? []}
          activeCategory={category}
          onCategoryChange={setCategory}
          sort={sort}
          onSortChange={setSort}
        />

        <section aria-labelledby="catalog-heading" className="flex flex-col gap-4">
          <h2 id="catalog-heading" className="sr-only">
            All rewards
          </h2>

          {isLoading ? (
            <RewardGridSkeleton />
          ) : rewards.length === 0 ? (
            <div className="rounded-[24px] bg-white border border-white/80 p-10 text-center">
              <p className="font-heading font-extrabold uppercase tracking-tight text-on-surface mb-1">
                No rewards found
              </p>
              <p className="text-sm font-sans text-stone-500">
                {isFiltered
                  ? "Try a different search or category."
                  : "Check back soon — new rewards are on the way."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {rewards.map((reward) => (
                  <RewardCard key={reward.id} reward={reward} balance={balance} />
                ))}
              </div>

              <div ref={sentinelRef} aria-hidden="true" className="h-px" />

              {isFetchingNextPage && (
                <div className="flex justify-center py-4" role="status">
                  <Loader2
                    className="size-5 animate-spin text-brand-green"
                    aria-hidden="true"
                  />
                  <span className="sr-only">Loading more rewards…</span>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
