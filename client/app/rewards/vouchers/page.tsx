"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Ticket, Loader2 } from "lucide-react";
import { useMyVouchers } from "@/hooks/useRewards";
import { ProtectedRoute } from "@/components/auth";
import { VoucherCard, VoucherListSkeleton } from "@/components/rewards";
import type { VoucherStatus } from "@/types/rewards";

const TABS: Array<{ label: string; status?: VoucherStatus }> = [
  { label: "Active", status: "ACTIVE" },
  { label: "Used", status: "USED" },
  { label: "Expired", status: "EXPIRED" },
  { label: "All", status: undefined },
];

export default function VouchersPage() {
  return (
    <ProtectedRoute>
      <MyVouchers />
    </ProtectedRoute>
  );
}

function MyVouchers() {
  const [activeStatus, setActiveStatus] = useState<VoucherStatus | undefined>("ACTIVE");

  const filters = useMemo(
    () => (activeStatus ? { status: activeStatus } : undefined),
    [activeStatus],
  );

  const {
    data: pages,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMyVouchers(filters);

  const vouchers = useMemo(
    () => pages?.pages.flatMap((p) => p.items) ?? [],
    [pages],
  );

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
      <div className="container-site py-6 md:py-10 flex flex-col gap-6 max-w-2xl mx-auto">
        <header className="flex items-center gap-3">
          <Link
            href="/rewards"
            aria-label="Back to rewards"
            className="size-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center border border-white/80 shadow-xs transition-all"
          >
            <ArrowLeft className="size-5 text-on-surface" />
          </Link>
          <div className="flex items-center gap-2">
            <Ticket className="size-5 text-brand-green" aria-hidden="true" />
            <h1 className="text-xl md:text-2xl font-heading font-extrabold uppercase text-on-surface tracking-tight">
              My Vouchers
            </h1>
          </div>
        </header>

        <div role="tablist" aria-label="Voucher status" className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const active = activeStatus === tab.status;
            return (
              <button
                key={tab.label}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setActiveStatus(tab.status)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green ${
                  active
                    ? "bg-brand-green text-white shadow-xs"
                    : "bg-white text-stone-500 border border-white/80 hover:text-on-surface"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <VoucherListSkeleton />
        ) : vouchers.length === 0 ? (
          <div className="rounded-[24px] bg-white border border-white/80 p-10 text-center">
            <p className="font-heading font-extrabold uppercase tracking-tight text-on-surface mb-1">
              No vouchers here
            </p>
            <p className="text-sm font-sans text-stone-500 mb-5">
              Redeem a reward to get your first voucher.
            </p>
            <Link
              href="/rewards"
              className="inline-flex items-center justify-center rounded-full bg-brand-green px-6 py-2.5 font-heading text-sm uppercase tracking-wider text-white shadow-soft transition-all hover:bg-brand-green-hover hover:shadow-hover"
            >
              Browse Rewards
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {vouchers.map((voucher) => (
                <VoucherCard key={voucher.id} voucher={voucher} />
              ))}
            </div>

            <div ref={sentinelRef} aria-hidden="true" className="h-px" />

            {isFetchingNextPage && (
              <div className="flex justify-center py-4" role="status">
                <Loader2
                  className="size-5 animate-spin text-brand-green"
                  aria-hidden="true"
                />
                <span className="sr-only">Loading more vouchers…</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
