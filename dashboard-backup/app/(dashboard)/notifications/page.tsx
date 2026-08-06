'use client';

import React from 'react';
import { useListNotifications, useUnreadNotificationsCount } from '@/hooks/useDashboardOps';
import { Bell, RefreshCw } from 'lucide-react';

export default function NotificationsModule() {
  const { data: list, isLoading: listLoading, refetch: refetchNotifications } = useListNotifications({
    page: 1,
    pageSize: 20,
  });
  const { data: unreadData } = useUnreadNotificationsCount();

  return (
    <div className="flex flex-col gap-6 select-none text-xs">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[var(--border)]/10 pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Notifications</h1>
          <p className="text-xs text-[var(--text-muted)]">
            View notification delivery history and unread alerts for your store.
          </p>
        </div>
        <button
          onClick={() => refetchNotifications()}
          className="p-2 border border-[var(--border)]/10 rounded-lg hover:bg-[var(--surface-hover)] cursor-pointer self-start"
        >
          <RefreshCw className="w-4 h-4 text-[var(--text-muted)]" />
        </button>
      </div>

      {/* UNREAD COUNT WIDGET */}
      <div className="p-4 rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft flex items-center gap-4 max-w-xs">
        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">
          <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider block">Unread Alerts</span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {unreadData?.unread ?? 0}
          </span>
        </div>
      </div>

      {/* NOTIFICATION LIST */}
      <div className="border border-[var(--border)]/10 rounded-2xl bg-[var(--surface)] shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)]/10">
          <h3 className="text-sm font-bold tracking-tight">Notification History</h3>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Recent store notification records.</p>
        </div>

        {listLoading ? (
          <div className="p-6 space-y-3 animate-pulse">
            <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
            <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
            <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
          </div>
        ) : list && list.items.length > 0 ? (
          <div className="divide-y divide-[var(--border)]/5">
            {list.items.map((n: any) => (
              <div
                key={n.id}
                className="px-6 py-4 flex flex-col gap-1.5 hover:bg-[var(--surface-hover)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--foreground)]">{n.title}</span>
                  <span className="text-[9px] text-[var(--text-muted)] shrink-0 ml-4">
                    {new Date(n.createdAt).toLocaleDateString()} at{' '}
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{n.message}</p>
                <div className="flex items-center gap-3 text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-0.5">
                  <span>Channel: {n.type}</span>
                  {n.readAt && <span className="text-emerald-600 dark:text-emerald-400">Read</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-[var(--text-muted)] border-t border-dashed border-[var(--border)]/20">
            <Bell className="w-10 h-10 text-[var(--border)] mb-2 stroke-[1.2] mx-auto" />
            <p className="text-xs font-semibold">No notification history</p>
            <p className="text-[10px] max-w-[200px] mt-1 leading-relaxed mx-auto">
              Logs will appear here once notifications are dispatched.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
