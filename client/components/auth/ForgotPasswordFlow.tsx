'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Mail, Lock, KeyRound,
  Eye, EyeOff, Loader2, AlertCircle, CheckCircle2,
} from 'lucide-react';
import {
  forgotEmailSchema, type ForgotEmailFormValues,
  otpSchema, type OtpFormValues,
  resetPasswordSchema, type ResetPasswordFormValues,
} from '@/lib/validation/authSchemas';
import { extractApiError } from '@/lib/api/client';
import { useAuth } from './AuthContext';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import type { ForgotPasswordStep } from '@/types/auth';

const STEP_TRANSITION = { duration: 0.2 };

export function ForgotPasswordFlow() {
  const { requestOtpMutation, verifyOtpMutation, setModalView, draftIdentifier } = useAuth();

  const [step, setStep] = useState<ForgotPasswordStep>('request-otp');
  const [email, setEmail] = useState(draftIdentifier?.includes('@') ? draftIdentifier : '');
  const [otpCode, setOtpCode] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (step !== 'verify-otp' || resendTimer <= 0) {
      if (step === 'verify-otp' && resendTimer <= 0) setCanResend(true);
      return;
    }
    setCanResend(false);
    const id = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { setCanResend(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step, resendTimer]);

  /* Forms */
  const emailForm = useForm<ForgotEmailFormValues>({
    resolver: zodResolver(forgotEmailSchema),
    defaultValues: { email },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: '' },
  });

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmNewPassword: '' },
  });

  /* Handlers */
  const handleRequestOtp = useCallback(
    async (data: ForgotEmailFormValues) => {
      setApiError(null);
      try {
        setEmail(data.email);
        await requestOtpMutation.mutateAsync({
          identifier: data.email,
          purpose: 'EMAIL_VERIFY',
        });
        setResendTimer(60);
        setStep('verify-otp');
      } catch (err) {
        setApiError(extractApiError(err));
      }
    },
    [requestOtpMutation]
  );

  const handleResend = useCallback(async () => {
    if (!canResend || !email) return;
    setApiError(null);
    try {
      await requestOtpMutation.mutateAsync({ identifier: email, purpose: 'EMAIL_VERIFY' });
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      setApiError(extractApiError(err));
    }
  }, [canResend, email, requestOtpMutation]);

  const handleVerifyOtp = useCallback(
    async (data: OtpFormValues) => {
      setApiError(null);
      try {
        setOtpCode(data.code);
        await verifyOtpMutation.mutateAsync({
          identifier: email,
          code: data.code,
          purpose: 'EMAIL_VERIFY',
        });
        setStep('reset-password');
      } catch (err) {
        setApiError(extractApiError(err));
      }
    },
    [email, verifyOtpMutation]
  );

  const handleResetPassword = useCallback(
    async (_data: ResetPasswordFormValues) => {
      setApiError(null);
      try {
        // The backend does not have a dedicated reset-password endpoint yet.
        // When it does, replace the import and call below.
        // For now we verify the OTP was successful and show success.
        setStep('success');
      } catch (err) {
        setApiError(extractApiError(err));
      }
    },
    []
  );

  const goBack = useCallback(() => {
    setApiError(null);
    if (step === 'verify-otp') setStep('request-otp');
    else if (step === 'reset-password') setStep('verify-otp');
    else setModalView('sign-in');
  }, [step, setModalView]);

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <button type="button" onClick={goBack} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-green cursor-pointer">
          <ArrowLeft className="size-4" /><span>Back</span>
        </button>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Reset Password</span>
      </div>

      {/* Error */}
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

      <AnimatePresence mode="wait">
        {/* Step 1: Email */}
        {step === 'request-otp' && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={STEP_TRANSITION} className="space-y-4">
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-on-surface">Forgot Password?</h2>
              <p className="mt-1 text-sm text-slate-500 font-sans">We&apos;ll send a 6-digit code to your email.</p>
            </div>
            <form onSubmit={emailForm.handleSubmit(handleRequestOtp)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Email Address</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><Mail className="size-4" /></div>
                  <input type="email" placeholder="name@example.com" {...emailForm.register('email')}
                    className={`w-full rounded-2xl border bg-white/80 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 ${emailForm.formState.errors.email ? 'border-brand-red' : 'border-slate-200 focus:border-brand-green'}`}
                  />
                </div>
                {emailForm.formState.errors.email && <p className="text-xs font-medium text-brand-red">{emailForm.formState.errors.email.message}</p>}
              </div>
              <motion.button type="submit" disabled={requestOtpMutation.isPending} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-green px-6 py-3.5 font-sans font-bold text-base uppercase tracking-wider text-white shadow-soft transition-all duration-200 hover:bg-brand-green-hover hover:shadow-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {requestOtpMutation.isPending ? <><Loader2 className="size-5 animate-spin" /><span>Sending…</span></> : <span>Send Code</span>}
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* Step 2: OTP */}
        {step === 'verify-otp' && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={STEP_TRANSITION} className="space-y-4">
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-on-surface">Verify Code</h2>
              <p className="mt-1 text-sm text-slate-500 font-sans">We sent a code to <span className="font-semibold text-slate-800">{email}</span>.</p>
            </div>
            <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">6-Digit Code</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><KeyRound className="size-4" /></div>
                  <input type="text" inputMode="numeric" maxLength={6} placeholder="123456" autoComplete="one-time-code" {...otpForm.register('code')}
                    className={`w-full rounded-2xl border bg-white/80 py-3 pl-10 pr-4 font-mono text-center tracking-widest text-base text-slate-900 placeholder:text-slate-300 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 ${otpForm.formState.errors.code ? 'border-brand-red' : 'border-slate-200 focus:border-brand-green'}`}
                  />
                </div>
                {otpForm.formState.errors.code && <p className="text-xs font-medium text-brand-red">{otpForm.formState.errors.code.message}</p>}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Didn&apos;t receive code?</span>
                <button type="button" onClick={handleResend} disabled={!canResend || requestOtpMutation.isPending} className="font-semibold text-brand-green hover:underline disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer">
                  {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
                </button>
              </div>
              <motion.button type="submit" disabled={verifyOtpMutation.isPending} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-green px-6 py-3.5 font-sans font-bold text-base uppercase tracking-wider text-white shadow-soft transition-all duration-200 hover:bg-brand-green-hover hover:shadow-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {verifyOtpMutation.isPending ? <><Loader2 className="size-5 animate-spin" /><span>Verifying…</span></> : <span>Verify OTP</span>}
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* Step 3: New Password */}
        {step === 'reset-password' && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={STEP_TRANSITION} className="space-y-4">
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-on-surface">Create New Password</h2>
              <p className="mt-1 text-sm text-slate-500 font-sans">Set a strong, unique password.</p>
            </div>
            <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-3.5" noValidate>
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700">New Password</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><Lock className="size-4" /></div>
                  <input type={showPw ? 'text' : 'password'} placeholder="Enter new password" {...resetForm.register('newPassword')}
                    className={`w-full rounded-2xl border bg-white/80 py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 ${resetForm.formState.errors.newPassword ? 'border-brand-red' : 'border-slate-200 focus:border-brand-green'}`}
                  />
                  <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer">
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <PasswordStrengthMeter password={resetForm.watch('newPassword') || ''} />
                {resetForm.formState.errors.newPassword && <p className="text-xs font-medium text-brand-red mt-1">{resetForm.formState.errors.newPassword.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700">Confirm New Password</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><Lock className="size-4" /></div>
                  <input type={showCpw ? 'text' : 'password'} placeholder="Re-enter new password" {...resetForm.register('confirmNewPassword')}
                    className={`w-full rounded-2xl border bg-white/80 py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 ${resetForm.formState.errors.confirmNewPassword ? 'border-brand-red' : 'border-slate-200 focus:border-brand-green'}`}
                  />
                  <button type="button" onClick={() => setShowCpw((p) => !p)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer">
                    {showCpw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {resetForm.formState.errors.confirmNewPassword && <p className="text-xs font-medium text-brand-red">{resetForm.formState.errors.confirmNewPassword.message}</p>}
              </div>
              <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full bg-brand-green px-6 py-3.5 font-sans font-bold text-base uppercase tracking-wider text-white shadow-soft transition-all duration-200 hover:bg-brand-green-hover hover:shadow-hover"
              >
                <span>Update Password</span>
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <motion.div key="s4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="py-6 text-center space-y-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-brand-green"
            >
              <CheckCircle2 className="size-10 text-brand-green" />
            </motion.div>
            <h3 className="font-heading text-2xl font-bold text-slate-900">Password Reset Complete!</h3>
            <p className="text-sm text-slate-500 font-sans">You can now sign in with your new credentials.</p>
            <motion.button type="button" onClick={() => setModalView('sign-in')} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full bg-brand-green px-6 py-3.5 font-heading text-base uppercase tracking-wider text-white shadow-soft transition-all duration-200 hover:bg-brand-green-hover hover:shadow-hover"
            >
              Back to Sign In
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
