'use client';

import React, { Fragment } from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export function Breadcrumb({ items, className, showHome = true }: BreadcrumbProps) {
  const allItems = showHome
    ? [{ name: 'Home', href: '/', icon: <Home className="w-3 h-3" /> }, ...items]
    : items;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1.5 text-xs font-medium', className)}
    >
      <ol className="flex items-center gap-1.5">
        {allItems.map((item, idx) => {
          const isLast = idx === allItems.length - 1;

          return (
            <Fragment key={item.href}>
              <li className="flex items-center gap-1.5">
                {isLast ? (
                  <span
                    className="flex items-center gap-1.5 text-[var(--foreground)] font-semibold"
                    aria-current="page"
                  >
                    {item.icon}
                    <span className="truncate max-w-[150px] sm:max-w-[200px]">{item.name}</span>
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    {item.icon}
                    <span className="truncate max-w-[100px] sm:max-w-[150px]">{item.name}</span>
                  </Link>
                )}
              </li>

              {!isLast && (
                <li aria-hidden="true">
                  <ChevronRight className="w-3 h-3 text-[var(--border)]" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
