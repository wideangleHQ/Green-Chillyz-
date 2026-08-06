'use client';

import React from 'react';
import { useDashboardAuth } from '@/components/providers/AuthProvider';
import { useStoreStats, useStoreActivity } from '@/hooks/useDashboardOps';
import {
  Users,
  Ticket,
  Wallet,
  Sparkles,
  Megaphone,
  Bell,
  ArrowUpRight,
  TrendingUp,
  Clock,
  ChevronRight,
  UserPlus,
  Send,
  Sliders,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardHome() {
  const { store } = useDashboardAuth();
  const { data: stats, isLoading: statsLoading } = useStoreStats();
  const { data: activity, isLoading: activityLoading } = useStoreActivity(8);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const quickActions = [
    { name: 'Redeem Voucher', href: '/vouchers', icon: <Ticket className="w-4 h-4 text-emerald-600" />, desc: 'Verify and scan a customer voucher' },
    { name: 'Find Customer', href: '/customers', icon: <Users className="w-4 h-4 text-emerald-600" />, desc: 'Lookup profile, balance & timeline' },
    { name: 'Create Offer', href: '/offers', icon: <Sparkles className="w-4 h-4 text-emerald-600" />, desc: 'Configure a new store discount offer' },
    { name: 'Send Notification', href: '/notifications', icon: <Send className="w-4 h-4 text-emerald-600" />, desc: 'Push notification blast to store guests' },
    { name: 'View Rewards', href: '/rewards', icon: <TrendingUp className="w-4 h-4 text-emerald-600" />, desc: 'Browse available coin items' },
    { name: 'Store Settings', href: '/settings', icon: <Sliders className="w-4 h-4 text-emerald-600" />, desc: 'Adjust hours, gallery & managers' },
  ];

  // Map backend stats to a card layout
  const cards = [
    {
      title: "Today's Customers",
      value: stats?.newCustomers ?? 0,
      icon: <Users className="w-4 h-4 text-emerald-600" />,
      desc: 'New profiles assigned today',
    },
    {
      title: "Voucher Redemptions",
      value: stats?.todayRedemptions ?? 0,
      icon: <Ticket className="w-4 h-4 text-emerald-600" />,
      desc: 'Vouchers validated & marked used',
    },
    {
      title: "Active Vouchers",
      value: stats?.activeVouchers ?? 0,
      icon: <Sparkles className="w-4 h-4 text-emerald-600" />,
      desc: 'Vouchers ready for redemption',
    },
    {
      title: "Wallet Coins Credited",
      value: stats?.walletCredits ?? 0,
      icon: <Wallet className="w-4 h-4 text-emerald-600" />,
      desc: 'Coins earned via rules/campaigns',
    },
    {
      title: "Wallet Coins Debited",
      value: stats?.walletDebits ?? 0,
      icon: <TrendingUp className="w-4 h-4 text-emerald-600" />,
      desc: 'Coins spent on redemptions',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ─── WELCOME BANNER ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-soft">
        <div>
          <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest">
            Welcome Back
          </span>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight mt-0.5">
            {store?.storeName} Management
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Store Operator Portal • {store?.city}, {store?.state}
          </p>
        </div>
        <div className="flex flex-col md:items-end text-xs font-semibold shrink-0">
          <div className="text-[var(--foreground)]">{formattedDate}</div>
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mt-0.5">
            Shift: Active Session
          </div>
        </div>
      </div>

      {/* ─── QUICK ACTIONS GRID ─── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="flex items-start gap-4 p-4 rounded-xl border border-[var(--border)]/10 hover:border-[var(--color-primary)]/40 bg-[var(--surface)] hover:bg-[var(--surface-hover)] shadow-soft transition-all duration-200"
            >
              <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--border)]/5 flex items-center justify-center shrink-0">
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  {action.name}
                  <ArrowUpRight className="w-3 h-3 text-[var(--text-muted)]" />
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mt-1">
                  {action.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── KPI CARDS ─── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Today's Metrics
          </h2>
          <span className="text-[10px] text-[var(--text-muted)] italic">
            Refreshes in background
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className="p-4 rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft flex flex-col gap-1.5 relative overflow-hidden"
            >
              <div className="flex items-center justify-between text-[var(--text-muted)]">
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  {card.title}
                </span>
                {card.icon}
              </div>
              {statsLoading ? (
                <div className="h-7 w-20 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-md mt-1" />
              ) : (
                <div className="text-xl font-bold tracking-tight text-[var(--foreground)] mt-1">
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </div>
              )}
              <p className="text-[9px] text-[var(--text-muted)] leading-normal mt-0.5">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TWO COLUMN GRID (ACTIVITY STREAM + INFO) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_0.9fr] gap-6">
        
        {/* Live Activity Feed */}
        <section className="p-6 rounded-2xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[var(--border)]/10 pb-3">
            <div>
              <h3 className="text-sm font-bold tracking-tight">Store Activity Stream</h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Real-time merge of coin adjustments and voucher redemptions
              </p>
            </div>
            <Clock className="w-4 h-4 text-[var(--text-muted)] stroke-[1.5]" />
          </div>

          {activityLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3 items-start animate-pulse">
                  <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800" />
                  <div className="flex-1 space-y-2 py-0.5">
                    <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/3" />
                    <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : activity && activity.length > 0 ? (
            <div className="flex flex-col gap-4">
              {activity.map((item, idx) => {
                const date = new Date(item.occurredAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-4 pb-3 last:pb-0 border-b border-[var(--border)]/5 last:border-b-0 text-xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--background)] border border-[var(--border)]/10 flex items-center justify-center shrink-0 font-semibold text-[10px] text-[var(--color-primary)]">
                      {item.type.substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[var(--foreground)] truncate">{item.title}</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                        {item.detail || 'System operation'}
                      </div>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-medium shrink-0 pt-0.5">
                      {date}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center text-[var(--text-muted)] border border-dashed border-[var(--border)]/20 rounded-xl">
              <Ticket className="w-8 h-8 text-[var(--border)] mb-2 stroke-[1.5]" />
              <p className="text-xs font-semibold">No operational events today</p>
              <p className="text-[10px] max-w-[200px] mt-1 leading-relaxed">
                Activity will stream here once customers redeem vouchers or earn coins.
              </p>
            </div>
          )}
        </section>

        {/* Store Context Quick View */}
        <section className="p-6 rounded-2xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[var(--border)]/10 pb-3">
            <h3 className="text-sm font-bold tracking-tight">Active Context</h3>
            <Sliders className="w-4 h-4 text-[var(--text-muted)] stroke-[1.5]" />
          </div>

          <div className="flex flex-col gap-4 text-xs">
            <div className="p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]/10">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Assigned Store Code
              </span>
              <div className="font-bold text-sm text-[var(--color-primary)] mt-0.5">
                {store?.storeCode}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]/10">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Brand Name
                </span>
                <div className="font-semibold mt-0.5 text-[var(--foreground)]">{store?.brandName}</div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]/10">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  City Scope
                </span>
                <div className="font-semibold mt-0.5 text-[var(--foreground)]">{store?.city}</div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-dashed border-[var(--border)]/30 flex items-center justify-between">
              <div>
                <div className="font-bold text-[var(--foreground)]">Voucher Redemptions</div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-normal max-w-[150px]">
                  Scan and clear customer rewards.
                </div>
              </div>
              <Link
                href="/vouchers"
                className="p-1.5 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-container)] transition-colors"
                title="Go to Redemption Console"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
