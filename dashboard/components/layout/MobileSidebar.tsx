'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarItem } from './Sidebar';

function MobileNavItem({ item, pathname, onClose }: { item: SidebarItem, pathname: string, onClose: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  
  const isChildActive = hasChildren && item.children!.some(c => pathname === c.href || pathname.startsWith(c.href));
  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)) || isChildActive;

  if (hasChildren) {
    return (
      <div className="flex flex-col gap-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors',
            isActive || isOpen
              ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
          )}
        >
          <div className="flex items-center gap-3">
            {item.icon}
            <span>{item.name}</span>
          </div>
          <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
        </button>
        {isOpen && (
          <div className="flex flex-col gap-1 pl-9 mt-1">
            {item.children!.map(child => {
              const childActive = pathname === child.href;
              return (
                <Link
                  key={child.name}
                  href={child.href}
                  onClick={onClose}
                  className={cn(
                    'block px-3 py-2 rounded-md text-[11px] font-bold transition-colors',
                    childActive 
                      ? 'bg-[var(--color-primary)] text-white' 
                      : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                  )}
                >
                  {child.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors',
        isActive
          ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
          : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {item.icon}
      <span className="flex-1">{item.name}</span>
      {item.badge !== undefined && (
        <span
          className={cn(
            'px-2 py-0.5 text-[10px] font-bold rounded-full',
            isActive
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

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
          {menuItems.map((item) => (
            <MobileNavItem key={item.name} item={item} pathname={pathname} onClose={onClose} />
          ))}

          {/* Bottom items */}
          {bottomItems.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[var(--border)]/50 flex flex-col gap-1">
              {bottomItems.map((item) => (
                <MobileNavItem key={item.name} item={item} pathname={pathname} onClose={onClose} />
              ))}
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}
