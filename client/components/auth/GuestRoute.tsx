'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

interface GuestRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function GuestRoute({ children, redirectTo = '/' }: GuestRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-3 border-brand-green border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    router.replace(redirectTo);
    return null;
  }

  return <>{children}</>;
}
