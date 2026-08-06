'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Gift, Ticket, Wallet, Layers, GitBranch, Target } from 'lucide-react';

function TabSkeleton() {
  return (
    <div className="py-20 flex flex-col items-center gap-3 animate-pulse">
      <div className="h-6 w-48 bg-zinc-100 dark:bg-zinc-800 rounded" />
      <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded" />
    </div>
  );
}

const RewardsModule = dynamic(() => import('../rewards/page'), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

const VouchersModule = dynamic(() => import('../vouchers/page'), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

const WalletModule = dynamic(() => import('../wallet/page'), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

const RewardProfilesModule = dynamic(() => import('../reward-profiles/page'), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

const RewardRulesModule = dynamic(() => import('../reward-rules/page'), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

const RewardOverridesModule = dynamic(() => import('../reward-overrides/page'), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

const tabs = [
  { id: 'rewards', label: 'Rewards Catalog', icon: <Gift className="w-4 h-4" /> },
  { id: 'profiles', label: 'Reward Profiles', icon: <Layers className="w-4 h-4" /> },
  { id: 'rules', label: 'Reward Rules', icon: <GitBranch className="w-4 h-4" /> },
  { id: 'overrides', label: 'Overrides', icon: <Target className="w-4 h-4" /> },
  { id: 'vouchers', label: 'Vouchers', icon: <Ticket className="w-4 h-4" /> },
  { id: 'wallet', label: 'Wallet', icon: <Wallet className="w-4 h-4" /> },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('rewards');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Operations</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Manage rewards, vouchers, wallet transactions, and store operations.
        </p>
      </div>

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

      <div>
        {activeTab === 'rewards' && <RewardsModule />}
        {activeTab === 'profiles' && <RewardProfilesModule />}
        {activeTab === 'rules' && <RewardRulesModule />}
        {activeTab === 'overrides' && <RewardOverridesModule />}
        {activeTab === 'vouchers' && <VouchersModule />}
        {activeTab === 'wallet' && <WalletModule />}
      </div>
    </div>
  );
}
