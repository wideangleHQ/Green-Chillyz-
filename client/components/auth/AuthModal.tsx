'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { X } from 'lucide-react';
import { EASE_STANDARD } from '@/lib/motion';
import { useAuth } from './AuthContext';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { ForgotPasswordFlow } from './ForgotPasswordFlow';

/* ─── Animation Variants ────────────────────────────────── */

const backdropV: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22, ease: EASE_STANDARD } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: EASE_STANDARD } },
};

const desktopV: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0, scale: 0.97, y: 8,
    transition: { duration: 0.16, ease: EASE_STANDARD },
  },
};

const mobileV: Variants = {
  hidden: { y: '100%' },
  visible: { y: 0, transition: { type: 'spring', stiffness: 400, damping: 34 } },
  exit: { y: '100%', transition: { duration: 0.2, ease: EASE_STANDARD } },
};

const viewTransition = { duration: 0.18 };

/* ─── Component ─────────────────────────────────────────── */

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, modalView } = useAuth();
  const dialogRef = useRef<HTMLDivElement>(null);

  /* ESC to close */
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAuthModalOpen, closeAuthModal]);

  /* Focus first element on open / view change */
  useEffect(() => {
    if (!isAuthModalOpen || !dialogRef.current) return;
    requestAnimationFrame(() => {
      const el = dialogRef.current?.querySelector<HTMLElement>(
        'input:not([type=hidden]):not([disabled]), button:not([disabled])'
      );
      el?.focus();
    });
  }, [isAuthModalOpen, modalView]);

  /* Use responsive variant — detect at render time via CSS class, not window.innerWidth */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) closeAuthModal();
    },
    [closeAuthModal]
  );

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <motion.div
          key="auth-overlay"
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <motion.div
            variants={backdropV}
            initial="hidden"
            animate="visible"
            exit="exit"
            aria-hidden="true"
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
          />

          {/* Desktop modal */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Authentication"
            variants={desktopV}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10 hidden w-full max-w-lg overflow-hidden rounded-3xl border border-white/40 bg-white/[0.97] shadow-heavy sm:block sm:m-4"
          >
            <ModalContent />
          </motion.div>

          {/* Mobile bottom sheet */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Authentication"
            variants={mobileV}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10 w-full overflow-hidden rounded-t-3xl border-t border-white/40 bg-white/[0.97] shadow-heavy sm:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-slate-300" />
            <ModalContent />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Shared Content ────────────────────────────────────── */

function ModalContent() {
  const { closeAuthModal, modalView } = useAuth();

  return (
    <div className="relative max-h-[85vh] overflow-y-auto overscroll-contain p-6 sm:p-8">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-brand-green/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 size-56 rounded-full bg-gold/10 blur-3xl" />

      {/* Header */}
      <div className="relative flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Image src="/assets/icons/logo.png" alt="" width={32} height={32} className="size-8 object-contain" />
          <span className="font-heading text-lg tracking-wider text-brand-green uppercase">GreenChillyz</span>
        </div>
        <button
          type="button"
          onClick={closeAuthModal}
          aria-label="Close"
          className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-brand-green cursor-pointer"
        >
          <X className="size-4" strokeWidth={2.5} />
        </button>
      </div>

      {/* View transitions */}
      <div className="relative mt-2">
        <AnimatePresence mode="wait">
          {modalView === 'sign-in' && (
            <motion.div key="v-signin" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={viewTransition}>
              <SignInForm />
            </motion.div>
          )}
          {modalView === 'sign-up' && (
            <motion.div key="v-signup" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={viewTransition}>
              <SignUpForm />
            </motion.div>
          )}
          {modalView === 'forgot-password' && (
            <motion.div key="v-forgot" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={viewTransition}>
              <ForgotPasswordFlow />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
