'use client';

import React from 'react';
import { Tabs } from '@/components/ui/Tabs';
import { Gift, FileText, Settings, Eye, History, Layers } from 'lucide-react';

const tabs = [
  { label: 'Overview', href: '/operations/rewards', icon: <Layers className="w-4 h-4" /> },
  { label: 'Profiles', href: '/operations/rewards/profiles', icon: <FileText className="w-4 h-4" /> },
  { label: 'Rules', href: '/operations/rewards/rules', icon: <Settings className="w-4 h-4" /> },
  { label: 'Overrides', href: '/operations/rewards/overrides', icon: <Gift className="w-4 h-4" /> },
  { label: 'Preview', href: '/operations/rewards/preview', icon: <Eye className="w-4 h-4" /> },
  { label: 'History', href: '/operations/rewards/history', icon: <History className="w-4 h-4" /> },
];

export default function RewardsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Rewards Management</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Configure and manage reward profiles, rules, store-specific overrides, and preview customer rewards
        </p>
      </div>

      <Tabs tabs={tabs} />

      <div>{children}</div>
    </div>
  );
}
