'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Store, Settings, Bell } from 'lucide-react';

function TabSkeleton() {
  return (
    <div className="py-20 flex flex-col items-center gap-3 animate-pulse">
      <div className="h-6 w-48 bg-zinc-100 dark:bg-zinc-800 rounded" />
      <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded" />
    </div>
  );
}

const StoresModule = dynamic(() => import('../stores/page'), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

const SettingsModule = dynamic(() => import('../settings/page'), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

const NotificationsModule = dynamic(() => import('../notifications/page'), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

const tabs = [
  { id: 'stores', label: 'Stores', icon: <Store className="w-4 h-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function AdministrationPage() {
  const [activeTab, setActiveTab] = useState<TabId>('stores');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Administration</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Manage stores, system settings, and notification configuration.
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
        {activeTab === 'stores' && <StoresModule />}
        {activeTab === 'settings' && <SettingsModule />}
        {activeTab === 'notifications' && <NotificationsModule />}
      </div>
    </div>
  );
}
