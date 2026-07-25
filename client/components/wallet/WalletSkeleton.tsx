"use client";

export function WalletSummarySkeleton() {
  return (
    <div className="w-full bg-stone-200/60 rounded-[28px] h-[200px] animate-pulse" />
  );
}

export function TransactionListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-[68px] rounded-2xl bg-stone-200/60 animate-pulse"
        />
      ))}
    </div>
  );
}
