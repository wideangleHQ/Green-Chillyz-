"use client";

import { useEffect, useRef, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, AlertCircle, Loader2 } from "lucide-react";
import { formatCoins } from "@/types/wallet";
import type { RewardDetail, EligibilityResult } from "@/types/rewards";

interface RedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reward: RewardDetail;
  eligibility?: EligibilityResult;
  isRedeeming: boolean;
  error?: string | null;
}

export function RedeemModal({
  isOpen,
  onClose,
  onConfirm,
  reward,
  eligibility,
  isRedeeming,
  error,
}: RedeemModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  // Move focus into the dialog on open and restore it on close.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, [isOpen]);

  // Escape to dismiss, Tab cycles within the dialog.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isRedeeming) {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isRedeeming, onClose]);

  const canRedeem = eligibility?.eligible ?? false;
  const balanceAfter =
    eligibility !== undefined ? eligibility.balance - reward.coinCost : undefined;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isRedeeming && onClose()}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-6 shadow-soft"
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <h2
                id={titleId}
                className="font-heading font-extrabold uppercase tracking-tight text-on-surface text-lg"
              >
                Confirm Redemption
              </h2>
              <button
                type="button"
                onClick={onClose}
                disabled={isRedeeming}
                aria-label="Close dialog"
                className="size-8 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-on-surface transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>

            <p id={descId} className="text-sm font-sans text-stone-600 mb-5">
              You are about to redeem{" "}
              <span className="font-bold text-on-surface">{reward.title}</span>.
              This will deduct coins from your wallet and issue a voucher.
            </p>

            <div className="rounded-2xl bg-stone-50 p-4 flex flex-col gap-3 mb-5">
              <Row
                label="Reward cost"
                value={
                  <span className="inline-flex items-center gap-1 text-brand-green">
                    <Coins className="size-4" aria-hidden="true" />
                    {formatCoins(reward.coinCost)}
                  </span>
                }
              />
              {eligibility && (
                <>
                  <Row
                    label="Current balance"
                    value={`${formatCoins(eligibility.balance)} coins`}
                  />
                  {balanceAfter !== undefined && balanceAfter >= 0 && (
                    <Row
                      label="Balance after"
                      value={`${formatCoins(balanceAfter)} coins`}
                      emphasis
                    />
                  )}
                </>
              )}
            </div>

            {(error || (eligibility && !eligibility.eligible)) && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-2xl bg-red-50 p-3 mb-5 text-xs font-sans text-red-700"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error ?? eligibility?.reason}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isRedeeming}
                className="flex-1 rounded-full border border-stone-200 px-5 py-3 font-heading text-sm uppercase tracking-wider text-stone-600 transition-all hover:bg-stone-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={onConfirm}
                disabled={!canRedeem || isRedeeming}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-brand-green px-5 py-3 font-heading text-sm uppercase tracking-wider text-white shadow-soft transition-all hover:bg-brand-green-hover hover:shadow-hover cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRedeeming && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                {isRedeeming ? "Redeeming…" : "Redeem"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Row({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm font-sans">
      <span className="text-stone-500">{label}</span>
      <span
        className={
          emphasis ? "font-extrabold text-on-surface" : "font-bold text-on-surface"
        }
      >
        {value}
      </span>
    </div>
  );
}
