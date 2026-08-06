'use client';

import React from 'react';
import { Button } from '../ui/Button';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold text-[var(--foreground)] truncate">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {description}
          </p>
        )}
      </div>

      {(action || children) && (
        <div className="flex items-center gap-3">
          {children}
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
              className="whitespace-nowrap"
            >
              {action.icon}
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
