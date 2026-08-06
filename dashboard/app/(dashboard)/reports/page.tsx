'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3, FileText } from 'lucide-react';

function TabSkeleton() {
  return (
    <div className="py-20 flex flex-col items-center gap-3 animate-pulse">
      <div className="h-6 w-48 bg-zinc-100 dark:bg-zinc-800 rounded" />
      <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded" />
    </div>
  );
}

const AnalyticsModule = dynamic(() => import('../analytics/page'), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

const AuditLogsModule = dynamic(() => import('../audit-logs/page'), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

const tabs = [
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'audit-logs', label: 'Audit Logs', icon: <FileText className="w-4 h-4" /> },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('analytics');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Reports</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          View analytics dashboards and audit trail history.
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
        {activeTab === 'analytics' && <AnalyticsModule />}
        {activeTab === 'audit-logs' && <AuditLogsModule />}
      </div>
    </div>
  );
}
