"use client";

import { useState, useEffect, useCallback } from "react";
import {
  OutletLocation,
  Offer,
  OfferCategory,
  LocationPermissionStatus,
} from "@/types/offers";
import {
  getOutletList,
  getNearestOutlet,
  getOffersByOutlet,
  getCurrentCoordinates,
  calculateDistanceKm,
} from "@/lib/offers/offersService";

const STORAGE_KEY_OUTLET = "gc_selected_outlet_v1";

export function useLocationOffers() {
  const [status, setStatus] = useState<LocationPermissionStatus>("idle");
  const [outlets, setOutlets] = useState<OutletLocation[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<OutletLocation | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [category, setCategory] = useState<OfferCategory>("all");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Load Outlets list on mount
  useEffect(() => {
    let mounted = true;
    getOutletList().then((data) => {
      if (mounted) setOutlets(data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Load Offers when selectedOutlet or category changes
  const loadOffers = useCallback(
    async (outletId: string, cat: OfferCategory) => {
      setLoading(true);
      try {
        const fetchedOffers = await getOffersByOutlet(outletId, cat);
        setOffers(fetchedOffers);
      } catch (err) {
        console.error("Error loading offers:", err);
        setOffers([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedOutlet) {
      loadOffers(selectedOutlet.id, category);
    }
  }, [selectedOutlet, category, loadOffers]);

  // Request browser location
  const requestLocation = useCallback(async () => {
    setStatus("requesting");
    setLoading(true);

    try {
      const coords = await getCurrentCoordinates();
      setUserCoords(coords);
      setStatus("granted");

      const { outlet, distanceKm: dist } = await getNearestOutlet(
        coords.lat,
        coords.lng
      );
      setSelectedOutlet(outlet);
      setDistanceKm(dist);

      // Save to cache
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_OUTLET, JSON.stringify(outlet));
      }
    } catch (error: any) {
      console.warn("Geolocation permission error or unavailable:", error);
      if (error && error.code === 1) {
        // PERMISSION_DENIED
        setStatus("denied");
      } else {
        setStatus("unavailable");
      }
      setLoading(false);

      // Fallback: load default / cached outlet if available
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(STORAGE_KEY_OUTLET);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as OutletLocation;
            setSelectedOutlet(parsed);
            return;
          } catch (e) {
            // ignore
          }
        }
      }
      // If no cache, select Whitefield default
      const defaultOutlet = outlets.find((o) => o.id === "out-whitefield") || outlets[0];
      if (defaultOutlet) setSelectedOutlet(defaultOutlet);
    }
  }, [outlets]);

  // Select outlet manually
  const selectOutletManually = useCallback(
    (outlet: OutletLocation) => {
      setSelectedOutlet(outlet);
      if (userCoords) {
        const dist = calculateDistanceKm(
          userCoords.lat,
          userCoords.lng,
          outlet.latitude,
          outlet.longitude
        );
        setDistanceKm(dist);
      } else {
        setDistanceKm(null);
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_OUTLET, JSON.stringify(outlet));
      }
      setIsModalOpen(false);
    },
    [userCoords]
  );

  // Auto-run geolocation check on first load if available
  useEffect(() => {
    // Check if user previously saved an outlet
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(STORAGE_KEY_OUTLET);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as OutletLocation;
          setSelectedOutlet(parsed);
          setStatus("granted");
          setLoading(false);
          return;
        } catch (e) {
          // ignore
        }
      }
    }

    // Otherwise prompt location on first visit
    requestLocation();
  }, [requestLocation]);

  return {
    status,
    outlets,
    selectedOutlet,
    distanceKm,
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
