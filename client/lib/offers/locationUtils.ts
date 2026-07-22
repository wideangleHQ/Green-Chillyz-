import { OutletLocation } from "@/types/offers";

/**
 * Calculates distance in kilometers between two lat/lng coordinates
 * using the Haversine formula.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return Math.round(distance * 10) / 10;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Finds the nearest outlet given a set of user coordinates
 */
export function findNearestOutlet(
  userLat: number,
  userLng: number,
  outlets: OutletLocation[]
): { outlet: OutletLocation; distanceKm: number } {
  if (!outlets || outlets.length === 0) {
    throw new Error("No outlets available");
  }

  let minDistance = Infinity;
  let nearestOutlet = outlets[0];

  for (const outlet of outlets) {
    const dist = calculateDistanceKm(
      userLat,
      userLng,
      outlet.latitude,
      outlet.longitude
    );
    if (dist < minDistance) {
      minDistance = dist;
      nearestOutlet = outlet;
    }
  }

  return { outlet: nearestOutlet, distanceKm: minDistance };
}
