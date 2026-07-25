import { DayOfWeek, StoreManagerRole, AnnouncementPriority } from '@prisma/client';

export interface StoreResponse {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreDetailResponse extends StoreResponse {
  timings: StoreTimingResponse[];
  facilities: StoreFacilityResponse[];
  gallery: StoreGalleryResponse[];
  announcements: StoreAnnouncementResponse[];
}

export interface NearbyStoreResponse extends StoreResponse {
  distance: number;
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

export interface StoreTimingResponse {
  id: string;
  dayOfWeek: DayOfWeek;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
}

export interface StoreGalleryResponse {
  id: string;
  image: string;
  alt: string | null;
  displayOrder: number;
  createdAt: Date;
}

export interface StoreHolidayResponse {
  id: string;
  date: Date;
  reason: string | null;
  isClosed: boolean;
}

export interface StoreFacilityResponse {
  id: string;
  name: string;
  icon: string | null;
}

export interface StoreManagerResponse {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: StoreManagerRole;
  createdAt: Date;
}

export interface StoreAnnouncementResponse {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  priority: AnnouncementPriority;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
