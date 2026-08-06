'use client';

import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentStore, useDashboardLogout } from '../../hooks/useDashboardAuth';
import { dashboardKeys } from '../../lib/queryKeys';
import type { DashboardStoreContext } from '../../types/auth';

interface AuthContextValue {
  store: DashboardStoreContext | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const PUBLIC_PATHS = ['/login'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  const { data: store, isLoading, isError } = useCurrentStore(!isPublicPath);
  const logoutMutation = useDashboardLogout();

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      queryClient.removeQueries({ queryKey: dashboardKeys.all });
    }
    router.replace('/login');
  }, [logoutMutation, queryClient, router]);

  useEffect(() => {
    const handler = () => {
      queryClient.removeQueries({ queryKey: dashboardKeys.all });
      router.replace('/login');
    };
    window.addEventListener('gc:dashboard-session-expired', handler);
    return () => window.removeEventListener('gc:dashboard-session-expired', handler);
  }, [queryClient, router]);

  useEffect(() => {
    if (isPublicPath) return;
    if (!isLoading && (isError || !store)) {
      router.replace('/login');
    }
  }, [isLoading, isError, store, isPublicPath, router]);

  useEffect(() => {
    if (!isPublicPath || isLoading) return;
    if (store && !isError) {
      router.replace('/');
    }
  }, [store, isError, isLoading, isPublicPath, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      store: store ?? null,
      isAuthenticated: !!store && !isError,
      isLoading: isPublicPath ? false : isLoading,
      logout,
    }),
    [store, isError, isLoading, isPublicPath, logout],
  );

  if (!isPublicPath && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">
            Initializing session&hellip;
          </p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useDashboardAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useDashboardAuth must be used within AuthProvider');
  }
  return context;
}
