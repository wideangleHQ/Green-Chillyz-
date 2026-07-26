"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, Coins, X } from "lucide-react";
import { formatCoins } from "@/types/wallet";
import type { Redemption } from "@/types/rewards";
import { VoucherCard } from "./VoucherCard";

interface RedemptionSuccessProps {
  redemption: Redemption | null;
  onClose: () => void;
}

export function RedemptionSuccess({ redemption, onClose }: RedemptionSuccessProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!redemption) return;
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [redemption, onClose]);

  return (
    <AnimatePresence>
      {redemption && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="redemption-success-title"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="relative w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-6 shadow-soft max-h-[90vh] overflow-y-auto"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-5 top-5 size-8 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-on-surface transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>

            <div className="flex flex-col items-center text-center gap-3 mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 260, delay: 0.1 }}
                className="size-16 rounded-full bg-brand-green/10 flex items-center justify-center"
              >
                <CheckCircle2 className="size-8 text-brand-green" aria-hidden="true" />
              </motion.div>

              <h2
                id="redemption-success-title"
                className="font-heading font-extrabold uppercase tracking-tight text-on-surface text-xl"
              >
                Reward Unlocked
              </h2>

              <p className="text-sm font-sans text-stone-600 max-w-[280px]">
                Your voucher is ready. Show the QR code at the counter to claim it.
              </p>

              <div
                className="inline-flex items-center gap-2 rounded-full bg-stone-50 px-4 py-2 text-sm font-sans"
                aria-live="polite"
              >
                <Coins className="size-4 text-brand-green" aria-hidden="true" />
                <span className="text-stone-500">
                  −{formatCoins(redemption.coinsSpent)} spent ·
                </span>
                <span className="font-extrabold text-on-surface">
                  {formatCoins(redemption.newBalance)} left
                </span>
              </div>
            </div>

            <VoucherCard voucher={redemption.voucher} />

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-stone-200 px-5 py-3 font-heading text-sm uppercase tracking-wider text-stone-600 transition-all hover:bg-stone-50 cursor-pointer"
              >
                Keep Browsing
              </button>
              <Link
                href="/rewards/vouchers"
                className="flex-1 inline-flex items-center justify-center rounded-full bg-brand-green px-5 py-3 font-heading text-sm uppercase tracking-wider text-white shadow-soft transition-all hover:bg-brand-green-hover hover:shadow-hover"
              >
                My Vouchers
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
