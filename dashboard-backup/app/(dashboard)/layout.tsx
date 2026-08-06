'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useDashboardAuth } from '@/components/providers/AuthProvider';
import { useUnreadNotificationsCount } from '@/hooks/useDashboardOps';
import { ThemeSelector } from '@/components/ui/ThemeSelector';
import { CommandPalette } from '@/components/CommandPalette';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Ticket,
  Bell,
  Store,
  BarChart3,
  FileText,
  Megaphone,
  Percent,
  Settings,
  ChevronLeft,
  Menu,
  X,
  Search,
  LogOut,
  User,
  Shield,
  MapPin,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { store, logout, isLoading } = useDashboardAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { data: unreadData } = useUnreadNotificationsCount();

  // Command Palette global keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync route shifts to close mobile drawer
  useEffect(() => {
    setIsMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  if (isLoading || !store) {
    return null;
  }

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
    { name: 'Customers', href: '/customers', icon: <Users className="w-4 h-4 shrink-0" /> },
    { name: 'Wallet', href: '/wallet', icon: <Wallet className="w-4 h-4 shrink-0" /> },
    { name: 'Rewards', href: '/rewards', icon: <Sparkles className="w-4 h-4 shrink-0" /> },
    { name: 'Voucher Redemption', href: '/vouchers', icon: <Ticket className="w-4 h-4 shrink-0" /> },
    { name: 'Notifications', href: '/notifications', icon: <Bell className="w-4 h-4 shrink-0" /> },
    { name: 'Stores', href: '/stores', icon: <Store className="w-4 h-4 shrink-0" /> },
    { name: 'Analytics', href: '/analytics', icon: <BarChart3 className="w-4 h-4 shrink-0" /> },
    { name: 'Audit Logs', href: '/audit-logs', icon: <FileText className="w-4 h-4 shrink-0" /> },
    { name: 'Campaigns', href: '/campaigns', icon: <Megaphone className="w-4 h-4 shrink-0" /> },
    { name: 'Offers', href: '/offers', icon: <Percent className="w-4 h-4 shrink-0" /> },
    { name: 'Settings', href: '/settings', icon: <Settings className="w-4 h-4 shrink-0" /> },
  ];

  const bottomItems: typeof menuItems = [];

  // Derive breadcrumbs based on routing
  const getBreadcrumbs = () => {
    if (pathname === '/') return [{ name: 'Store Operations', href: '/' }];
    const parts = pathname.split('/').filter(Boolean);
    return [
      { name: 'Operations', href: '/' },
      ...parts.map((part, index) => {
        const url = '/' + parts.slice(0, index + 1).join('/');
        return {
          name: part.charAt(0).toUpperCase() + part.slice(1).replace('-', ' '),
          href: url,
        };
      }),
    ];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex select-none">
      
      {/* ─── SIDEBAR: DESKTOP ─── */}
      <aside
        className={`hidden md:flex flex-col border-r border-[var(--border)] bg-[var(--surface)] shrink-0 transition-all duration-200 relative ${
          isCollapsed ? 'w-[70px]' : 'w-[250px]'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-4 justify-between border-b border-[var(--border)]">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src="/logo.png" alt="GreenChillyz Logo" className="h-8 w-8 object-contain shrink-0" />
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-heading text-sm uppercase tracking-wide truncate">GreenChillyz</span>
                <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-widest mt-[-2px]">
                  Portal
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation Scroll */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-6">
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all relative ${
                    isActive
                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  {item.icon}
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section links */}
          <div className="mt-auto flex flex-col gap-1 pt-4 border-t border-[var(--border)]/10">
            {bottomItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                title={isCollapsed ? item.name : undefined}
              >
                {item.icon}
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* ─── SIDEBAR: MOBILE DRAWER ─── */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-999 flex md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsMobileOpen(false)} />
          {/* Menu Panel */}
          <div className="relative w-[280px] bg-[var(--surface)] border-r border-[var(--border)] h-full flex flex-col p-4 gap-4 animate-slide-in">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Logo" className="h-8 object-contain" />
                <span className="font-heading text-sm uppercase tracking-wide">GreenChillyz</span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto flex flex-col gap-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                      isActive
                        ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              <div className="mt-6 pt-4 border-t border-[var(--border)]/10 flex flex-col gap-1">
                {bottomItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[var(--text-muted)]"
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Sticky Top Header */}
        <header className="h-16 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md sticky top-0 z-50 px-4 md:px-6 flex items-center justify-between shadow-soft">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] md:hidden cursor-pointer"
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Navigation */}
            <nav className="hidden sm:flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
              {breadcrumbs.map((bc, idx) => (
                <React.Fragment key={bc.href}>
                  {idx > 0 && <span className="text-[var(--border)] font-normal">/</span>}
                  <Link
                    href={bc.href}
                    className={`transition-colors hover:text-[var(--foreground)] ${
                      idx === breadcrumbs.length - 1 ? 'text-[var(--foreground)] font-semibold' : ''
                    }`}
                  >
                    {bc.name}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Right Section Tools */}
          <div className="flex items-center gap-4">
            
            {/* Search Trigger (Ctrl+K) */}
            <button
              onClick={() => setIsCommandOpen(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] hover:bg-[var(--surface-hover)] text-xs text-[var(--text-muted)] transition-all max-w-[180px] sm:max-w-[200px] w-full select-none cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="ml-auto inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-[var(--surface)] border border-[var(--border)] rounded text-[9px] font-semibold">
                ⌘K
              </kbd>
            </button>

            {/* Notification Bell */}
            <Link
              href="/notifications"
              className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors relative cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 stroke-[1.5]" />
              {(unreadData?.unread ?? 0) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[8px] font-bold rounded-full">
                  {unreadData!.unread > 99 ? '99+' : unreadData!.unread}
                </span>
              )}
            </Link>

            {/* Theme Selector */}
            <ThemeSelector />

            {/* Store Information Picker (Visual display) */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-[var(--background)] border border-[var(--border)]/10 rounded-lg text-xs font-semibold">
              <Store className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span className="text-[var(--foreground)] truncate max-w-[120px]">{store.storeName}</span>
            </div>

            {/* User Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 border border-[var(--border)]/5 flex items-center justify-center text-xs font-bold text-[var(--color-primary)] cursor-pointer select-none"
              >
                {store.storeName.substring(0, 2).toUpperCase()}
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-medium p-2 z-50 animate-fade-in text-xs">
                    <div className="px-3 py-2 border-b border-[var(--border)]/10 flex flex-col gap-0.5">
                      <div className="font-bold text-[var(--foreground)] truncate">{store.storeName}</div>
                      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                        Role: {store.role}
                      </div>
                      <div className="text-[9px] text-[var(--color-primary)] font-semibold flex items-center gap-1 mt-1">
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        <span>{store.city}, {store.state}</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>Profile Settings</span>
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>Security & Sessions</span>
                      </Link>
                    </div>

                    <div className="border-t border-[var(--border)]/10 pt-1 mt-1">
                      <button
                        onClick={logout}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-left transition-colors cursor-pointer font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto flex flex-col gap-6">
          {children}
        </main>
      </div>

      {/* Global Command Palette dialog */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  );
}
