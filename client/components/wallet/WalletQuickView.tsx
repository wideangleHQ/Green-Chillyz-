"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Coins,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCcw,
  Timer,
  Wrench,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useWalletSummary } from "@/hooks/useWallet";
import { formatCoins } from "@/types/wallet";
import type { WalletTransaction, TransactionType } from "@/types/wallet";

interface WalletQuickViewProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_ICONS: Record<TransactionType, React.ReactNode> = {
  CREDIT: <ArrowDownCircle className="size-5 text-emerald-500" />,
  DEBIT: <ArrowUpCircle className="size-5 text-red-500" />,
  REFUND: <RotateCcw className="size-5 text-blue-500" />,
  EXPIRE: <Timer className="size-5 text-amber-500" />,
  ADJUSTMENT: <Wrench className="size-5 text-purple-500" />,
};

const TYPE_COLORS: Record<TransactionType, string> = {
  CREDIT: "text-emerald-600",
  DEBIT: "text-red-600",
  REFUND: "text-blue-600",
  EXPIRE: "text-amber-600",
  ADJUSTMENT: "text-purple-600",
};

export function WalletQuickView({ isOpen, onClose }: WalletQuickViewProps) {
  const { data: summary, isLoading, error } = useWalletSummary(isOpen);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trapping
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex="0"]'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    firstElement?.focus();
    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, [isOpen, summary]);

  const recentTransactions = summary?.recentTransactions?.slice(0, 5) || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/70">
          {/* Backdrop click to close */}
          <div className="absolute inset-0 cursor-default" onClick={onClose} />

          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Wallet summary quick view"
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="relative z-10 w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-3xl p-6 border border-stone-150 shadow-xl overflow-hidden max-h-[90vh] flex flex-col gap-5 sm:gap-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Coins className="size-5 text-brand-green" />
                <h3 className="font-heading text-lg font-bold text-on-surface uppercase tracking-wide">
                  My Wallet
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close wallet view"
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-5">
              {isLoading ? (
                /* Skeleton Loader */
                <div className="flex flex-col gap-6 animate-pulse">
                  <div className="h-32 bg-stone-100 rounded-2xl w-full" />
                  <div className="flex flex-col gap-3">
                    <div className="h-4 bg-stone-100 rounded w-1/3" />
                    <div className="h-12 bg-stone-100 rounded-xl" />
                    <div className="h-12 bg-stone-100 rounded-xl" />
                    <div className="h-12 bg-stone-100 rounded-xl" />
                  </div>
                </div>
              ) : error ? (
                /* Error State */
                <div className="text-center py-8 flex flex-col items-center gap-3">
                  <div className="size-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                    <X className="size-6" />
                  </div>
                  <h4 className="font-sans font-bold text-stone-800">Failed to load wallet</h4>
                  <p className="text-xs font-sans text-stone-500 max-w-xs">
                    Please make sure you are signed in and have a stable network connection.
                  </p>
                </div>
              ) : (
                /* Main Summary Content */
                <>
                  {/* Balance Display Card */}
                  <div className="bg-gradient-to-br from-brand-green to-brand-green-hover rounded-2xl p-5 text-white shadow-soft relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
                      <Coins className="size-36" />
                    </div>
                    <div>
                      <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-white/70">
                        Available Balance
                      </p>
                      <p className="text-3xl font-heading font-extrabold tracking-tight mt-1 flex items-baseline gap-1">
                        <span className="font-sans">{formatCoins(summary!.balance)}</span>
                        <span className="text-xs font-sans font-bold text-white/80">coins</span>
                      </p>
                      {summary!.pendingBalance > 0 && (
                        <p className="text-[11px] font-sans text-white/80 mt-1 flex items-center gap-1">
                          <Clock className="size-3 shrink-0" />
                          <span>{formatCoins(summary!.pendingBalance)} pending verification</span>
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
                      <div>
                        <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-white/60">
                          Lifetime Earned
                        </span>
                        <p className="text-sm font-sans font-extrabold mt-0.5">
                          {formatCoins(summary!.lifetimeEarned)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-white/60">
                          Lifetime Spent
                        </span>
                        <p className="text-sm font-sans font-extrabold mt-0.5">
                          {formatCoins(summary!.lifetimeSpent)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Transactions Section */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-stone-400">
                      Recent Activity
                    </h4>

                    {recentTransactions.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
                        <p className="text-xs font-sans text-stone-400">No transactions yet.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {recentTransactions.map((txn) => {
                          const isCredit = txn.type === "CREDIT" || txn.type === "REFUND";
                          const sign = isCredit ? "+" : "-";

                          return (
                            <div
                              key={txn.id}
                              className="flex items-center justify-between p-3 rounded-xl border border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition-colors gap-3"
                            >
                              <div className="size-9 rounded-full bg-white flex items-center justify-center shrink-0 border border-stone-100">
                                {TYPE_ICONS[txn.type]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-sans font-bold text-stone-800 truncate leading-snug">
                                  {txn.description}
                                </p>
                                <p className="text-[10px] font-sans text-stone-400 mt-0.5 leading-none">
                                  {new Date(txn.createdAt).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </p>
                              </div>
                              <p
                                className={`text-xs font-sans font-extrabold shrink-0 ${TYPE_COLORS[txn.type]}`}
                              >
                                {sign}
                                {formatCoins(txn.amount)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Actions Footer */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-100 shrink-0">
              <Link
                href="#games"
                onClick={onClose}
                className="w-full font-sans font-semibold py-3 px-4 rounded-full bg-brand-green hover:bg-brand-green-hover text-white transition flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider shadow-soft cursor-pointer text-center"
              >
                <Sparkles className="size-3.5" />
                Earn Coins
              </Link>
              <Link
                href="/wallet"
                onClick={onClose}
                className="w-full font-sans font-semibold py-3 px-4 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 transition flex items-center justify-center text-xs uppercase tracking-wider cursor-pointer text-center"
              >
                Full History
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
