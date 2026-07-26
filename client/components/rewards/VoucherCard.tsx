"use client";

import { memo, useState } from "react";
import { QrCode, Clock, CheckCircle2, XCircle, Store, Package } from "lucide-react";
import type { Voucher, VoucherStatus } from "@/types/rewards";

interface VoucherCardProps {
  voucher: Voucher;
}

const STATUS_STYLES: Record<VoucherStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-brand-green/10 text-brand-green" },
  USED: { label: "Used", className: "bg-stone-100 text-stone-500" },
  EXPIRED: { label: "Expired", className: "bg-amber-50 text-amber-700" },
  CANCELLED: { label: "Cancelled", className: "bg-red-50 text-red-600" },
  INVALID: { label: "Invalid", className: "bg-red-50 text-red-600" },
};

const STATUS_ICONS: Record<VoucherStatus, React.ReactNode> = {
  ACTIVE: <Clock className="size-3.5" aria-hidden="true" />,
  USED: <CheckCircle2 className="size-3.5" aria-hidden="true" />,
  EXPIRED: <XCircle className="size-3.5" aria-hidden="true" />,
  CANCELLED: <XCircle className="size-3.5" aria-hidden="true" />,
  INVALID: <XCircle className="size-3.5" aria-hidden="true" />,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function VoucherCardBase({ voucher }: VoucherCardProps) {
  const [showQr, setShowQr] = useState(false);
  const status = STATUS_STYLES[voucher.status];
  const canShowQr = voucher.status === "ACTIVE" && Boolean(voucher.qrCodeDataUrl);

  return (
    <article className="rounded-[24px] bg-white border border-white/80 shadow-xs overflow-hidden">
      <div className="flex gap-4 p-4">
        <div className="size-20 shrink-0 rounded-2xl bg-stone-100 overflow-hidden">
          {voucher.reward.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={voucher.reward.image}
              alt=""
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
          ) : (
            <div className="size-full flex items-center justify-center text-stone-300">
              <Package className="size-7" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-sans font-extrabold uppercase tracking-tight text-on-surface text-sm leading-snug line-clamp-2">
              {voucher.reward.title}
            </h3>
            <span
              className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-wider ${status.className}`}
            >
              {STATUS_ICONS[voucher.status]}
              {status.label}
            </span>
          </div>

          <p className="font-mono text-xs tracking-widest text-stone-500">
            {voucher.code}
          </p>

          {voucher.store && (
            <p className="inline-flex items-center gap-1.5 text-xs font-sans text-stone-500">
              <Store className="size-3.5" aria-hidden="true" />
              {voucher.store.name}
            </p>
          )}

          <p className="text-xs font-sans text-stone-400">
            {voucher.status === "USED" && voucher.redeemedAt
              ? `Used on ${formatDate(voucher.redeemedAt)}`
              : `Valid until ${formatDate(voucher.expiresAt)}`}
          </p>
        </div>
      </div>

      {canShowQr && (
        <div className="border-t border-stone-100">
          <button
            type="button"
            onClick={() => setShowQr((prev) => !prev)}
            aria-expanded={showQr}
            aria-controls={`qr-${voucher.id}`}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-sans font-bold uppercase tracking-wider text-brand-green transition-colors hover:bg-brand-green/5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-green"
          >
            <QrCode className="size-4" aria-hidden="true" />
            {showQr ? "Hide QR Code" : "Show QR Code"}
          </button>

          {showQr && (
            <div
              id={`qr-${voucher.id}`}
              className="flex flex-col items-center gap-2 px-4 pb-5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={voucher.qrCodeDataUrl as string}
                alt={`QR code for voucher ${voucher.code}`}
                width={200}
                height={200}
                className="rounded-2xl border border-stone-100"
              />
              <p className="text-[11px] font-sans text-stone-400 text-center max-w-[220px]">
                Show this at the counter to claim your reward.
              </p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export const VoucherCard = memo(VoucherCardBase);
