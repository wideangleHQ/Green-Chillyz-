"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Wallet } from "lucide-react";
import Link from "next/link";
import { useWalletSummary, useTransactions } from "@/hooks/useWallet";
import {
  WalletSummaryCard,
  TransactionList,
  TransactionFilters,
  WalletSummarySkeleton,
  TransactionListSkeleton,
} from "@/components/wallet";
import type { TransactionType, TransactionSource } from "@/types/wallet";

export default function WalletPage() {
  const [typeFilter, setTypeFilter] = useState<TransactionType | undefined>();
  const [sourceFilter, setSourceFilter] = useState<TransactionSource | undefined>();

  const filters = useMemo(
    () => ({
      ...(typeFilter && { type: typeFilter }),
      ...(sourceFilter && { source: sourceFilter }),
    }),
    [typeFilter, sourceFilter],
  );

  const { data: summary, isLoading: summaryLoading } = useWalletSummary();
  const {
    data: txnPages,
    isLoading: txnLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useTransactions(Object.keys(filters).length > 0 ? filters : undefined);

  const allTransactions = useMemo(
    () => txnPages?.pages.flatMap((p) => p.items) ?? [],
    [txnPages],
  );

  return (
    <div className="min-h-screen bg-[#FFF8F1]">
      <div className="container-site py-6 md:py-10 flex flex-col gap-6 md:gap-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="size-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center border border-white/80 shadow-xs transition-all"
          >
            <ArrowLeft className="size-5 text-on-surface" />
          </Link>
          <div className="flex items-center gap-2">
            <Wallet className="size-5 text-brand-green" />
            <h1 className="text-xl md:text-2xl font-heading font-extrabold uppercase text-on-surface tracking-tight">
              My Wallet
            </h1>
          </div>
        </div>

        {summaryLoading ? (
          <WalletSummarySkeleton />
        ) : summary ? (
          <WalletSummaryCard summary={summary} />
        ) : null}

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-heading font-extrabold uppercase text-on-surface tracking-tight">
            Transaction History
          </h2>

          <TransactionFilters
            type={typeFilter}
            source={sourceFilter}
            onTypeChange={setTypeFilter}
            onSourceChange={setSourceFilter}
          />

          {txnLoading ? (
            <TransactionListSkeleton />
          ) : (
            <TransactionList
              transactions={allTransactions}
              hasNextPage={hasNextPage ?? false}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
