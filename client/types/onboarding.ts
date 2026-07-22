export interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean;
  personalization: boolean;
  marketing: boolean;
}

export type OnboardingStep = "cookies" | "preferences" | "location" | "complete";

export interface OnboardingStoredData {
  cookiesHandled: boolean;
  cookiePreferences: CookiePreferences;
  locationHandled: boolean;
  locationStatus: "granted" | "denied" | "prompt" | "unavailable";
  lat?: number;
  lng?: number;
  timestamp?: number;
}
