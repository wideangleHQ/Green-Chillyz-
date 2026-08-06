'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ErrorAnnouncer } from '../ui/ErrorAnnouncer';
import { useDashboardLogin } from '../../hooks/useDashboardAuth';
import { extractApiError } from '../../lib/api/client';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  accessCode: z
    .string()
    .min(8, { message: 'Access code must be at least 8 characters.' })
    .max(64, { message: 'Access code must be at most 64 characters.' })
    .regex(/^[A-Za-z0-9-]+$/, {
      message: 'Access code must contain only letters, numbers, and hyphens.',
    }),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

export const AuthCard: React.FC = () => {
  const router = useRouter();
  const loginMutation = useDashboardLogin();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      accessCode: '',
    },
  });

  const { ref: formRef, ...registerProps } = register('accessCode');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const onSubmit = async (data: LoginSchemaType) => {
    setErrorMsg(null);
    try {
      const formattedAccessCode = data.accessCode.trim().toUpperCase();
      await loginMutation.mutateAsync(formattedAccessCode);
      router.push('/');
    } catch (err) {
      setErrorMsg(extractApiError(err));
    }
  };

  return (
    <div className="w-full max-w-[440px] px-6 py-8 md:p-10 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] shadow-soft flex flex-col gap-6 relative z-10 transition-all duration-200">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="GreenChillyz Logo" className="h-8 object-contain" />
          <span className="font-heading text-sm tracking-wider uppercase text-[var(--color-primary)]">
            GreenChillyz
          </span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)] mt-2">
          Welcome Back
        </h1>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Sign in to the GreenChillyz Operations Platform.
        </p>
      </div>

      {errorMsg && <ErrorAnnouncer message={errorMsg} />}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          {...registerProps}
          ref={(el) => {
            formRef(el);
            inputRef.current = el;
          }}
          label="Store Access Code"
          type="password"
          autoComplete="current-password"
          error={errors.accessCode?.message}
          disabled={loginMutation.isPending}
          className="font-mono tracking-wide"
        />

        <div className="flex items-center justify-between mt-1 text-xs">
          <span className="text-[10px] text-[var(--text-muted)]">
            Enter the unique key issued to your store.
          </span>
          <a
            href="mailto:support@greenchillyz.com?subject=Dashboard Access Code Request"
            className="text-[var(--color-primary)] hover:text-[var(--color-primary-container)] font-semibold transition-colors shrink-0"
          >
            Request Access
          </a>
        </div>

        <Button
          type="submit"
          fullWidth
          className="mt-2"
          isLoading={loginMutation.isPending}
          isSuccess={loginMutation.isSuccess}
        >
          Sign In
        </Button>
      </form>

      <div className="flex flex-col items-center gap-2 mt-2 pt-4 border-t border-[var(--border)]/5 text-[10px] text-[var(--text-muted)] font-medium">
        <div className="flex gap-4">
          <a
            href="mailto:support@greenchillyz.com"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Support Link
          </a>
          <span>&middot;</span>
          <a href="#" className="hover:text-[var(--foreground)] transition-colors">
            Privacy
          </a>
          <span>&middot;</span>
          <a href="#" className="hover:text-[var(--foreground)] transition-colors">
            Terms
          </a>
        </div>
        <div>Version 2.4.1</div>
      </div>
    </div>
  );
};
export default AuthCard;
