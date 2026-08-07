"use client";

import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Sparkles, Clock, ArrowUpRight, ShieldCheck, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Offer } from "@/types/offers";

interface OfferCardProps {
  offer: Offer;
  outletName?: string;
}

export const OfferCard = memo(function OfferCard({ offer, outletName }: OfferCardProps) {
  const [copied, setCopied] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleCopyCode = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(offer.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="group relative w-[290px] sm:w-[320px] md:w-[350px] shrink-0 rounded-[28px] bg-white border border-white/80 shadow-soft hover:shadow-hover transition-all duration-500 flex flex-col justify-between overflow-hidden select-none">
      {/* Top Media Showcase Container */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-stone-100">
        <Image
          src={offer.image}
          alt={offer.title}
          fill
          sizes="(max-width: 768px) 80vw, 350px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-106"
        />

        {/* Gradient Mask for Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 z-10">
          {/* Badge Tag */}
          <span className="px-3 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider bg-brand-green text-white shadow-md border-none">
            {offer.badge}
          </span>

          {/* Discount Pill */}
          <span className="px-3 py-1 rounded-full text-xs font-sans font-extrabold uppercase tracking-wider bg-amber-500 text-on-surface shadow-md">
            {offer.discount}
          </span>
        </div>

        {/* Title Overlay on Artwork */}
        <div className="absolute bottom-3.5 left-4 right-4 z-10 flex flex-col gap-0.5">
          <h3 className="text-base sm:text-lg font-sans font-extrabold text-white leading-snug truncate">
            {offer.title}
          </h3>
          <p className="text-xs font-sans text-white/80 line-clamp-1">
            {offer.subtitle}
          </p>
        </div>
      </div>

      {/* Card Content & Coupon Details */}
      <div className="p-4 sm:p-5 flex flex-col gap-3.5 flex-1 justify-between bg-white">
        <p className="text-xs font-sans text-on-surface-variant leading-relaxed line-clamp-2">
          {offer.description}
        </p>

        {/* Validity & Min Order Bar */}
        <div className="flex items-center justify-between text-[11px] font-sans text-on-surface-variant/80 pt-2 border-t border-stone-100">
          <div className="flex items-center gap-1">
            <Clock className="size-3.5 text-brand-green" />
            <span>{offer.validity}</span>
          </div>
          <span className="font-semibold text-stone-600">{offer.minimumOrder}</span>
        </div>

        {/* Coupon Code Copy Box */}
        <div className="relative flex items-center justify-between gap-2 bg-stone-50 p-2.5 rounded-2xl border border-stone-200/80">
          <div className="flex flex-col pl-1">
            <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-stone-400">
              COUPON CODE
            </span>
            <span className="text-xs font-mono font-bold text-on-surface tracking-wider">
              {offer.couponCode}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 shadow-xs text-xs font-sans font-bold text-brand-green transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5 text-brand-green" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Redeem CTA Button */}
        <div className="flex flex-col gap-2 pt-1">
          <Link
            href="/menu"
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand-green hover:bg-brand-green-hover px-5 py-2.5 text-xs font-sans font-bold uppercase tracking-wider text-white shadow-soft transition-all duration-300 hover:scale-102 cursor-pointer"
          >
            <span>Redeem Offer</span>
            <ArrowUpRight className="size-4" />
          </Link>

          {/* Terms Toggle Link */}
          <button
            type="button"
            onClick={() => setShowTerms((v) => !v)}
            className="self-center text-[11px] font-sans text-on-surface-variant hover:text-brand-green flex items-center gap-1 transition-colors cursor-pointer py-0.5"
          >
            <span>Terms &amp; Conditions</span>
            <ChevronDown className={`size-3 transition-transform ${showTerms ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Expandable Terms Drawer */}
      <AnimatePresence>
        {showTerms && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-stone-50 border-t border-stone-200 p-4 text-[11px] font-sans text-on-surface-variant overflow-hidden"
          >
            <div className="flex items-center gap-1.5 font-bold text-on-surface mb-1.5">
              <ShieldCheck className="size-3.5 text-brand-green" />
              <span>Offer Details ({outletName || "Selected Outlet"})</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-stone-600">
              {offer.terms.map((t, idx) => (
                <li key={idx}>{t}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
