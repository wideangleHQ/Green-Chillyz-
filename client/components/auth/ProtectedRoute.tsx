'use client';

import React from 'react';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
}

export function ProtectedRoute({
  children,
  fallback,
  requiredRole,
  requiredPermission,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, hasPermission, openAuthModal } = useAuth();

  // Opening the modal is a state update, so it must happen after render
  // commits — calling it inline warns and can loop.
  const shouldPromptSignIn = !isLoading && !isAuthenticated;
  React.useEffect(() => {
    if (shouldPromptSignIn) {
      openAuthModal('sign-in');
    }
  }, [shouldPromptSignIn, openAuthModal]);

  if (isLoading) {
    return (
      fallback ?? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-3 border-brand-green border-t-transparent" />
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return (
      fallback ?? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-slate-500 font-sans">Please sign in to continue.</p>
          <button
            type="button"
            onClick={() => openAuthModal('sign-in')}
            className="rounded-full bg-brand-green px-6 py-2.5 font-heading text-sm uppercase tracking-wider text-white shadow-soft transition-all hover:bg-brand-green-hover hover:shadow-hover cursor-pointer"
          >
            Sign In
          </button>
        </div>
      )
    );
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-red-50 text-brand-red">
          <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-700">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-red-50 text-brand-red">
          <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-700">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
