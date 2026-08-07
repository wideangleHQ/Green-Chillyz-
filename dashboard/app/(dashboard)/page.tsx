'use client';

import React from 'react';
import { useState } from 'react';
import { useDashboardAuth } from '@/components/providers/AuthProvider';
import { useStoreStats, useStoreActivity, useUnreadNotificationsCount, useQueryAuditLogs, useRedeemStoreVoucher } from '@/hooks/useDashboardOps';
import { useToast } from '@/components/providers/ToastProvider';
import { useMyAssignment, useMyProfile, usePreviewMyRewards } from '@/hooks/useRewardManagement';
import { useChallenges } from '@/hooks/useChallenges';
import { PageHeader } from '@/components/layout';
import { StatCard } from '@/components/ui/StatCard';
import {
  Users,
  Ticket,
  Wallet,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock,
  ChevronRight,
  Layers,
  Coins,
  Trophy,
  Target,
  GitBranch,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardHome() {
  const { store } = useDashboardAuth();
  const { data: stats, isLoading: statsLoading } = useStoreStats();
  const { data: activity, isLoading: activityLoading } = useStoreActivity(8);
  const { data: unreadData } = useUnreadNotificationsCount();
  const { data: myAssignment } = useMyAssignment();
  const { data: myProfile } = useMyProfile();
  const { data: previewRewards } = usePreviewMyRewards();
  const { data: challenges } = useChallenges({ status: 'ACTIVE' });
  const { data: recentAudit } = useQueryAuditLogs({ page: 1, pageSize: 5 });
  const redeemStoreVoucherMutation = useRedeemStoreVoucher();
  const { showToast } = useToast();
  const [quickRedeemCode, setQuickRedeemCode] = useState('');
  const [quickRedeemSuccess, setQuickRedeemSuccess] = useState<string | null>(null);

  const handleQuickRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRedeemCode.trim()) { showToast('Enter a coupon code', 'error'); return; }
    setQuickRedeemSuccess(null);
    try {
      const result = await redeemStoreVoucherMutation.mutateAsync(quickRedeemCode.trim());
      const name = result?.voucher?.name || quickRedeemCode;
      setQuickRedeemSuccess(`"${name}" redeemed successfully!`);
      showToast(`Voucher redeemed!`, 'success');
      setQuickRedeemCode('');
      setTimeout(() => setQuickRedeemSuccess(null), 5000);
    } catch (err: any) {
      showToast(err?.response?.data?.message || err.message || 'Failed to redeem', 'error');
    }
  };

  const profileName = (myProfile as any)?.name || 'Not assigned';
  const assignmentStatus = myAssignment ? 'Active' : 'None';
  const effectiveRewards = Array.isArray(previewRewards) ? previewRewards : (previewRewards as any)?.data || [];
  const challengesList = Array.isArray(challenges) ? challenges : (challenges as any)?.items || (challenges as any)?.data || [];
  const auditItems = (recentAudit as any)?.items || [];

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const quickActions = [
    { name: 'Redeem Voucher', href: '/vouchers', icon: <Ticket className="w-4 h-4 text-emerald-600" />, desc: 'Verify and scan a customer voucher' },
    { name: 'Reward Profiles', href: '/reward-profiles', icon: <Layers className="w-4 h-4 text-emerald-600" />, desc: 'Manage reward configurations' },
    { name: 'Reward Rules', href: '/reward-rules', icon: <GitBranch className="w-4 h-4 text-emerald-600" />, desc: 'Configure milestones & triggers' },
    { name: 'Coin Economy', href: '/coin-economy', icon: <Coins className="w-4 h-4 text-emerald-600" />, desc: 'Rules, limits & multipliers' },
    { name: 'Challenges', href: '/challenges', icon: <Trophy className="w-4 h-4 text-emerald-600" />, desc: 'Active challenge campaigns' },
    { name: 'Overrides', href: '/reward-overrides', icon: <Target className="w-4 h-4 text-emerald-600" />, desc: 'Store-level reward overrides' },
  ];

  const cards = [
    { title: "Today's Customers", value: stats?.newCustomers ?? 0, icon: <Users className="w-4 h-4 text-emerald-600" />, desc: 'New profiles assigned today' },
    { title: 'Voucher Redemptions', value: stats?.todayRedemptions ?? 0, icon: <Ticket className="w-4 h-4 text-emerald-600" />, desc: 'Vouchers validated & used' },
    { title: 'Active Vouchers', value: stats?.activeVouchers ?? 0, icon: <Sparkles className="w-4 h-4 text-emerald-600" />, desc: 'Vouchers ready for redemption' },
    { title: 'Coins Credited', value: stats?.walletCredits ?? 0, icon: <Wallet className="w-4 h-4 text-emerald-600" />, desc: 'Coins earned via rules' },
    { title: 'Coins Debited', value: stats?.walletDebits ?? 0, icon: <TrendingUp className="w-4 h-4 text-emerald-600" />, desc: 'Coins spent on redemptions' },
  ];

  return (
    <>
      {/* Page Header */}
      <PageHeader
        title={`${store?.storeName} Management`}
        description={`${store?.city}, ${store?.state} • ${formattedDate}`}
      />

      {/* Store Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Reward Profile</div>
          <div className="text-sm font-bold mt-1 text-[var(--color-primary)]">{profileName}</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Assignment: {assignmentStatus}</div>
        </div>
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Store Code</div>
          <div className="text-sm font-bold mt-1 text-[var(--color-primary)]">{store?.storeCode}</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{store?.brandName}</div>
        </div>
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Effective Rewards</div>
          <div className="text-sm font-bold mt-1">{effectiveRewards.length}</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Active rules for this store</div>
        </div>
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Unread Notifications</div>
          <div className="text-sm font-bold mt-1">{(unreadData as any)?.unread ?? 0}</div>
          <Link href="/notifications" className="text-[10px] text-[var(--color-primary)] font-semibold mt-0.5 inline-flex items-center gap-1 hover:underline">
            View all <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="flex items-start gap-4 p-4 rounded-lg border border-[var(--border)] hover:border-[var(--color-primary)]/50 bg-[var(--surface)] hover:bg-[var(--surface-hover)] shadow-sm transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center shrink-0 group-hover:bg-[var(--color-primary)]/15 transition-colors">
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  {action.name}
                  <ArrowUpRight className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mt-1">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Today's Metrics */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Today&apos;s Metrics</h2>
          <span className="text-[10px] text-[var(--text-muted)] italic">Live updates</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Today's Customers"
            value={stats?.newCustomers ?? 0}
            icon={<Users className="w-4 h-4" />}
            subtitle="New profiles assigned today"
            loading={statsLoading}
          />
          <StatCard
            title="Voucher Redemptions"
            value={stats?.todayRedemptions ?? 0}
            icon={<Ticket className="w-4 h-4" />}
            subtitle="Vouchers validated & used"
            loading={statsLoading}
          />
          <StatCard
            title="Active Vouchers"
            value={stats?.activeVouchers ?? 0}
            icon={<Sparkles className="w-4 h-4" />}
            subtitle="Vouchers ready for redemption"
            loading={statsLoading}
          />
          <StatCard
            title="Coins Credited"
            value={stats?.walletCredits ?? 0}
            icon={<Wallet className="w-4 h-4" />}
            subtitle="Coins earned via rules"
            loading={statsLoading}
          />
          <StatCard
            title="Coins Debited"
            value={stats?.walletDebits ?? 0}
            icon={<TrendingUp className="w-4 h-4" />}
            subtitle="Coins spent on redemptions"
            loading={statsLoading}
          />
        </div>
      </section>

      {/* Quick Voucher Redemption */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-[var(--color-primary)]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Quick Voucher Redemption</h3>
        </div>
        <form onSubmit={handleQuickRedeem} className="flex items-center gap-3">
          <input
            type="text"
            value={quickRedeemCode}
            onChange={e => setQuickRedeemCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="flex-1 max-w-xs px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
            disabled={redeemStoreVoucherMutation.isPending}
          />
          <button
            type="submit"
            disabled={redeemStoreVoucherMutation.isPending || !quickRedeemCode.trim()}
            className="px-4 py-2 bg-[var(--color-primary)] text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {redeemStoreVoucherMutation.isPending ? 'Redeeming...' : 'Redeem'}
          </button>
        </form>
        {quickRedeemSuccess && (
          <div className="mt-2 flex items-center gap-2 text-xs text-green-700 dark:text-green-300 font-semibold">
            <Ticket className="w-3.5 h-3.5" /> {quickRedeemSuccess}
          </div>
        )}
      </section>

      {/* Activity & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_0.9fr] gap-6">
        {/* Activity Stream */}
        <section className="p-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div>
              <h3 className="text-sm font-bold">Store Activity Stream</h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Real-time merge of coin adjustments and voucher redemptions</p>
            </div>
            <Clock className="w-4 h-4 text-[var(--text-muted)]" />
          </div>

          {activityLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3 items-start animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-[var(--surface-hover)]" />
                  <div className="flex-1 space-y-2 py-0.5">
                    <div className="h-3 bg-[var(--surface-hover)] rounded w-1/3" />
                    <div className="h-2 bg-[var(--surface-hover)] rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : activity && activity.length > 0 ? (
            <div className="space-y-3">
              {activity.map((item, idx) => {
                const date = new Date(item.occurredAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={idx} className="flex items-start gap-4 pb-3 last:pb-0 border-b border-[var(--border)] last:border-b-0 text-xs">
                    <div className="w-8 h-8 rounded-lg bg-[var(--background)] border border-[var(--border)] flex items-center justify-center shrink-0 font-semibold text-[10px] text-[var(--color-primary)]">
                      {item.type.substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[var(--foreground)] truncate">{item.title}</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">{item.detail || 'System operation'}</div>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-medium shrink-0 pt-0.5">{date}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-lg">
              <Ticket className="w-8 h-8 text-[var(--border)] mb-2" />
              <p className="text-xs font-semibold">No operational events today</p>
              <p className="text-[10px] max-w-[200px] mt-1 leading-relaxed">Activity will stream here once customers redeem vouchers or earn coins.</p>
            </div>
          )}
        </section>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Active Challenges */}
          <section className="p-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Active Challenges</h3>
            {challengesList.length > 0 ? (
              <div className="space-y-2">
                {challengesList.slice(0, 3).map((c: any) => (
                  <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs hover:border-[var(--color-primary)]/50 transition-colors">
                    <Trophy className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="font-semibold truncate flex-1">{c.name}</span>
                    <span className="text-[9px] text-emerald-600 font-bold">ACTIVE</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-[var(--text-muted)]">No active challenges</p>
            )}
            <Link href="/challenges" className="text-[10px] text-[var(--color-primary)] font-semibold flex items-center gap-1 hover:underline">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </section>

          {/* Recent Audit */}
          <section className="p-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Recent Audit</h3>
            {auditItems.length > 0 ? (
              <div className="space-y-2">
                {auditItems.slice(0, 4).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-[var(--color-primary)]/50 transition-colors">
                    <span className="font-semibold truncate flex-1">{a.action}</span>
                    <span className="text-[9px] text-[var(--text-muted)] shrink-0 ml-2">
                      {new Date(a.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-[var(--text-muted)]">No recent audit entries</p>
            )}
            <Link href="/audit-logs" className="text-[10px] text-[var(--color-primary)] font-semibold flex items-center gap-1 hover:underline">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
