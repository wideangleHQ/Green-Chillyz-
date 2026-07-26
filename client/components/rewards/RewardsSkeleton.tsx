"use client";

export function RewardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-3 gap-4"
      role="status"
      aria-label="Loading rewards"
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="rounded-[24px] bg-stone-200/60 h-[280px] animate-pulse"
        />
      ))}
      <span className="sr-only">Loading rewards…</span>
    </div>
  );
}

export function RewardDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading reward">
      <div className="rounded-[28px] bg-stone-200/60 aspect-[16/9] animate-pulse" />
      <div className="h-8 w-2/3 rounded-full bg-stone-200/60 animate-pulse" />
      <div className="h-4 w-full rounded-full bg-stone-200/60 animate-pulse" />
      <div className="h-4 w-4/5 rounded-full bg-stone-200/60 animate-pulse" />
      <span className="sr-only">Loading reward…</span>
    </div>
  );
}

export function VoucherListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Loading vouchers">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="h-[120px] rounded-[24px] bg-stone-200/60 animate-pulse"
        />
      ))}
      <span className="sr-only">Loading vouchers…</span>
    </div>
  );
}
