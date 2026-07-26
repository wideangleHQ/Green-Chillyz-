"use client";

export function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div
      className="flex flex-col gap-2"
      role="status"
      aria-label="Loading notifications"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex gap-3 rounded-2xl p-3">
          <div className="size-9 shrink-0 rounded-full bg-stone-200/70 animate-pulse" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-3 w-2/3 rounded-full bg-stone-200/70 animate-pulse" />
            <div className="h-3 w-full rounded-full bg-stone-200/70 animate-pulse" />
            <div className="h-2 w-16 rounded-full bg-stone-200/70 animate-pulse" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading notifications…</span>
    </div>
  );
}
