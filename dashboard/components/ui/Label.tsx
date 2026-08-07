'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'block text-xs font-semibold text-[var(--foreground)] mb-1.5',
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
      </label>
    );
  }
);

Label.displayName = 'Label';
