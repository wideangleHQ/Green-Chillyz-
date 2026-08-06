'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, Search, Bell, Store, LogOut, User, Shield, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Breadcrumb, BreadcrumbItem } from '../ui/Breadcrumb';

interface StoreInfo {
  storeName: string;
  role: string;
  city: string;
  state: string;
}

interface HeaderProps {
  onMenuClick: () => void;
  onSearchClick: () => void;
  breadcrumbs: BreadcrumbItem[];
  store: StoreInfo;
  unreadCount?: number;
  onLogout: () => void;
  className?: string;
}

export function Header({
  onMenuClick,
  onSearchClick,
  breadcrumbs,
  store,
  unreadCount = 0,
  onLogout,
  className,
}: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header
      className={cn(
        'h-16 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md sticky top-0 z-50 px-4 md:px-6 flex items-center justify-between shadow-sm',
        className
      )}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Mobile Menu Trigger */}
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors md:hidden"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Navigation */}
        <div className="hidden sm:block flex-1 min-w-0">
          <Breadcrumb items={breadcrumbs} showHome={false} />
        </div>
      </div>

      {/* Right Section Tools */}
      <div className="flex items-center gap-3">
        {/* Search Trigger (Ctrl+K) */}
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2.5 px-3 py-1.5 border border-[var(--border)] rounded-md bg-[var(--input-bg)] hover:bg-[var(--surface-hover)] text-xs text-[var(--text-muted)] transition-colors w-full sm:w-auto max-w-[180px] sm:max-w-[200px]"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline truncate">Search...</span>
          <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[var(--surface)] border border-[var(--border)] rounded text-[9px] font-semibold">
            ⌘K
          </kbd>
        </button>

        {/* Notification Bell */}
        <Link
          href="/notifications"
          className="p-2 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors relative"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-[var(--color-error)] text-white text-[9px] font-bold rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Store Information (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-md text-xs font-semibold">
          <Store className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          <span className="text-[var(--foreground)] truncate max-w-[120px]">
            {store.storeName}
          </span>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-9 h-9 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/15 transition-colors"
            aria-label="User menu"
            aria-expanded={profileOpen}
          >
            {store.storeName.substring(0, 2).toUpperCase()}
          </button>

          {profileOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileOpen(false)}
                aria-hidden="true"
              />

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-64 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg p-2 z-50 animate-fade-in">
                {/* Store Info */}
                <div className="px-3 py-2.5 border-b border-[var(--border)] space-y-1">
                  <div className="font-bold text-sm text-[var(--foreground)] truncate">
                    {store.storeName}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                    Role: {store.role}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-primary)] font-semibold mt-1.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {store.city}, {store.state}
                    </span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1 space-y-0.5">
                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <User className="w-4 h-4 text-[var(--text-muted)]" />
                    <span>Profile Settings</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <Shield className="w-4 h-4 text-[var(--text-muted)]" />
                    <span>Security & Sessions</span>
                  </Link>
                </div>

                {/* Sign Out */}
                <div className="border-t border-[var(--border)] pt-1 mt-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onLogout();
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-xs font-semibold text-[var(--color-error)] hover:bg-[var(--color-error)]/5 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
