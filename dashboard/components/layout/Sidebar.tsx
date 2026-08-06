'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | string;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  menuItems: SidebarItem[];
  bottomItems?: SidebarItem[];
  className?: string;
}

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  menuItems,
  bottomItems = [],
  className,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-[var(--border)] bg-[var(--surface)] shrink-0 transition-all duration-200 relative',
        isCollapsed ? 'w-[70px]' : 'w-[250px]',
        className
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 justify-between border-b border-[var(--border)]">
        <div className="flex items-center gap-3 overflow-hidden">
          <img
            src="/logo.png"
            alt="GreenChillyz Logo"
            className="h-8 w-8 object-contain shrink-0"
          />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-heading text-sm uppercase tracking-wide truncate font-bold">
                GreenChillyz
              </span>
              <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-widest">
                Portal
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={cn(
              'w-4 h-4 transition-transform duration-200',
              isCollapsed && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Navigation Scroll */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col">
        <nav className="flex flex-col gap-1" role="navigation">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors relative group',
                  active
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                )}
                title={isCollapsed ? item.name : undefined}
                aria-current={active ? 'page' : undefined}
              >
                <span className={cn(active && 'text-[var(--color-primary)]')}>
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate">{item.name}</span>
                    {item.badge !== undefined && (
                      <span
                        className={cn(
                          'px-2 py-0.5 text-[10px] font-bold rounded-full',
                          active
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-md text-xs font-medium text-[var(--foreground)] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-md">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section links */}
        {bottomItems.length > 0 && (
          <div className="mt-auto pt-4 border-t border-[var(--border)]/50">
            <nav className="flex flex-col gap-1" role="navigation" aria-label="Secondary navigation">
              {bottomItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors relative group',
                      active
                        ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                    )}
                    title={isCollapsed ? item.name : undefined}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.icon}
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                    
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <span className="absolute left-full ml-2 px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-md text-xs font-medium text-[var(--foreground)] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-md">
                        {item.name}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </aside>
  );
}
