'use client';

import React from 'react';
import { Tabs } from '@/components/ui/Tabs';
import { BarChart3, FileText } from 'lucide-react';

const tabs = [
  { label: 'Analytics', href: '/reports/analytics', icon: <BarChart3 className="w-4 h-4" /> },
  { label: 'Audit Logs', href: '/reports/audit-logs', icon: <FileText className="w-4 h-4" /> },
];

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Reports & Analytics</h1>
        <p className="text-sm text-[var(--text-muted)]">
          View store performance analytics and audit trail of all system activities
        </p>
      </div>

      <Tabs tabs={tabs} />

      <div>{children}</div>
    </div>
  );
}
