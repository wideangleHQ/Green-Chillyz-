'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Megaphone, Tag, Trophy, Coins } from 'lucide-react';

function TabSkeleton() {
  return (
    <div className="py-20 flex flex-col items-center gap-3 animate-pulse">
      <div className="h-6 w-48 bg-zinc-100 dark:bg-zinc-800 rounded" />
      <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded" />
    </div>
  );
}

const CampaignsModule = dynamic(() => import('../campaigns/page'), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

const OffersModule = dynamic(() => import('../offers/page'), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

const ChallengesModule = dynamic(() => import('../challenges/page'), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

const CoinEconomyModule = dynamic(() => import('../coin-economy/page'), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

const tabs = [
  { id: 'campaigns', label: 'Campaigns', icon: <Megaphone className="w-4 h-4" /> },
  { id: 'offers', label: 'Offers', icon: <Tag className="w-4 h-4" /> },
  { id: 'challenges', label: 'Challenges', icon: <Trophy className="w-4 h-4" /> },
  { id: 'coin-economy', label: 'Coin Economy', icon: <Coins className="w-4 h-4" /> },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<TabId>('campaigns');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Marketing</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Manage campaigns, promotional offers, challenges, and coin economy.
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
        {activeTab === 'campaigns' && <CampaignsModule />}
        {activeTab === 'offers' && <OffersModule />}
        {activeTab === 'challenges' && <ChallengesModule />}
        {activeTab === 'coin-economy' && <CoinEconomyModule />}
      </div>
    </div>
  );
}
