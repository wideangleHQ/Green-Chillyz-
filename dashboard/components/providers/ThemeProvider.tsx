'use client';

import React from 'react';

/**
 * ThemeProvider - Light Mode Only
 * 
 * The Dashboard is permanently set to Light Mode for consistency
 * and optimal readability in professional operations environments.
 * Dark mode and theme switching have been removed.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
