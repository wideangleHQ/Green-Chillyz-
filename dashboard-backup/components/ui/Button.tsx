'use client';

import React from 'react';
import { Loader2, Check } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  isSuccess?: boolean;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  isLoading = false,
  isSuccess = false,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative flex items-center justify-center w-full px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-150 outline-none select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary:
      'bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-[var(--color-on-primary)] shadow-sm hover:shadow active:scale-[0.97]',
    secondary:
      'bg-transparent border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]',
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading || isSuccess}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {isLoading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin stroke-[2]" aria-hidden="true" />
      )}
      {isSuccess && (
        <Check className="w-4 h-4 mr-2 stroke-[2] text-white" aria-hidden="true" />
      )}
      <span className={isLoading || isSuccess ? 'opacity-90' : ''}>
        {isSuccess ? 'Success' : children}
      </span>
    </button>
  );
};

Button.displayName = 'Button';
