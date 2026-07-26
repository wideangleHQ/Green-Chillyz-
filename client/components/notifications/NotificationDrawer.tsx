"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Bell, X, CheckCheck, Loader2, AlertCircle } from "lucide-react";
import {
  useLatestNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useTrackNotificationClick,
  useArchiveNotification,
  useDeleteNotification,
} from "@/hooks/useNotifications";
import { NotificationCard } from "./NotificationCard";
import { NotificationListSkeleton } from "./NotificationSkeleton";
import type { AppNotification } from "@/types/notifications";
import { resolveNotificationHref } from "@/types/notifications";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Bottom sheet on mobile, centred panel on desktop — mirroring the wallet
 * quick view so the app keeps one interaction language.
 */
export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const { data, isLoading, isError, refetch } = useLatestNotifications(isOpen);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const trackClick = useTrackNotificationClick();
  const archive = useArchiveNotification();
  const remove = useDeleteNotification();

  const notifications = data ?? [];
  const hasUnread = notifications.some((n) => n.status === "UNREAD");

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, [isOpen]);

  // Escape closes; Tab is trapped inside the panel.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const handleSelect = useCallback(
    (notification: AppNotification) => {
      const href = resolveNotificationHref(notification);

      if (href) {
        trackClick.mutate(notification.id);
        onClose();
        router.push(href);
        return;
      }

      if (notification.status === "UNREAD") {
        markRead.mutate(notification.id);
      }
    },
    [markRead, trackClick, onClose, router],
  );

  const handleArchive = useCallback(
    (id: string) => archive.mutate(id),
    [archive],
  );
  const handleDelete = useCallback((id: string) => remove.mutate(id), [remove]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs"
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] shadow-heavy max-h-[85vh] sm:max-h-[70vh] flex flex-col"
          >
            <header className="flex items-center justify-between gap-3 p-5 pb-3 border-b border-stone-100">
              <h2 className="inline-flex items-center gap-2 font-sans font-extrabold uppercase tracking-tight text-on-surface text-base">
                <Bell className="size-4 text-brand-green" aria-hidden="true" />
                Notifications
              </h2>

              <div className="flex items-center gap-1">
                {hasUnread && (
                  <button
                    type="button"
                    onClick={() => markAllRead.mutate()}
                    disabled={markAllRead.isPending}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-sans font-bold uppercase tracking-wider text-brand-green hover:bg-brand-green/10 transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
                  >
                    <CheckCheck className="size-3.5" aria-hidden="true" />
                    Mark all read
                  </button>
                )}
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Close notifications"
                  className="size-8 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-on-surface transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
                >
                  <X className="size-4" />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-3">
              {isLoading ? (
                <NotificationListSkeleton />
              ) : isError ? (
                <div
                  role="alert"
                  className="flex flex-col items-center gap-3 py-12 text-center"
                >
                  <AlertCircle className="size-8 text-red-400" aria-hidden="true" />
                  <p className="text-sm font-sans text-stone-600">
                    Could not load notifications.
                  </p>
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    className="rounded-full bg-brand-green px-5 py-2 font-sans text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-brand-green-hover cursor-pointer"
                  >
                    Try again
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-14 text-center">
                  <span className="size-12 rounded-full bg-stone-100 flex items-center justify-center">
                    <Bell className="size-5 text-stone-400" aria-hidden="true" />
                  </span>
                  <p className="font-sans font-extrabold uppercase tracking-tight text-on-surface text-sm">
                    You are all caught up
                  </p>
                  <p className="text-xs font-sans text-stone-500 max-w-[220px]">
                    Coins, rewards and game wins will show up here.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-1">
                  {notifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onSelect={handleSelect}
                      onArchive={handleArchive}
                      onDelete={handleDelete}
                    />
                  ))}
                </ul>
              )}
            </div>

            {markAllRead.isPending && (
              <div className="absolute inset-x-0 top-0 flex justify-center pt-2" role="status">
                <Loader2
                  className="size-4 animate-spin text-brand-green"
                  aria-hidden="true"
                />
                <span className="sr-only">Updating notifications…</span>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
