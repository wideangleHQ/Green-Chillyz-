'use client';

import React from 'react';
import { Tabs } from '@/components/ui/Tabs';
import { Store, Settings } from 'lucide-react';

const tabs = [
  { label: 'Store', href: '/administration/store', icon: <Store className="w-4 h-4" /> },
  { label: 'Settings', href: '/administration/settings', icon: <Settings className="w-4 h-4" /> },
];

export default function AdministrationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Administration</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Manage store information, operating hours, facilities, staff, and system settings
        </p>
      </div>

      <Tabs tabs={tabs} />

      <div>{children}</div>
    </div>
  );
}
