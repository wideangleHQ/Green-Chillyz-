import { OnboardingStoredData, CookiePreferences } from "@/types/onboarding";

const STORAGE_KEY = "gc_onboarding_preferences_v1";
const LOCATION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days expiry

export const DEFAULT_COOKIES: CookiePreferences = {
  essential: true,
  analytics: true,
  personalization: true,
  marketing: false,
};

export const ESSENTIAL_ONLY_COOKIES: CookiePreferences = {
  essential: true,
  analytics: false,
  personalization: false,
  marketing: false,
};

export function getStoredOnboardingData(): OnboardingStoredData | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: OnboardingStoredData = JSON.parse(raw);

    // Check location expiry
    if (data.timestamp && Date.now() - data.timestamp > LOCATION_EXPIRY_MS) {
      data.locationHandled = false;
      data.locationStatus = "prompt";
    }

    return data;
  } catch (error) {
    console.warn("Failed to parse onboarding data from localStorage:", error);
    return null;
  }
}

export function saveOnboardingData(data: Partial<OnboardingStoredData>): OnboardingStoredData {
  const existing = getStoredOnboardingData() || {
    cookiesHandled: false,
    cookiePreferences: DEFAULT_COOKIES,
    locationHandled: false,
    locationStatus: "prompt",
  };

  const updated: OnboardingStoredData = {
    ...existing,
    ...data,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn("Failed to save onboarding data to localStorage:", error);
    }
  }

  return updated;
}
