'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Users, Wallet, Sparkles, Map, Bell, Search, Package } from 'lucide-react';
import { useRewardSearch } from '@/hooks/useRewardManagement';

// ---------------------------------------------------------------------------
// Tab Skeleton (shown while dynamic modules load)
// ---------------------------------------------------------------------------
function TabSkeleton() {
  return (
    <div className="py-20 flex flex-col items-center gap-3 animate-pulse">
      <div className="h-6 w-48 bg-zinc-100 dark:bg-zinc-800 rounded" />
      <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dynamically imported existing page modules
// ---------------------------------------------------------------------------
const CustomersModule = dynamic(() => import('../customers/page'), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

const WalletModule = dynamic(() => import('../wallet/page'), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

const NotificationsModule = dynamic(() => import('../notifications/page'), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

const CustomerJourneyModule = dynamic(() => import('../customer-journey/page'), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

// ---------------------------------------------------------------------------
// Reward History Panel (inline, uses useRewardSearch hook)
// ---------------------------------------------------------------------------
function RewardHistoryPanel() {
  const [query, setQuery] = useState('');
  const { data, isLoading, isError } = useRewardSearch(query ? { q: query } : undefined);

  const rewards: any[] = data?.data ?? data ?? [];

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search rewards by customer name, phone, or reward..."
          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[var(--border)]/20 bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/40 transition-all"
        />
      </div>

      {/* Results */}
      {!query && (
        <div className="py-16 flex flex-col items-center gap-2 text-[var(--text-muted)]">
          <Sparkles className="w-8 h-8 opacity-40" />
          <p className="text-xs">Enter a search term to look up reward history</p>
        </div>
      )}

      {query && isLoading && (
        <div className="py-16 flex flex-col items-center gap-2 animate-pulse">
          <div className="h-5 w-40 bg-zinc-100 dark:bg-zinc-800 rounded" />
          <div className="h-4 w-28 bg-zinc-100 dark:bg-zinc-800 rounded" />
        </div>
      )}

      {query && isError && (
        <div className="py-16 flex flex-col items-center gap-2 text-red-500">
          <p className="text-xs">Failed to load reward data. Please try again.</p>
        </div>
      )}

      {query && !isLoading && !isError && rewards.length === 0 && (
        <div className="py-16 flex flex-col items-center gap-2 text-[var(--text-muted)]">
          <Package className="w-8 h-8 opacity-40" />
          <p className="text-xs">No rewards found for &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {query && !isLoading && !isError && rewards.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]/10">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)]/10 bg-[var(--surface)]">
                <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)]">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)]">Reward</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)]">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)]">Date</th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((reward: any, idx: number) => (
                <tr
                  key={reward.id ?? idx}
                  className="border-b border-[var(--border)]/5 hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <td className="px-4 py-3 text-[var(--foreground)]">
                    {reward.customerName ?? reward.customer?.name ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-[var(--foreground)]">
                    {reward.rewardName ?? reward.name ?? reward.title ?? '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        reward.status === 'REDEEMED'
                          ? 'bg-green-500/10 text-green-600'
                          : reward.status === 'EXPIRED'
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-yellow-500/10 text-yellow-600'
                      }`}
                    >
                      {reward.status ?? '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {reward.createdAt
                      ? new Date(reward.createdAt).toLocaleDateString()
                      : reward.date ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
const tabs = [
  { id: 'customers', label: 'Customer List', icon: <Users className="w-4 h-4" /> },
  { id: 'wallet', label: 'Wallet History', icon: <Wallet className="w-4 h-4" /> },
  { id: 'rewards', label: 'Reward History', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'journey', label: 'Customer Journey', icon: <Map className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
] as const;

type TabId = (typeof tabs)[number]['id'];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function CustomersHubPage() {
  const [activeTab, setActiveTab] = useState<TabId>('customers');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
          Customer Management
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Manage customers, wallets, rewards, journeys, and notifications in one place.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-[var(--border)]/10 pb-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold cursor-pointer transition-all whitespace-nowrap text-xs ${
              activeTab === tab.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div>
        {activeTab === 'customers' && <CustomersModule />}
        {activeTab === 'wallet' && <WalletModule />}
        {activeTab === 'rewards' && <RewardHistoryPanel />}
        {activeTab === 'journey' && <CustomerJourneyModule />}
        {activeTab === 'notifications' && <NotificationsModule />}
      </div>
    </div>
  );
}
