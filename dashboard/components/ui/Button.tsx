'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-sm',
        secondary:
          'border border-[var(--border)] bg-transparent hover:bg-[var(--surface-hover)] text-[var(--foreground)]',
        destructive:
          'bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/90 shadow-sm',
        outline:
          'border border-[var(--border)] bg-transparent hover:bg-[var(--surface-hover)] hover:border-[var(--color-primary)] text-[var(--foreground)]',
        ghost:
          'hover:bg-[var(--surface-hover)] text-[var(--foreground)]',
        link:
          'text-[var(--color-primary)] underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 rounded-md px-3 text-xs',
        default: 'h-10 rounded-lg px-4 py-2',
        lg: 'h-11 rounded-lg px-6',
        icon: 'h-10 w-10 rounded-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  isSuccess?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading = false,
      isSuccess = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading || isSuccess}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        {...props}
      >
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {isSuccess && (
          <Check className="h-4 w-4" aria-hidden="true" />
        )}
        {isSuccess ? 'Success' : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
