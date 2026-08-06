'use client';

import React from 'react';
import { AuthCard } from '@/components/auth-card/AuthCard';
import { BrandPanel } from '@/components/brand-panel/BrandPanel';
import { ThemeSelector } from '@/components/ui/ThemeSelector';

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] xl:grid-cols-[1.2fr_0.8fr] bg-[var(--background)]">
      
      {/* Left Panel: Auth Card (Vertically & Horizontally Centered) */}
      <div className="flex items-center justify-center p-6 md:p-12 relative overflow-hidden bg-[var(--background)]">
        
        {/* Theme Selector in Top-Right Corner */}
        <div className="absolute top-6 right-6 z-50">
          <ThemeSelector />
        </div>

        {/* Subtle Decorative Ambient Background Glow for mobile/tablet */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[var(--color-primary)]/5 rounded-full blur-[80px] lg:hidden pointer-events-none" />
        
        <AuthCard />
      </div>

      {/* Right Panel: Desktop Brand Highlight Panel */}
      <BrandPanel />
      
    </div>
  );
}
