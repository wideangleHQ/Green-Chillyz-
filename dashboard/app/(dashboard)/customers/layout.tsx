'use client';

import React from 'react';
import { Tabs } from '@/components/ui/Tabs';
import { Users, Wallet, Gift, TrendingUp, Bell } from 'lucide-react';

const tabs = [
  { label: 'Customer List', href: '/customers', icon: <Users className="w-4 h-4" /> },
  { label: 'Wallet History', href: '/customers/wallet-history', icon: <Wallet className="w-4 h-4" /> },
  { label: 'Reward History', href: '/customers/reward-history', icon: <Gift className="w-4 h-4" /> },
  { label: 'Customer Journey', href: '/customers/journey', icon: <TrendingUp className="w-4 h-4" /> },
  { label: 'Notifications', href: '/customers/notifications', icon: <Bell className="w-4 h-4" /> },
];

export default function CustomersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Customer Management</h1>
        <p className="text-sm text-[var(--text-muted)]">
          View and manage customer profiles, wallet activity, rewards, journey analytics, and communications
        </p>
      </div>

      <Tabs tabs={tabs} />

      <div>{children}</div>
    </div>
  );
}
