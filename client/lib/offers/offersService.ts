import type { Offer, OfferCategory } from "@/types/offers";
import type { StoreVoucherItem, StoreVoucherType } from "@/types/rewards";
import { VOUCHER_TYPE_LABELS } from "@/types/rewards";

const VOUCHER_TYPE_CATEGORY: Partial<Record<StoreVoucherType, OfferCategory>> = {
  COMBO: "combos",
  FREE_ITEM: "rewards",
  FREE_BEVERAGE: "rewards",
  GIFT: "rewards",
  COIN_VOUCHER: "rewards",
};

function formatDecimal(value: string | number | null): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "string" ? parseFloat(value) || 0 : value;
}

function formatDiscount(v: StoreVoucherItem): string {
  if (v.discountBadge) return v.discountBadge;
  const val = formatDecimal(v.voucherValue);
  if (val <= 0) return "Special Offer";
  if (v.voucherType === "PERCENTAGE") return `${val}% OFF`;
  return `₹${val} OFF`;
}

function formatValidity(v: StoreVoucherItem): string {
  if (v.validTime) return v.validTime;
  if (v.endDate) {
    const end = new Date(v.endDate);
    return `Valid till ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
  }
  return "No expiry";
}

function formatMinOrder(value: string | number | null): string {
  const num = formatDecimal(value);
  if (num <= 0) return "No minimum";
  return `Min. ₹${num}`;
}

export function mapVoucherToOffer(
  v: StoreVoucherItem,
  outletId: string,
): Offer {
  return {
    offerId: v.id,
    outletId,
    title: v.name,
    subtitle: v.shortTitle ?? VOUCHER_TYPE_LABELS[v.voucherType],
    description: v.description ?? "",
    discount: formatDiscount(v),
    validity: formatValidity(v),
    couponCode: v.couponCode,
    minimumOrder: formatMinOrder(v.minimumOrderValue),
    image: v.offerImage ?? "",
    badge: v.offerTag ?? VOUCHER_TYPE_LABELS[v.voucherType],
    category: VOUCHER_TYPE_CATEGORY[v.voucherType] ?? "all",
    terms: v.terms ?? [],
    priority: 0,
    active: true,
  };
}

export function mapAndFilterVouchers(
  vouchers: StoreVoucherItem[],
  outletId: string,
  category: OfferCategory,
): Offer[] {
  let mapped = vouchers.map((v) => mapVoucherToOffer(v, outletId));
  if (category !== "all") {
    mapped = mapped.filter((o) => o.category === category);
  }
  return mapped;
}

export function getCurrentCoordinates(): Promise<{
  lat: number;
  lng: number;
}> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  });
}
