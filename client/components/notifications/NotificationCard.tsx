"use client";

import { memo } from "react";
import {
  Coins,
  Gamepad2,
  Gift,
  Ticket,
  Users,
  Cake,
  Sparkles,
  Store,
  ShieldAlert,
  PartyPopper,
  Timer,
  TrendingUp,
  ArrowUpCircle,
  Bell,
  Archive,
  Trash2,
} from "lucide-react";
import type { AppNotification, NotificationType } from "@/types/notifications";
import { relativeTime, resolveNotificationHref } from "@/types/notifications";

interface NotificationCardProps {
  notification: AppNotification;
  onSelect: (notification: AppNotification) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
}

/** Server sends an icon name; map it to a component without eval or dynamic import. */
const ICON_BY_NAME: Record<string, React.ReactNode> = {
  coins: <Coins className="size-4" aria-hidden="true" />,
  "arrow-up-circle": <ArrowUpCircle className="size-4" aria-hidden="true" />,
  timer: <Timer className="size-4" aria-hidden="true" />,
  "gamepad-2": <Gamepad2 className="size-4" aria-hidden="true" />,
  gift: <Gift className="size-4" aria-hidden="true" />,
  ticket: <Ticket className="size-4" aria-hidden="true" />,
  users: <Users className="size-4" aria-hidden="true" />,
  cake: <Cake className="size-4" aria-hidden="true" />,
  sparkles: <Sparkles className="size-4" aria-hidden="true" />,
  store: <Store className="size-4" aria-hidden="true" />,
  "shield-alert": <ShieldAlert className="size-4" aria-hidden="true" />,
  "party-popper": <PartyPopper className="size-4" aria-hidden="true" />,
  "trending-up": <TrendingUp className="size-4" aria-hidden="true" />,
};

const ICON_BY_TYPE: Record<NotificationType, React.ReactNode> = {
  SYSTEM: <Bell className="size-4" aria-hidden="true" />,
  WALLET: <Coins className="size-4" aria-hidden="true" />,
  GAME: <Gamepad2 className="size-4" aria-hidden="true" />,
  REWARD: <Gift className="size-4" aria-hidden="true" />,
  REDEMPTION: <Ticket className="size-4" aria-hidden="true" />,
  REFERRAL: <Users className="size-4" aria-hidden="true" />,
  LOYALTY: <TrendingUp className="size-4" aria-hidden="true" />,
  STORE: <Store className="size-4" aria-hidden="true" />,
  CAMPAIGN: <Sparkles className="size-4" aria-hidden="true" />,
  MARKETING: <Sparkles className="size-4" aria-hidden="true" />,
  SECURITY: <ShieldAlert className="size-4" aria-hidden="true" />,
  ORDER: <Bell className="size-4" aria-hidden="true" />,
  CUSTOM: <Bell className="size-4" aria-hidden="true" />,
};

const TYPE_TINT: Record<NotificationType, string> = {
  SYSTEM: "bg-stone-100 text-stone-500",
  WALLET: "bg-brand-green/10 text-brand-green",
  GAME: "bg-purple-50 text-purple-600",
  REWARD: "bg-amber-50 text-amber-600",
  REDEMPTION: "bg-amber-50 text-amber-600",
  REFERRAL: "bg-blue-50 text-blue-600",
  LOYALTY: "bg-emerald-50 text-emerald-600",
  STORE: "bg-stone-100 text-stone-600",
  CAMPAIGN: "bg-pink-50 text-pink-600",
  MARKETING: "bg-pink-50 text-pink-600",
  SECURITY: "bg-red-50 text-red-600",
  ORDER: "bg-stone-100 text-stone-600",
  CUSTOM: "bg-stone-100 text-stone-600",
};

function NotificationCardBase({
  notification,
  onSelect,
  onArchive,
  onDelete,
}: NotificationCardProps) {
  const unread = notification.status === "UNREAD";
  const critical = notification.priority === "CRITICAL";
  const high = notification.priority === "HIGH";
  const href = resolveNotificationHref(notification);

  const icon =
    (notification.icon ? ICON_BY_NAME[notification.icon] : undefined) ??
    ICON_BY_TYPE[notification.type];

  return (
    <li
      className={`group relative flex gap-3 rounded-2xl p-3 transition-colors ${
        unread ? "bg-brand-green/5" : "bg-white"
      } hover:bg-stone-50`}
    >
      <span
        className={`shrink-0 size-9 rounded-full flex items-center justify-center ${
          TYPE_TINT[notification.type]
        }`}
      >
        {icon}
      </span>

      <button
        type="button"
        onClick={() => onSelect(notification)}
        className="flex-1 min-w-0 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green rounded-lg"
      >
        <span className="flex items-center gap-2">
          {unread && (
            <span
              className="size-1.5 shrink-0 rounded-full bg-brand-green"
              aria-label="Unread"
            />
          )}
          <span
            className={`text-sm font-sans leading-snug line-clamp-1 ${
              unread ? "font-extrabold text-on-surface" : "font-semibold text-stone-600"
            }`}
          >
            {notification.title}
          </span>
          {(critical || high) && (
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                critical ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {critical ? "Urgent" : "Important"}
            </span>
          )}
        </span>

        <span className="mt-0.5 block text-xs font-sans text-stone-500 line-clamp-2">
          {notification.message}
        </span>

        <span className="mt-1 flex items-center gap-2">
          <time
            dateTime={notification.createdAt}
            className="text-[11px] font-sans text-stone-400"
          >
            {relativeTime(notification.createdAt)}
          </time>
          {href && notification.actionLabel && (
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-brand-green">
              {notification.actionLabel}
            </span>
          )}
        </span>
      </button>

      <span className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        {onArchive && (
          <button
            type="button"
            onClick={() => onArchive(notification.id)}
            aria-label={`Archive notification: ${notification.title}`}
            className="size-7 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-on-surface transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-green"
          >
            <Archive className="size-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(notification.id)}
            aria-label={`Delete notification: ${notification.title}`}
            className="size-7 rounded-full flex items-center justify-center text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-green"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </span>
    </li>
  );
}

export const NotificationCard = memo(NotificationCardBase);
