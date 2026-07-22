'use client';

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  Eye, EyeOff, Loader2, AlertCircle,
  User as UserIcon, Mail, Lock, AtSign,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signUpSchema, type SignUpFormValues } from '@/lib/validation/authSchemas';
import { api, extractApiError } from '@/lib/api/client';
import type { AuthUser } from '@/types/auth';
import { useAuth } from './AuthContext';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { GoogleAuthButton } from './GoogleAuthButton';

export function SignUpForm() {
  const { setModalView, closeAuthModal, draftIdentifier, setDraftIdentifier } = useAuth();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const registerMutation = useMutation<{ user: AuthUser; message?: string }, Error, SignUpFormValues>({
    mutationFn: async (values) => {
      const { data } = await api.post<{ user: AuthUser; message?: string }>('/auth/register', {
        fullName: values.fullName.trim(),
        username: values.username.trim().toLowerCase(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      return data;
    },
    onSuccess: (res) => {
      if (res.user) queryClient.setQueryData(['auth', 'me'], res.user);
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      username: '',
      email: draftIdentifier?.includes('@') ? draftIdentifier : '',
      password: '',
      confirmPassword: '',
      acceptTerms: true,
    },
  });

  const passwordValue = watch('password') || '';
  const emailVal = watch('email');
  const usernameVal = watch('username');

  React.useEffect(() => {
    if (emailVal) setDraftIdentifier(emailVal);
    else if (usernameVal) setDraftIdentifier(usernameVal);
  }, [emailVal, usernameVal, setDraftIdentifier]);

  const onSubmit = useCallback(
    async (data: SignUpFormValues) => {
      setApiError(null);
      try {
        await registerMutation.mutateAsync(data);
        setSuccess(true);
        setTimeout(closeAuthModal, 1500);
      } catch (err) {
        setApiError(extractApiError(err));
      }
    },
    [registerMutation, closeAuthModal]
  );

  if (success) {
    return (
      <div className="py-8 text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-brand-green"
        >
          <motion.svg
            className="size-10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              d="M20 6L9 17l-5-5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </motion.svg>
        </motion.div>
        <h3 className="font-heading text-2xl font-bold text-slate-900">Account Created!</h3>
        <p className="text-sm text-slate-500 font-sans">Welcome to GreenChillyz.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      <div className="text-center sm:text-left">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
          Create Account
        </h2>
        <p className="mt-1 text-sm text-slate-500 font-sans">
          Join GreenChillyz to earn coins, unlock offers &amp; save preferences.
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
        {/* Full Name */}
        <div className="space-y-1">
          <label htmlFor="su-name" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700">
            Full Name
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><UserIcon className="size-4" /></div>
            <input
              id="su-name" type="text" autoComplete="name" placeholder="e.g. Ananya Sharma"
              {...register('fullName')}
              className={`w-full rounded-2xl border bg-white/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 ${errors.fullName ? 'border-brand-red' : 'border-slate-200 focus:border-brand-green'}`}
            />
          </div>
          {errors.fullName && <p className="text-xs font-medium text-brand-red">{errors.fullName.message}</p>}
        </div>

        {/* Username */}
        <div className="space-y-1">
          <label htmlFor="su-user" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700">
            Username
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><AtSign className="size-4" /></div>
            <input
              id="su-user" type="text" autoComplete="username" placeholder="e.g. ananya_foodie"
              {...register('username')}
              className={`w-full rounded-2xl border bg-white/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 ${errors.username ? 'border-brand-red' : 'border-slate-200 focus:border-brand-green'}`}
            />
          </div>
          {errors.username && <p className="text-xs font-medium text-brand-red">{errors.username.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label htmlFor="su-email" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700">
            Email Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><Mail className="size-4" /></div>
            <input
              id="su-email" type="email" autoComplete="email" placeholder="name@example.com"
              {...register('email')}
              className={`w-full rounded-2xl border bg-white/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 ${errors.email ? 'border-brand-red' : 'border-slate-200 focus:border-brand-green'}`}
            />
          </div>
          {errors.email && <p className="text-xs font-medium text-brand-red">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label htmlFor="su-pw" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700">
            Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><Lock className="size-4" /></div>
            <input
              id="su-pw" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Create a strong password"
              {...register('password')}
              className={`w-full rounded-2xl border bg-white/80 py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 ${errors.password ? 'border-brand-red' : 'border-slate-200 focus:border-brand-green'}`}
            />
            <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer">
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <PasswordStrengthMeter password={passwordValue} />
          {errors.password && <p className="text-xs font-medium text-brand-red mt-1">{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label htmlFor="su-cpw" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700">
            Confirm Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><Lock className="size-4" /></div>
            <input
              id="su-cpw" type={showConfirm ? 'text' : 'password'} autoComplete="new-password" placeholder="Re-enter your password"
              {...register('confirmPassword')}
              className={`w-full rounded-2xl border bg-white/80 py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 ${errors.confirmPassword ? 'border-brand-red' : 'border-slate-200 focus:border-brand-green'}`}
            />
            <button type="button" onClick={() => setShowConfirm((p) => !p)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer">
              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs font-medium text-brand-red">{errors.confirmPassword.message}</p>}
        </div>

        {/* Terms */}
        <div className="pt-1">
          <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-600">
            <input type="checkbox" {...register('acceptTerms')} className="mt-0.5 size-4 rounded border-slate-300 text-brand-green focus:ring-brand-green shrink-0" />
            <span>
              I agree to the{' '}
              <a href="/terms" target="_blank" className="font-semibold text-brand-green hover:underline">Terms</a>
              {' '}&amp;{' '}
              <a href="/privacy" target="_blank" className="font-semibold text-brand-green hover:underline">Privacy Policy</a>.
            </span>
          </label>
          {errors.acceptTerms && <p className="text-xs font-medium text-brand-red mt-1">{errors.acceptTerms.message}</p>}
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={registerMutation.isPending}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="relative mt-2 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-brand-green px-6 py-3.5 font-heading text-base uppercase tracking-wider text-white shadow-soft transition-all duration-200 hover:bg-brand-green-hover hover:shadow-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {registerMutation.isPending ? (
            <><Loader2 className="size-5 animate-spin text-white" /><span>Creating Account…</span></>
          ) : (
            <span>Create Account</span>
          )}
        </motion.button>
      </form>

      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-slate-200" />
        <span className="absolute bg-white/90 px-3 text-xs uppercase tracking-widest text-slate-400 font-semibold">Or</span>
      </div>

      <GoogleAuthButton onError={(msg) => setApiError(msg)} disabled={registerMutation.isPending} />

      <div className="pt-2 text-center text-xs text-slate-500">
        Already have an account?{' '}
        <button type="button" onClick={() => setModalView('sign-in')} className="font-bold text-brand-green transition-colors hover:text-brand-green-hover hover:underline cursor-pointer">
          Sign In
        </button>
      </div>
    </div>
  );
}
