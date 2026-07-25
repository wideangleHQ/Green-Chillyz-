"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  OutletLocation,
  Offer,
  OfferCategory,
  LocationPermissionStatus,
} from "@/types/offers";
import { useActiveStores } from "@/hooks/useStores";
import { storeToOutletLocation } from "@/types/store";
import type { NearbyStoreLocatorResponse } from "@/types/store";
import { getNearbyStores } from "@/lib/api/storeApi";
import {
  getOffersByOutlet,
  getCurrentCoordinates,
} from "@/lib/offers/offersService";

const STORAGE_KEY_OUTLET = "gc_selected_outlet_v1";

function tryLoadCachedOutlet(): OutletLocation | null {
  if (typeof window === "undefined") return null;
  const cached = localStorage.getItem(STORAGE_KEY_OUTLET);
  if (!cached) return null;
  try {
    return JSON.parse(cached) as OutletLocation;
  } catch {
    return null;
  }
}

export function useLocationOffers() {
  const { data: stores = [] } = useActiveStores();
  const outlets = useMemo(() => stores.map(storeToOutletLocation), [stores]);

  const [status, setStatus] = useState<LocationPermissionStatus>("idle");
  const [selectedOutlet, setSelectedOutlet] = useState<OutletLocation | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [nearbyResponse, setNearbyResponse] = useState<NearbyStoreLocatorResponse | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [category, setCategory] = useState<OfferCategory>("all");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (selectedOutlet) {
      setLoading(true);
      getOffersByOutlet(selectedOutlet.id, category)
        .then(setOffers)
        .catch(() => setOffers([]))
        .finally(() => setLoading(false));
    }
  }, [selectedOutlet, category]);

  const requestLocation = useCallback(async () => {
    setStatus("requesting");
    setLoading(true);

    try {
      const coords = await getCurrentCoordinates();
      setUserCoords(coords);
      setStatus("granted");

      const response = await getNearbyStores({
        latitude: coords.lat,
        longitude: coords.lng,
        limit: 5,
      });

      setNearbyResponse(response);

      if (response.nearestStore) {
        const nearest: OutletLocation = {
          id: response.nearestStore.id,
          outletName: response.nearestStore.name,
          brand: response.nearestStore.brand as OutletLocation["brand"],
          latitude: response.nearestStore.latitude,
          longitude: response.nearestStore.longitude,
          city: response.nearestStore.city,
          area: response.nearestStore.city,
          address: response.nearestStore.address,
        };
        setSelectedOutlet(nearest);
        setDistanceKm(response.nearestStore.distance);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY_OUTLET, JSON.stringify(nearest));
        }
      } else if (outlets.length > 0) {
        setSelectedOutlet(outlets[0]);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY_OUTLET, JSON.stringify(outlets[0]));
        }
      }
    } catch (error: unknown) {
      const geoError = error as { code?: number };
      if (geoError?.code === 1) {
        setStatus("denied");
      } else {
        setStatus("unavailable");
      }
      setLoading(false);

      const cached = tryLoadCachedOutlet();
      if (cached) {
        setSelectedOutlet(cached);
      } else if (outlets.length > 0) {
        setSelectedOutlet(outlets[0]);
      }
    }
  }, [outlets]);

  const selectOutletManually = useCallback(
    (outlet: OutletLocation) => {
      setSelectedOutlet(outlet);

      if (nearbyResponse) {
        const allItems = [
          nearbyResponse.nearestStore,
          ...nearbyResponse.nearbyStores,
        ].filter(Boolean);
        const match = allItems.find((item) => item!.id === outlet.id);
        setDistanceKm(match ? match!.distance : null);
      } else {
        setDistanceKm(null);
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_OUTLET, JSON.stringify(outlet));
      }
      setIsModalOpen(false);
    },
    [nearbyResponse]
  );

  useEffect(() => {
    if (initRef.current || outlets.length === 0) return;
    initRef.current = true;

    const cached = tryLoadCachedOutlet();
    if (cached) {
      setSelectedOutlet(cached);
      setStatus("granted");
      setLoading(false);
      return;
    }

    requestLocation();
  }, [outlets, requestLocation]);

  return {
    status,
    outlets,
    selectedOutlet,
    distanceKm,
    nearbyResponse,
    offers,
    category,
    setCategory,
    loading,
    requestLocation,
    selectOutletManually,
    isModalOpen,
    setIsModalOpen,
  };
}
