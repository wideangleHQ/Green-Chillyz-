import { z } from 'zod';

/* ─── Sign In ───────────────────────────────────────────── */

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or username is required')
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/* ─── Sign Up ───────────────────────────────────────────── */

export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(60, 'Full name must be under 60 characters')
      .trim(),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be under 30 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Only letters, numbers, underscores and hyphens'
      )
      .trim(),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Enter a valid email address')
      .trim()
      .toLowerCase(),
    password: z
      .string()
      .min(8, 'Must be at least 8 characters')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[0-9]/, 'Include at least one number')
      .regex(/[^a-zA-Z0-9]/, 'Include at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptTerms: z.boolean().refine((v) => v === true, {
      message: 'You must accept the Terms & Privacy Policy',
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;

/* ─── Forgot Password – Email Step ─────────────────────── */

export const forgotEmailSchema = z.object({
  email: z
    .string()
    .min(1, 'Enter your registered email')
    .email('Enter a valid email address')
    .trim()
    .toLowerCase(),
});

export type ForgotEmailFormValues = z.infer<typeof forgotEmailSchema>;

/* ─── OTP Verification ─────────────────────────────────── */

export const otpSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be exactly 6 digits')
    .regex(/^\d+$/, 'Numbers only'),
});

export type OtpFormValues = z.infer<typeof otpSchema>;

/* ─── Reset Password ──────────────────────────────────── */

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Must be at least 8 characters')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[0-9]/, 'Include at least one number')
      .regex(/[^a-zA-Z0-9]/, 'Include at least one special character'),
    confirmNewPassword: z
      .string()
      .min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

/* ─── Password Strength Utility ────────────────────────── */

export interface PasswordRequirement {
  id: string;
  label: string;
  passed: boolean;
}

export function evaluatePasswordStrength(password: string) {
  const requirements: PasswordRequirement[] = [
    { id: 'length', label: '8+ characters', passed: password.length >= 8 },
    { id: 'upper', label: 'Uppercase (A-Z)', passed: /[A-Z]/.test(password) },
    { id: 'number', label: 'Number (0-9)', passed: /[0-9]/.test(password) },
    { id: 'special', label: 'Special (!@#$%)', passed: /[^a-zA-Z0-9]/.test(password) },
  ];

  const passed = requirements.filter((r) => r.passed).length;

  const levels = [
    { min: 0, label: '', score: 0, color: 'bg-slate-200', text: 'text-slate-400' },
    { min: 1, label: 'Weak', score: 25, color: 'bg-red-500', text: 'text-red-500' },
    { min: 2, label: 'Fair', score: 50, color: 'bg-amber-500', text: 'text-amber-500' },
    { min: 3, label: 'Good', score: 75, color: 'bg-emerald-500', text: 'text-emerald-500' },
    { min: 4, label: 'Strong', score: 100, color: 'bg-brand-green', text: 'text-brand-green' },
  ] as const;

  const level = password.length === 0
    ? levels[0]
    : levels[Math.min(passed, 4)];

  return { ...level, requirements, passed };
}
