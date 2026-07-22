import { OutletLocation, Offer, OfferCategory } from "@/types/offers";
import { MOCK_OUTLETS, MOCK_OFFERS } from "./mockOffersData";
import { findNearestOutlet, calculateDistanceKm } from "./locationUtils";

/**
 * Service Layer Abstraction for Offers & Locations.
 * 
 * Future Backend Integration Note:
 * Replace mocked Promises and functions inside this file with real REST/GraphQL API calls
 * (`fetch('/api/outlets')`, `fetch('/api/offers?outletId=...')`).
 * No UI components or React hooks need modification when switching to production backend.
 */

const LATENCY_MS = 350; // Simulates network roundtrip for smooth loading states

export async function getOutletList(): Promise<OutletLocation[]> {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
  return [...MOCK_OUTLETS];
}

export async function getNearestOutlet(
  lat: number,
  lng: number
): Promise<{ outlet: OutletLocation; distanceKm: number }> {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
  const outlets = MOCK_OUTLETS;
  return findNearestOutlet(lat, lng, outlets);
}

export async function getOffersByOutlet(
  outletId: string,
  category: OfferCategory = "all"
): Promise<Offer[]> {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
  let filtered = MOCK_OFFERS.filter(
    (o) => o.outletId === outletId && o.active
  );

  if (category !== "all") {
    filtered = filtered.filter((o) => o.category === category);
  }

  // Sort by Priority first, then by Validity/OfferId
  return filtered.sort((a, b) => a.priority - b.priority);
}

export async function getCurrentCoordinates(): Promise<{
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
        maximumAge: 300000, // 5 minutes cache
      }
    );
  });
}

export { calculateDistanceKm };
