'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useDashboardAuth } from '@/components/providers/AuthProvider';
import { useUnreadNotificationsCount } from '@/hooks/useDashboardOps';
import { CommandPalette } from '@/components/CommandPalette';
import { Sidebar, SidebarItem } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { Header } from '@/components/layout/Header';
import { BreadcrumbItem } from '@/components/ui/Breadcrumb';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Megaphone,
  Settings,
  Layers,
  Ticket,
} from 'lucide-react';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { store, logout, isLoading } = useDashboardAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
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

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  if (isLoading || !store) {
    return null;
  }

  const menuItems: SidebarItem[] = [
    { name: 'Dashboard', href: '/', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Operations', href: '/operations', icon: <Layers className="w-4 h-4" /> },
    { name: 'Customers', href: '/customers', icon: <Users className="w-4 h-4" /> },
    { name: 'Marketing', href: '/marketing', icon: <Megaphone className="w-4 h-4" /> },
    { name: 'Vouchers', href: '/vouchers', icon: <Ticket className="w-4 h-4" />, children: [
      { name: 'Create Voucher', href: '/vouchers/create' },
      { name: 'Redeem Voucher', href: '/vouchers/redeem' }
    ]},
    { name: 'Reports', href: '/reports', icon: <BarChart3 className="w-4 h-4" /> },
    { name: 'Administration', href: '/administration', icon: <Settings className="w-4 h-4" /> },
  ];

  const bottomItems: SidebarItem[] = [];

  // Generate breadcrumbs from pathname
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    if (pathname === '/') return [{ name: 'Dashboard', href: '/' }];
    
    const parts = pathname.split('/').filter(Boolean);
    return parts.map((part, index) => {
      const url = '/' + parts.slice(0, index + 1).join('/');
      const name = part
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return { name, href: url };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex">
      
      {/* Desktop Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        menuItems={menuItems}
        bottomItems={bottomItems}
      />

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        menuItems={menuItems}
        bottomItems={bottomItems}
      />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <Header
          onMenuClick={() => setIsMobileOpen(true)}
          onSearchClick={() => setIsCommandOpen(true)}
          breadcrumbs={breadcrumbs}
          store={store}
          unreadCount={unreadData?.unread ?? 0}
          onLogout={logout}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl w-full mx-auto flex flex-col gap-6">
            {children}
          </div>
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  );
}
