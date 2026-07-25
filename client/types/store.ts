import type { OutletLocation } from "./offers";

export interface Store {
  id: string;
  brandId: string;
  brandName: string;
  brandSlug: string;
  name: string;
  slug: string;
  code: string;
  description: string | null;
  shortDescription: string | null;
  email: string | null;
  phone: string | null;
  alternatePhone: string | null;
  website: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  googleMapsLink: string | null;
  placeId: string | null;
  thumbnailImage: string | null;
  coverImage: string | null;
  logo: string | null;
  isActive: boolean;
  isFeatured: boolean;
  supportsDelivery: boolean;
  supportsTakeaway: boolean;
  supportsDineIn: boolean;
  averageRating: number;
  totalReviews: number;
  isOpenNow?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NearbyStore extends Store {
  distance: number;
}

export interface StoreTiming {
  id: string;
  dayOfWeek: string;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
}

export interface StoreFacility {
  id: string;
  name: string;
  icon: string | null;
}

export interface StoreGalleryItem {
  id: string;
  image: string;
  alt: string | null;
  displayOrder: number;
  createdAt: string;
}

export interface StoreAnnouncement {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  priority: string;
  isActive: boolean;
}

export interface StoreDetail extends Store {
  timings: StoreTiming[];
  facilities: StoreFacility[];
  gallery: StoreGalleryItem[];
  announcements: StoreAnnouncement[];
}

export interface StoreQueryParams {
  page?: number;
  pageSize?: number;
  city?: string;
  state?: string;
  brandId?: string;
  name?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface NearbyQueryParams {
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
  brandId?: string;
}

export interface NearbyStoreLocatorItem {
  id: string;
  brand: string;
  brandSlug: string;
  name: string;
  slug: string;
  distance: number;
  isOpenNow: boolean;
  supportsDelivery: boolean;
  supportsTakeaway: boolean;
  supportsDineIn: boolean;
  phone: string | null;
  address: string;
  city: string;
  state: string;
  coverImage: string | null;
  logo: string | null;
  averageRating: number;
  totalReviews: number;
  isFeatured: boolean;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
}

export interface NearbyStoreLocatorResponse {
  nearestStore: NearbyStoreLocatorItem | null;
  nearbyStores: NearbyStoreLocatorItem[];
  userLocation: { latitude: number; longitude: number };
  total: number;
}

export interface PaginatedStores {
  items: Store[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export type BrandTheme = "green" | "yellow" | "gold";

export function getBrandTheme(brandName: string): BrandTheme {
  const lower = brandName.toLowerCase();
  if (lower.includes("yellow")) return "yellow";
  if (lower.includes("golden")) return "gold";
  return "green";
}

export function getFullAddress(store: Store): string {
  const parts = [store.addressLine1];
  if (store.addressLine2) parts.push(store.addressLine2);
  parts.push(store.city);
  return parts.join(", ");
}

export function getStoreArea(store: Store): string {
  if (store.name.startsWith(store.brandName)) {
    const area = store.name.slice(store.brandName.length).trim();
    if (area) return area;
  }
  return store.city;
}

export function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m away`;
  }
  return `${km.toFixed(1)} km away`;
}

export function storeToOutletLocation(store: Store): OutletLocation {
  let brand: OutletLocation["brand"] = "GreenChillyz";
  const lower = store.brandName.toLowerCase();
  if (lower.includes("yellow")) brand = "YellowChillyz";
  else if (lower.includes("golden")) brand = "GoldenChillyz";

  return {
    id: store.id,
    outletName: store.name,
    brand,
    latitude: store.latitude,
    longitude: store.longitude,
    city: store.city,
    area: getStoreArea(store),
    address: getFullAddress(store),
  };
}
