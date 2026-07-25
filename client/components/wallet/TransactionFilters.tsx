"use client";

import type { TransactionType, TransactionSource } from "@/types/wallet";

interface TransactionFiltersProps {
  type: TransactionType | undefined;
  source: TransactionSource | undefined;
  onTypeChange: (type: TransactionType | undefined) => void;
  onSourceChange: (source: TransactionSource | undefined) => void;
}

const TYPE_OPTIONS: { label: string; value: TransactionType | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Earned", value: "CREDIT" },
  { label: "Spent", value: "DEBIT" },
  { label: "Refunded", value: "REFUND" },
  { label: "Expired", value: "EXPIRE" },
];

const SOURCE_OPTIONS: { label: string; value: TransactionSource | undefined }[] = [
  { label: "All Sources", value: undefined },
  { label: "Cashback", value: "ORDER_CASHBACK" },
  { label: "Referral", value: "REFERRAL_BONUS" },
  { label: "Signup", value: "SIGNUP_BONUS" },
  { label: "Review", value: "REVIEW_REWARD" },
  { label: "Promo", value: "PROMO_CODE" },
  { label: "Order", value: "ORDER_PAYMENT" },
];

export function TransactionFilters({
  type,
  source,
  onTypeChange,
  onSourceChange,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onTypeChange(opt.value)}
            className={`px-4 py-2 rounded-full text-xs font-sans font-bold uppercase tracking-wider transition-all duration-300 shrink-0 cursor-pointer ${
              type === opt.value
                ? "bg-brand-green text-white shadow-md scale-105"
                : "bg-white/80 text-on-surface-variant hover:bg-white hover:text-on-surface border border-white/80 shadow-xs"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SOURCE_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onSourceChange(opt.value)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-sans font-bold transition-all duration-200 shrink-0 cursor-pointer ${
              source === opt.value
                ? "bg-on-surface text-white"
                : "bg-stone-100 text-on-surface-variant hover:bg-stone-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
