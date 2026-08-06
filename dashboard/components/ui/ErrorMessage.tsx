'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: ErrorMessageProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className
      )}
    >
      <div className="w-12 h-12 rounded-lg bg-[var(--color-error)]/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-[var(--color-error)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--text-muted)] max-w-md mb-6">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}

interface PageErrorProps {
  error: Error;
  reset?: () => void;
}

export function PageError({ error, reset }: PageErrorProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <ErrorMessage
        title="Failed to load page"
        message={error.message || 'An unexpected error occurred'}
        onRetry={reset}
      />
    </div>
  );
}
