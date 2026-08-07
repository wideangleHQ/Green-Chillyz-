'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="relative w-full flex flex-col gap-1">
        <div className="relative">
          <select
            ref={ref}
            aria-invalid={!!error}
            className={cn(
              'w-full appearance-none px-3 py-2 pr-9 text-sm text-[var(--foreground)] bg-[var(--input-bg)] border border-[var(--border)] rounded-lg transition-colors outline-none',
              'focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--color-primary)]/10',
              error && 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/10',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
        </div>
        {error && (
          <p role="alert" className="text-xs text-[var(--color-error)] font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
