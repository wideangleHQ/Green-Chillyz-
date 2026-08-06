'use client';

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, AlertCircle, Lock, User as UserIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loginSchema, type LoginFormValues } from '@/lib/validation/authSchemas';
import { api, extractApiError } from '@/lib/api/client';
import type { AuthUser } from '@/types/auth';
import { useAuth } from './AuthContext';
import { GoogleAuthButton } from './GoogleAuthButton';

export function SignInForm() {
  const { setModalView, closeAuthModal, draftIdentifier, setDraftIdentifier } = useAuth();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const loginMutation = useMutation<{ user: AuthUser }, Error, LoginFormValues>({
    mutationFn: async (values) => {
      const { data } = await api.post<{ user: AuthUser }>('/auth/login', {
        identifier: values.identifier.trim(),
        password: values.password,
        rememberMe: values.rememberMe,
      });
      return data;
    },
    onSuccess: (res) => {
      queryClient.setQueryData(['auth', 'me'], res.user);
      closeAuthModal();
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: draftIdentifier || '',
      password: '',
      rememberMe: false,
    },
  });

  const currentIdentifier = watch('identifier');
  React.useEffect(() => {
    if (currentIdentifier !== undefined) setDraftIdentifier(currentIdentifier);
  }, [currentIdentifier, setDraftIdentifier]);

  const onSubmit = useCallback(
    async (data: LoginFormValues) => {
      setApiError(null);
      try {
        await loginMutation.mutateAsync(data);
      } catch (err) {
        setApiError(extractApiError(err));
      }
    },
    [loginMutation]
  );

  return (
    <div className="w-full space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
          Welcome Back
        </h2>
        <p className="mt-1 text-sm text-slate-500 font-sans">
          Sign in to access your GreenChillyz rewards &amp; orders.
        </p>
      </div>

      {apiError && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }}
          transition={{ duration: 0.4 }}
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/90 p-3.5 text-xs text-red-700 shadow-sm"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0 text-brand-red mt-0.5" />
          <span className="font-medium leading-relaxed">{apiError}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Identifier */}
        <div className="space-y-1.5">
          <label htmlFor="signin-id" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Email or Username
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <UserIcon className="size-4" />
            </div>
            <input
              id="signin-id"
              type="text"
              autoComplete="username"
              placeholder="e.g. name@example.com"
              {...register('identifier')}
              className={`w-full rounded-2xl border bg-white/80 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 ${
                errors.identifier
                  ? 'border-brand-red focus:border-brand-red'
                  : 'border-slate-200 focus:border-brand-green'
              }`}
            />
          </div>
          {errors.identifier && (
            <p className="text-xs font-medium text-brand-red">{errors.identifier.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="signin-pw" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Lock className="size-4" />
            </div>
            <input
              id="signin-pw"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              {...register('password')}
              className={`w-full rounded-2xl border bg-white/80 py-3 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 ${
                errors.password
                  ? 'border-brand-red focus:border-brand-red'
                  : 'border-slate-200 focus:border-brand-green'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs font-medium text-brand-red">{errors.password.message}</p>
          )}
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <label className="flex cursor-pointer items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              {...register('rememberMe')}
              className="size-4 rounded border-slate-300 text-brand-green focus:ring-brand-green"
            />
            <span className="font-medium">Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => setModalView('forgot-password')}
            className="font-semibold text-brand-green transition-colors hover:text-brand-green-hover hover:underline cursor-pointer"
          >
            Forgot Password?
          </button>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={loginMutation.isPending}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="relative mt-2 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-brand-green px-6 py-3.5 font-sans font-bold text-base uppercase tracking-wider text-white shadow-soft transition-all duration-200 hover:bg-brand-green-hover hover:shadow-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="size-5 animate-spin text-white" />
              <span>Signing In…</span>
            </>
          ) : (
            <span>Continue</span>
          )}
        </motion.button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-slate-200" />
        <span className="absolute bg-white/90 px-3 text-xs uppercase tracking-widest text-slate-400 font-semibold">
          Or
        </span>
      </div>

      <GoogleAuthButton onError={(msg) => setApiError(msg)} disabled={loginMutation.isPending} />

      <div className="pt-2 text-center text-xs text-slate-500">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={() => setModalView('sign-up')}
          className="font-bold text-brand-green transition-colors hover:text-brand-green-hover hover:underline cursor-pointer"
        >
          Create one
        </button>
      </div>
    </div>
  );
}
