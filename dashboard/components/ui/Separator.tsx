'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation={orientation}
        className={cn(
          'bg-[var(--border)]',
          orientation === 'horizontal' ? 'h-[1px] w-full' : 'w-[1px] h-full',
          className
        )}
        {...props}
      />
    );
  }
);

Separator.displayName = 'Separator';
