"use client";

import { memo } from "react";
import { Bell } from "lucide-react";
import { useUnreadCount } from "@/hooks/useNotifications";

interface NotificationBellProps {
  onClick: () => void;
  /** Skips polling when signed out. */
  enabled?: boolean;
}

function NotificationBellBase({ onClick, enabled = true }: NotificationBellProps) {
  const { data } = useUnreadCount(enabled);
  const unread = data?.unread ?? 0;
  const display = unread > 99 ? "99+" : String(unread);

  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={onClick}
      aria-label={
        unread > 0
          ? `Notifications, ${unread} unread`
          : "Notifications, none unread"
      }
      className="relative flex size-11 items-center justify-center rounded-full border border-outline-variant text-on-surface transition-all duration-200 hover:border-brand-green hover:text-brand-green hover:shadow-hover cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
    >
      <Bell aria-hidden="true" className="size-5" strokeWidth={2} />

      {unread > 0 && (
        <span
          suppressHydrationWarning
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-brand-red px-1 py-0.5 text-[10px] font-sans font-extrabold leading-none text-white"
        >
          {display}
        </span>
      )}

      {/* The count is announced politely so a screen reader hears updates. */}
      <span className="sr-only" role="status" aria-live="polite">
        {unread > 0 ? `${unread} unread notifications` : ""}
      </span>
    </button>
  );
}

export const NotificationBell = memo(NotificationBellBase);
