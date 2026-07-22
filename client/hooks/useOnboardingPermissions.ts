"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CookiePreferences,
  OnboardingStep,
  OnboardingStoredData,
} from "@/types/onboarding";
import {
  getStoredOnboardingData,
  saveOnboardingData,
  DEFAULT_COOKIES,
  ESSENTIAL_ONLY_COOKIES,
} from "@/lib/onboarding/storage";

export function useOnboardingPermissions() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<OnboardingStep>("cookies");
  const [cookiePrefs, setCookiePrefs] = useState<CookiePreferences>(DEFAULT_COOKIES);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<
    "granted" | "denied" | "prompt" | "unavailable"
  >("prompt");

  // Check on mount if user has unhandled preferences
  useEffect(() => {
    const data = getStoredOnboardingData();

    if (!data) {
      // First visit ever
      setIsOpen(true);
      setStep("cookies");
      return;
    }

    if (!data.cookiesHandled) {
      setIsOpen(true);
      setStep("cookies");
      return;
    }

    if (!data.locationHandled) {
      setIsOpen(true);
      setStep("location");
      return;
    }

    // Both handled
    setIsOpen(false);
    setStep("complete");
  }, []);

  // Action: Accept All Cookies
  const acceptAllCookies = useCallback(() => {
    setCookiePrefs(DEFAULT_COOKIES);
    saveOnboardingData({
      cookiesHandled: true,
      cookiePreferences: DEFAULT_COOKIES,
    });
    setStep("location");
  }, []);

  // Action: Essential Only Cookies
  const acceptEssentialOnly = useCallback(() => {
    setCookiePrefs(ESSENTIAL_ONLY_COOKIES);
    saveOnboardingData({
      cookiesHandled: true,
      cookiePreferences: ESSENTIAL_ONLY_COOKIES,
    });
    setStep("location");
  }, []);

  // Action: Save Custom Preferences
  const saveCustomPreferences = useCallback((prefs: CookiePreferences) => {
    setCookiePrefs(prefs);
    saveOnboardingData({
      cookiesHandled: true,
      cookiePreferences: prefs,
    });
    setStep("location");
  }, []);

  // Action: Enable Geolocation
  const requestLocationPermission = useCallback(async () => {
    setLocationLoading(true);

    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationStatus("unavailable");
      saveOnboardingData({
        locationHandled: true,
        locationStatus: "unavailable",
      });
      setLocationLoading(false);
      setIsOpen(false);
      setStep("complete");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocationStatus("granted");
        saveOnboardingData({
          locationHandled: true,
          locationStatus: "granted",
          lat,
          lng,
          timestamp: Date.now(),
        });
        setLocationLoading(false);
        setIsOpen(false);
        setStep("complete");
      },
      (error) => {
        console.warn("Location permission denied or error:", error);
        const newStatus = error.code === 1 ? "denied" : "unavailable";
        setLocationStatus(newStatus);
        saveOnboardingData({
          locationHandled: true,
          locationStatus: newStatus,
          timestamp: Date.now(),
        });
        setLocationLoading(false);
        setIsOpen(false);
        setStep("complete");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);

  // Action: Skip Location
  const skipLocation = useCallback(() => {
    saveOnboardingData({
      locationHandled: true,
      locationStatus: "prompt",
    });
    setIsOpen(false);
    setStep("complete");
  }, []);

  // Manual Reset for Testing / Settings
  const resetPermissions = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("gc_onboarding_preferences_v1");
    }
    setIsOpen(true);
    setStep("cookies");
    setCookiePrefs(DEFAULT_COOKIES);
  }, []);

  return {
    isOpen,
    step,
    setStep,
    cookiePrefs,
    locationLoading,
    locationStatus,
    acceptAllCookies,
    acceptEssentialOnly,
    saveCustomPreferences,
    requestLocationPermission,
    skipLocation,
    resetPermissions,
  };
}
