'use client';

import React, { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label?: string;
  };
  subtitle?: string;
  loading?: boolean;
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  subtitle, 
  loading = false,
  className
}: StatCardProps) {
  if (loading) {
    return (
      <div className={cn(
        'bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 animate-pulse',
        className
      )}>
        <div className="h-4 bg-[var(--surface-hover)] rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-[var(--surface-hover)] rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-[var(--surface-hover)] rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div className={cn(
      'bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 hover:shadow-sm transition-shadow',
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
          {title}
        </p>
        {icon && (
          <div className="text-[var(--color-primary)] opacity-70">
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-end gap-3 mb-2">
        <p className="text-3xl font-bold text-[var(--foreground)] leading-none">
          {value}
        </p>
        
        {trend && (
          <div className={cn(
            'flex items-center gap-1 pb-0.5',
            trend.direction === 'up' ? 'text-green-600' : 'text-[var(--color-error)]'
          )}>
            {trend.direction === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-xs font-semibold">
              {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>
      
      {(subtitle || trend?.label) && (
        <p className="text-xs text-[var(--text-muted)]">
          {subtitle || trend?.label}
        </p>
      )}
    </div>
  );
}
