"use client";

import { useEffect, useRef, useCallback } from "react";
import { ArrowUpCircle, ArrowDownCircle, RotateCcw, Timer, Wrench, Loader2 } from "lucide-react";
import type { WalletTransaction, TransactionType } from "@/types/wallet";
import { transactionTypeLabel, transactionSourceLabel, formatCoins } from "@/types/wallet";

interface TransactionListProps {
  transactions: WalletTransaction[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

const TYPE_ICONS: Record<TransactionType, React.ReactNode> = {
  CREDIT: <ArrowDownCircle className="size-5 text-emerald-500" />,
  DEBIT: <ArrowUpCircle className="size-5 text-red-500" />,
  REFUND: <RotateCcw className="size-5 text-blue-500" />,
  EXPIRE: <Timer className="size-5 text-amber-500" />,
  ADJUSTMENT: <Wrench className="size-5 text-purple-500" />,
};

const TYPE_COLORS: Record<TransactionType, string> = {
  CREDIT: "text-emerald-600",
  DEBIT: "text-red-600",
  REFUND: "text-blue-600",
  EXPIRE: "text-amber-600",
  ADJUSTMENT: "text-purple-600",
};

export function TransactionList({
  transactions,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: TransactionListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const onIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(onIntersect, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [onIntersect]);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm font-sans text-on-surface-variant">
          No transactions yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {transactions.map((txn) => (
        <TransactionRow key={txn.id} transaction={txn} />
      ))}

      <div ref={sentinelRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="size-5 text-brand-green animate-spin" />
        </div>
      )}
    </div>
  );
}

function TransactionRow({ transaction }: { transaction: WalletTransaction }) {
  const isCredit = transaction.type === "CREDIT" || transaction.type === "REFUND";
  const sign = isCredit ? "+" : "-";

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-stone-200/80 shadow-xs">
      <div className="size-10 rounded-full bg-stone-50 flex items-center justify-center shrink-0">
        {TYPE_ICONS[transaction.type]}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-sans font-bold text-on-surface truncate">
          {transaction.description}
        </p>
        <p className="text-[11px] font-sans text-on-surface-variant">
          {transactionSourceLabel(transaction.source)} &middot;{" "}
          {transactionTypeLabel(transaction.type)} &middot;{" "}
          {new Date(transaction.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>

      <p className={`text-sm font-sans font-extrabold shrink-0 ${TYPE_COLORS[transaction.type]}`}>
        {sign}{formatCoins(transaction.amount)}
      </p>
    </div>
  );
}
