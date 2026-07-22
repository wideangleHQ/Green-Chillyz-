export interface OutletLocation {
  id: string;
  outletName: string;
  brand: "GreenChillyz" | "YellowChillyz" | "GoldenChillyz";
  latitude: number;
  longitude: number;
  city: string;
  area: string;
  address: string;
}

export type OfferCategory = "all" | "combos" | "dine-in" | "delivery" | "rewards";

export interface Offer {
  offerId: string;
  outletId: string;
  title: string;
  subtitle: string;
  description: string;
  discount: string;
  validity: string;
  couponCode: string;
  minimumOrder: string;
  image: string;
  badge: string;
  category: OfferCategory;
  terms: string[];
  priority: number;
  active: boolean;
}

export type LocationPermissionStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable";
