'use client';

import React, { useState } from 'react';
import { useAnalyticsOverview, useAnalyticsDaily, useAnalyticsWeekly, useAnalyticsMonthly } from '@/hooks/useDashboardOps';
import { StatCard } from '@/components/ui/StatCard';
import { Users, DollarSign, ShoppingCart, TrendingUp, Calendar } from 'lucide-react';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview();
  const { data: daily, isLoading: dailyLoading } = useAnalyticsDaily();
  const { data: weekly, isLoading: weeklyLoading } = useAnalyticsWeekly();
  const { data: monthly, isLoading: monthlyLoading } = useAnalyticsMonthly();

  const periodData = period === 'daily' ? daily : period === 'weekly' ? weekly : monthly;
  const periodLoading = period === 'daily' ? dailyLoading : period === 'weekly' ? weeklyLoading : monthlyLoading;

  return (
    <div className="flex flex-col gap-6">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
        <span className="text-sm font-semibold text-[var(--foreground)] mr-2">Period:</span>
        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                period === p
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Customers"
            value={(overview as any).totalCustomers?.toLocaleString() || 0}
            icon={<Users className="w-5 h-5" />}
            loading={overviewLoading}
            trend={(overview as any).customerGrowth ? { value: (overview as any).customerGrowth, direction: (overview as any).customerGrowth > 0 ? 'up' : 'down' } : undefined}
          />
          <StatCard
            title="Revenue"
            value={`$${(overview as any).totalRevenue?.toLocaleString() || 0}`}
            icon={<DollarSign className="w-5 h-5" />}
            loading={overviewLoading}
            trend={(overview as any).revenueGrowth ? { value: (overview as any).revenueGrowth, direction: (overview as any).revenueGrowth > 0 ? 'up' : 'down' } : undefined}
          />
          <StatCard
            title="Orders"
            value={(overview as any).totalOrders?.toLocaleString() || 0}
            icon={<ShoppingCart className="w-5 h-5" />}
            loading={overviewLoading}
            trend={(overview as any).orderGrowth ? { value: (overview as any).orderGrowth, direction: (overview as any).orderGrowth > 0 ? 'up' : 'down' } : undefined}
          />
          <StatCard
            title="Avg Order Value"
            value={`$${(overview as any).avgOrderValue?.toFixed(2) || '0.00'}`}
            icon={<TrendingUp className="w-5 h-5" />}
            loading={overviewLoading}
          />
        </div>
      )}

      {/* Period Analytics */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <h2 className="text-lg font-bold text-[var(--foreground)] mb-4 capitalize">{period} Analytics</h2>

        {periodLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse h-16 bg-[var(--surface-hover)] rounded"></div>
            ))}
          </div>
        ) : periodData && (Array.isArray(periodData) ? periodData.length > 0 : (periodData as any).data?.length > 0) ? (
          <div className="space-y-3">
            {(Array.isArray(periodData) ? periodData : (periodData as any).data || []).slice(0, 10).map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-[var(--background)] border border-[var(--border)]/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {item.date ? new Date(item.date).toLocaleDateString() : `Day ${index + 1}`}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {item.orders || 0} orders • {item.customers || 0} customers
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    ${item.revenue?.toFixed(2) || '0.00'}
                  </p>
                  {item.coinsEarned && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">
                      🪙 {item.coinsEarned} earned
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">No analytics data available for this period</p>
        )}
      </div>

      {/* Additional Metrics */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Coins Distributed</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              🪙 {(overview as any).totalCoinsDistributed?.toLocaleString() || (overview as any).coinsDistributed?.toLocaleString() || 0}
            </p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Rewards Redeemed</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {(overview as any).totalRewardsRedeemed?.toLocaleString() || (overview as any).rewardsRedeemed?.toLocaleString() || 0}
            </p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Active Customers</p>
            <p className="text-2xl font-bold text-[var(--color-primary)]">
              {(overview as any).activeCustomers?.toLocaleString() || (overview as any).customersActive?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
