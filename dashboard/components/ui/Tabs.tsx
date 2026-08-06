'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Tab {
  label: string;
  href: string;
  count?: number;
  icon?: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  className?: string;
}

export function Tabs({ tabs, className }: TabsProps) {
  const pathname = usePathname();

  return (
    <div className={cn('border-b border-[var(--border)]', className)}>
      <nav className="flex gap-1 overflow-x-auto scrollbar-none -mb-px" role="tablist">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
          
          if (tab.disabled) {
            return (
              <div
                key={tab.href}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent text-[var(--text-muted)] opacity-50 cursor-not-allowed whitespace-nowrap"
              >
                {tab.icon}
                <span>{tab.label}</span>
                {typeof tab.count !== 'undefined' && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[var(--surface-hover)] text-[var(--text-muted)]">
                    {tab.count}
                  </span>
                )}
              </div>
            );
          }
          
          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 rounded-t-md',
                isActive
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--foreground)] hover:border-[var(--border)]'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count !== 'undefined' && (
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs font-semibold rounded-full transition-colors',
                    isActive
                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
