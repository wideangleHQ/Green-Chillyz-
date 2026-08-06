'use client';

import React, { useState } from 'react';
import { useAnalyticsOverview, useAnalyticsDaily, useAnalyticsWeekly, useAnalyticsMonthly } from '@/hooks/useDashboardOps';
import { BarChart3, TrendingUp, Users, Wallet, Ticket, Bell, Gamepad2, Calendar, RefreshCw, Layers } from 'lucide-react';

export default function AnalyticsDashboard() {
  // Granularity selector: 'daily' (7 days), 'weekly' (8 weeks), 'monthly' (6 months)
  const [range, setRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Queries
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useAnalyticsOverview();
  const { data: dailySeries, isLoading: dailyLoading, refetch: refetchDaily } = useAnalyticsDaily();
  const { data: weeklySeries, isLoading: weeklyLoading, refetch: refetchWeekly } = useAnalyticsWeekly();
  const { data: monthlySeries, isLoading: monthlyLoading, refetch: refetchMonthly } = useAnalyticsMonthly();

  const handleRefreshAll = () => {
    refetchOverview();
    refetchDaily();
    refetchWeekly();
    refetchMonthly();
  };

  const getActiveSeriesData = () => {
    if (range === 'daily') return dailySeries;
    if (range === 'weekly') return weeklySeries;
    return monthlySeries;
  };

  const activeSeries = getActiveSeriesData();
  const isSeriesLoading = dailyLoading || weeklyLoading || monthlyLoading;

  // Mini Chart Rendering Helper
  const renderSVGLineChart = (data: number[], width = 500, height = 150) => {
    if (!data || data.length === 0) return null;
    const maxVal = Math.max(...data, 10);
    const minVal = Math.min(...data, 0);
    const rangeVal = maxVal - minVal;

    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * (width - 40) + 20;
      const y = height - ((val - minVal) / rangeVal) * (height - 40) - 20;
      return `${x},${y}`;
    });

    const pathD = `M ${points.join(' L ')}`;
    // Fill area below line
    const areaD = `${pathD} L ${width - 20},${height - 10} L 20,${height - 10} Z`;

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible text-xs select-none">
        {/* Grid lines */}
        <line x1="20" y1="20" x2={width - 20} y2="20" stroke="rgba(0,107,42,0.05)" strokeDasharray="3" />
        <line x1="20" y1={height / 2} x2={width - 20} y2={height / 2} stroke="rgba(0,107,42,0.05)" strokeDasharray="3" />
        <line x1="20" y1={height - 20} x2={width - 20} y2={height - 20} stroke="rgba(0,107,42,0.1)" />

        {/* Gradient fill */}
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaD} fill="url(#chartGrad)" />

        {/* Line plot */}
        <path d={pathD} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Value dot markers */}
        {data.map((val, idx) => {
          const x = (idx / (data.length - 1)) * (width - 40) + 20;
          const y = height - ((val - minVal) / rangeVal) * (height - 40) - 20;
          return (
            <g key={idx} className="group">
              <circle cx={x} cy={y} r="4" fill="var(--surface)" stroke="var(--color-primary)" strokeWidth="2.5" />
              <text x={x} y={y - 8} textAnchor="middle" className="hidden group-hover:block font-bold fill-[var(--foreground)] text-[10px]">
                {val}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // Mini Chart Rendering Helper (Bars)
  const renderSVGBarChart = (data: { credits: number; debits: number }[], width = 500, height = 150) => {
    if (!data || data.length === 0) return null;
    const values = [...data.map(d => d.credits), ...data.map(d => d.debits)];
    const maxVal = Math.max(...values, 10);
    const minVal = 0;
    const rangeVal = maxVal - minVal;

    const numGroups = data.length;
    const groupWidth = (width - 40) / numGroups;
    const barWidth = groupWidth * 0.35;

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible text-xs select-none">
        {/* Grid lines */}
        <line x1="20" y1="20" x2={width - 20} y2="20" stroke="rgba(0,107,42,0.05)" strokeDasharray="3" />
        <line x1="20" y1={height / 2} x2={width - 20} y2={height / 2} stroke="rgba(0,107,42,0.05)" strokeDasharray="3" />
        <line x1="20" y1={height - 20} x2={width - 20} y2={height - 20} stroke="rgba(0,107,42,0.1)" />

        {data.map((item, idx) => {
          const groupX = 20 + idx * groupWidth;
          const creditsH = ((item.credits - minVal) / rangeVal) * (height - 40);
          const debitsH = ((item.debits - minVal) / rangeVal) * (height - 40);

          const creditsY = height - 20 - creditsH;
          const debitsY = height - 20 - debitsH;

          return (
            <g key={idx}>
              {/* Credit Bar */}
              <rect
                x={groupX + groupWidth * 0.1}
                y={creditsY}
                width={barWidth}
                height={creditsH}
                fill="var(--color-primary)"
                rx="2"
                className="opacity-90 hover:opacity-100 transition-opacity"
              />
              {/* Debit Bar */}
              <rect
                x={groupX + groupWidth * 0.1 + barWidth + 2}
                y={debitsY}
                width={barWidth}
                height={debitsH}
                fill="var(--color-error, #ba1a1a)"
                rx="2"
                className="opacity-80 hover:opacity-100 transition-opacity"
              />
            </g>
          );
        })}
      </svg>
    );
  };

  const getBucketLabel = (dateStr: string, idx: number) => {
    const d = new Date(dateStr);
    if (range === 'daily') {
      return d.toLocaleDateString(undefined, { weekday: 'short' });
    }
    if (range === 'weekly') {
      return `W${idx + 1}`;
    }
    return d.toLocaleDateString(undefined, { month: 'short' });
  };

  return (
    <div className="flex flex-col gap-6 select-none text-xs">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[var(--border)]/10 pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Executive Operations Analytics</h1>
          <p className="text-xs text-[var(--text-muted)]">
            Analyze customer growth counts, coin distributions, game session launches, and voucher redemptions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Granularity switch */}
          <div className="flex border border-[var(--border)]/10 bg-[var(--surface)] p-1 rounded-lg">
            {(['daily', 'weekly', 'monthly'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                  range === r
                    ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {r.replace('ly', '')}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefreshAll}
            className="p-2 border border-[var(--border)]/10 bg-[var(--surface)] hover:bg-[var(--surface-hover)] rounded-lg text-[var(--text-muted)] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TODAY LIVE OVERVIEW TOTALS */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>Today's Accumulated Totals</span>
        </h2>

        {overviewLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : overview ? (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            <div className="p-4 rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft">
              <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider block">New Customers</span>
              <span className="text-lg font-bold text-[var(--foreground)] block mt-1">{overview.newCustomers}</span>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft">
              <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider block">Coins Credited</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 block mt-1">+{overview.walletCredits.total}</span>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft">
              <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider block">Coins Redeemed</span>
              <span className="text-lg font-bold text-red-500 block mt-1">-{overview.walletDebits.total}</span>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft">
              <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider block">Voucher Redeems</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 block mt-1">{overview.voucherRedemptions}</span>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft">
              <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider block">Games Played</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400 block mt-1">{overview.gamePlays}</span>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft">
              <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider block">Alerts Dispatched</span>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400 block mt-1">{overview.notifications}</span>
            </div>
          </div>
        ) : null}
      </section>

      {/* SERIES ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: CUSTOMER GROWTH TREND */}
        <section className="p-6 rounded-2xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight">Customer Growth Trend</h3>
            <p className="text-[11px] text-[var(--text-muted)]">Roster sign-ups scoped to this branch</p>
          </div>

          {isSeriesLoading ? (
            <div className="h-[150px] bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          ) : activeSeries ? (
            <div className="flex flex-col gap-4">
              {renderSVGLineChart(activeSeries.series.map(s => s.newCustomers))}
              
              {/* X-Axis labels */}
              <div className="flex justify-between px-5 text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-[-8px]">
                {activeSeries.series.map((s, idx) => (
                  <span key={idx}>{getBucketLabel(s.bucketStart, idx)}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--text-muted)]">No trend data available.</div>
          )}
        </section>

        {/* CHART 2: COINS DISTRIBUTION (CREDIT VS DEBIT) */}
        <section className="p-6 rounded-2xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold tracking-tight">Coins Ledger Transactions</h3>
              <p className="text-[11px] text-[var(--text-muted)]">Comparison of credited (Green) vs debited (Red) coins</p>
            </div>
            <div className="flex gap-3 text-[10px] font-semibold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[var(--color-primary)]" />Credits</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-600" />Debits</span>
            </div>
          </div>

          {isSeriesLoading ? (
            <div className="h-[150px] bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          ) : activeSeries ? (
            <div className="flex flex-col gap-4">
              {renderSVGBarChart(
                activeSeries.series.map(s => ({
                  credits: s.walletCredits.total,
                  debits: s.walletDebits.total,
                }))
              )}
              
              {/* X-Axis labels */}
              <div className="flex justify-between px-5 text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-[-8px]">
                {activeSeries.series.map((s, idx) => (
                  <span key={idx}>{getBucketLabel(s.bucketStart, idx)}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--text-muted)]">No trend data available.</div>
          )}
        </section>

        {/* CHART 3: VOUCHER REDEMPTION HISTOGRAM */}
        <section className="p-6 rounded-2xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight">Reward Voucher Redemptions</h3>
            <p className="text-[11px] text-[var(--text-muted)]">Staff verified voucher redemption counts</p>
          </div>

          {isSeriesLoading ? (
            <div className="h-[150px] bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          ) : activeSeries ? (
            <div className="flex flex-col gap-4">
              {renderSVGLineChart(activeSeries.series.map(s => s.voucherRedemptions))}
              
              {/* X-Axis labels */}
              <div className="flex justify-between px-5 text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-[-8px]">
                {activeSeries.series.map((s, idx) => (
                  <span key={idx}>{getBucketLabel(s.bucketStart, idx)}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--text-muted)]">No trend data available.</div>
          )}
        </section>

        {/* CHART 4: GAMEPLAY ENGAGEMENT HISTOGRAM */}
        <section className="p-6 rounded-2xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight">Game Session Plays</h3>
            <p className="text-[11px] text-[var(--text-muted)]">Daily game plays across store customers</p>
          </div>

          {isSeriesLoading ? (
            <div className="h-[150px] bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          ) : activeSeries ? (
            <div className="flex flex-col gap-4">
              {renderSVGLineChart(activeSeries.series.map(s => s.gamePlays))}
              
              {/* X-Axis labels */}
              <div className="flex justify-between px-5 text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-[-8px]">
                {activeSeries.series.map((s, idx) => (
                  <span key={idx}>{getBucketLabel(s.bucketStart, idx)}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--text-muted)]">No trend data available.</div>
          )}
        </section>

      </div>

    </div>
  );
}
