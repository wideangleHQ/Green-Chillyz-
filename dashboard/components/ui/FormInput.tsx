'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="relative w-full flex flex-col gap-1">
        <input
          ref={ref}
          aria-invalid={!!error}
          className={cn(
            'w-full h-10 px-3 py-2 text-sm text-[var(--foreground)] bg-[var(--input-bg)] border border-[var(--border)] rounded-lg transition-colors outline-none',
            'focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--color-primary)]/10',
            'placeholder:text-[var(--text-muted)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/10',
            className
          )}
          {...props}
        />
        {error && (
          <p role="alert" className="text-xs text-[var(--color-error)] font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
