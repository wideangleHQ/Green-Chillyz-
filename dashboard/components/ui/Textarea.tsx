'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="relative w-full flex flex-col gap-1">
        <textarea
          ref={ref}
          aria-invalid={!!error}
          className={cn(
            'w-full px-3 py-2 text-sm text-[var(--foreground)] bg-[var(--input-bg)] border border-[var(--border)] rounded-lg transition-colors outline-none resize-none',
            'focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--color-primary)]/10',
            'placeholder:text-[var(--text-muted)]',
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

Textarea.displayName = 'Textarea';
