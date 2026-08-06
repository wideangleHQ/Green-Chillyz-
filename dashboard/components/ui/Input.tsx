'use client';

import React, { useState, useEffect, useId, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  type?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, type = 'text', className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [capsLockActive, setCapsLockActive] = useState(false);
    const generatedId = useId();
    const id = props.id || generatedId;

    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    // Caps Lock detection
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.getModifierState) {
          setCapsLockActive(e.getModifierState('CapsLock'));
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.getModifierState) {
          setCapsLockActive(e.getModifierState('CapsLock'));
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }, []);

    return (
      <div className="relative w-full flex flex-col gap-1">
        <div className="relative w-full">
          <input
            {...props}
            ref={ref}
            id={id}
            type={inputType}
            placeholder=" "
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            className={`peer w-full px-4 pt-5 pb-2 text-sm text-[var(--foreground)] bg-[var(--input-bg)] border border-[var(--border)] rounded-md transition-colors outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--color-primary)]/10 ${
              isPassword ? 'pr-11' : ''
            } ${error ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/10' : ''} ${className}`}
          />
          
          <label
            htmlFor={id}
            className="absolute left-4 top-3.5 text-xs text-[var(--text-muted)] scale-100 transition-all duration-200 origin-[0_0] pointer-events-none
                       peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0
                       peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-[var(--border-focus)]
                       not-peer-placeholder-shown:scale-75 not-peer-placeholder-shown:-translate-y-2.5"
          >
            {label}
          </label>

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors focus:outline-none p-1 rounded"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4.5 h-4.5 stroke-[1.5]" />
              ) : (
                <Eye className="w-4.5 h-4.5 stroke-[1.5]" />
              )}
            </button>
          )}
        </div>

        {/* Warning/Error indicator layers */}
        {capsLockActive && isPassword && (
          <div
            id={`${id}-capslock-warning`}
            role="status"
            aria-live="polite"
            className="text-[10px] font-medium text-amber-600 mt-0.5"
          >
            Caps Lock is active
          </div>
        )}

        {error && (
          <p
            id={`${id}-error`}
            role="alert"
            className="text-xs text-[var(--color-error)] font-medium"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
