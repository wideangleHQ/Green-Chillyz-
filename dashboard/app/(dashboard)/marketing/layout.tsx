'use client';

import React from 'react';
import { Tabs } from '@/components/ui/Tabs';
import { Megaphone, Coins, Trophy, Tag, Sparkles } from 'lucide-react';

const tabs = [
  { label: 'Campaigns', href: '/marketing/campaigns', icon: <Megaphone className="w-4 h-4" /> },
  { label: 'Coin Economy', href: '/marketing/coin-economy', icon: <Coins className="w-4 h-4" /> },
  { label: 'Challenges', href: '/marketing/challenges', icon: <Trophy className="w-4 h-4" /> },
  { label: 'Offers', href: '/marketing/offers', icon: <Tag className="w-4 h-4" /> },
  { label: 'Active Promotions', href: '/marketing/active', icon: <Sparkles className="w-4 h-4" /> },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Marketing & Promotions</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Manage campaigns, configure coin earning rules, create challenges, and monitor active promotional activities
        </p>
      </div>

      <Tabs tabs={tabs} />

      <div>{children}</div>
    </div>
  );
}
