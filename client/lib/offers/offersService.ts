import { Offer, OfferCategory } from "@/types/offers";
import { MOCK_OFFERS } from "./mockOffersData";

export async function getOffersByOutlet(
  _outletId: string,
  category: OfferCategory = "all"
): Promise<Offer[]> {
  let filtered = MOCK_OFFERS.filter((o) => o.active);
  if (category !== "all") {
    filtered = filtered.filter((o) => o.category === category);
  }
  return filtered.sort((a, b) => a.priority - b.priority);
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
      }
    );
  });
}
