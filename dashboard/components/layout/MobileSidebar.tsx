'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarItem } from './Sidebar';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: SidebarItem[];
  bottomItems?: SidebarItem[];
}

export function MobileSidebar({
  isOpen,
  onClose,
  menuItems,
  bottomItems = [],
}: MobileSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div className="relative w-[280px] bg-[var(--surface)] border-r border-[var(--border)] h-full flex flex-col shadow-lg animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
            <div className="flex flex-col">
              <span className="font-heading text-sm uppercase tracking-wide font-bold">
                GreenChillyz
              </span>
              <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-widest">
                Portal
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1" role="navigation">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors',
                  active
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                )}
                aria-current={active ? 'page' : undefined}
              >
                {item.icon}
                <span className="flex-1">{item.name}</span>
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
              </Link>
            );
          })}

          {/* Bottom items */}
          {bottomItems.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[var(--border)]/50 flex flex-col gap-1">
              {bottomItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      active
                        ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}
