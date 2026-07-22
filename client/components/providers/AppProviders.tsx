'use client';

import React from 'react';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from '../auth/AuthContext';
import { AuthModal } from '../auth/AuthModal';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <AuthModal />
      </AuthProvider>
    </QueryProvider>
  );
}
