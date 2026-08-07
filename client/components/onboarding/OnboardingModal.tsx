"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cookie,
  MapPin,
  Sparkles,
  Check,
  ShieldCheck,
  ChevronRight,
  SlidersHorizontal,
  Navigation,
} from "lucide-react";
import { useOnboardingPermissions } from "@/hooks/useOnboardingPermissions";
import { CookiePreferences } from "@/types/onboarding";

export function OnboardingModal() {
  const {
    isOpen,
    step,
    setStep,
    cookiePrefs,
    locationLoading,
    acceptAllCookies,
    acceptEssentialOnly,
    saveCustomPreferences,
    requestLocationPermission,
    skipLocation,
  } = useOnboardingPermissions();

  const [tempPrefs, setTempPrefs] = useState<CookiePreferences>(cookiePrefs);

  useEffect(() => {
    setTempPrefs(cookiePrefs);
  }, [cookiePrefs]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto select-none">
        {/* Soft Ambient Backdrop Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-on-surface/50"
        />

        {/* Modal Main Dialog Container */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white rounded-[32px] p-6 sm:p-8 shadow-floating border border-stone-200/80 z-10 flex flex-col gap-6 overflow-hidden my-auto"
        >
          {/* Subtle Ambient Decorative Radial Glow */}
          <div className="absolute top-0 right-0 size-48 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />

          {/* STEP 1: COOKIE CONSENT */}
          {step === "cookies" && (
            <motion.div
              key="step-cookies"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-5"
            >
              {/* Header Badge */}
              <div className="flex items-center gap-2">
                <div className="size-10 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                  <Cookie className="size-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-brand-green">
                    WELCOME TO GREENCHILLYZ
                  </span>
                  <span className="text-xs font-sans text-on-surface-variant font-medium">
                    Privacy &amp; Experience Preferences
                  </span>
                </div>
              </div>

              {/* Main Heading */}
              <div className="flex flex-col gap-1.5">
                <h2 className="text-2xl sm:text-3xl font-heading text-on-surface font-extrabold uppercase tracking-tight leading-none">
                  Personalize Your <span className="text-brand-green">Dining.</span>
                </h2>
                <p className="text-xs sm:text-sm font-sans text-on-surface-variant leading-relaxed">
                  We use cookies and location services to elevate your experience — remembering your favorite outlets, active dining deals, and delivery speeds.
                </p>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/60">
                <div className="flex items-center gap-2 text-xs font-sans font-semibold text-stone-700">
                  <ShieldCheck className="size-4 text-brand-green shrink-0" />
                  <span>Essential Security</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-sans font-semibold text-stone-700">
                  <Sparkles className="size-4 text-amber-500 shrink-0" />
                  <span>Personalized Deals</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={acceptAllCookies}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-brand-green hover:bg-brand-green-hover text-white px-6 py-3.5 text-xs font-sans font-bold uppercase tracking-wider shadow-soft transition-all duration-200 cursor-pointer hover:scale-102"
                >
                  <span>Accept All Preferences</span>
                  <ChevronRight className="size-4" />
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={acceptEssentialOnly}
                    className="w-full py-3 px-4 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-sans font-bold uppercase tracking-wider transition-colors cursor-pointer text-center"
                  >
                    Essential Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("preferences")}
                    className="w-full py-3 px-4 rounded-full bg-stone-100 hover:bg-stone-200 text-brand-green text-[11px] font-sans font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <SlidersHorizontal className="size-3.5" />
                    <span>Manage</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: MANAGE PREFERENCES PANEL */}
          {step === "preferences" && (
            <motion.div
              key="step-preferences"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-heading text-on-surface uppercase font-extrabold">
                  Cookie Settings
                </h3>
                <span className="text-xs font-sans text-brand-green font-bold uppercase tracking-wider">
                  Step 2 of 2
                </span>
              </div>

              {/* Preferences Toggles List */}
              <div className="flex flex-col gap-3">
                {/* Essential */}
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-sans font-bold text-on-surface flex items-center gap-1.5">
                      Essential Cookies <span className="text-[10px] text-stone-400 font-normal">(Required)</span>
                    </span>
                    <span className="text-[11px] font-sans text-on-surface-variant">
                      Required for site security, navigation &amp; cart functionality.
                    </span>
                  </div>
                  <div className="size-5 rounded-full bg-brand-green text-white flex items-center justify-center shrink-0">
                    <Check className="size-3 stroke-[3]" />
                  </div>
                </div>

                {/* Analytics */}
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-sans font-bold text-on-surface">
                      Performance &amp; Analytics
                    </span>
                    <span className="text-[11px] font-sans text-on-surface-variant">
                      Helps us measure site performance and improve user flows.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={tempPrefs.analytics}
                    onChange={(e) =>
                      setTempPrefs((p) => ({ ...p, analytics: e.target.checked }))
                    }
                    className="size-5 accent-brand-green rounded cursor-pointer"
                  />
                </div>

                {/* Personalization */}
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-sans font-bold text-on-surface">
                      Personalization
                    </span>
                    <span className="text-[11px] font-sans text-on-surface-variant">
                      Remembers your favorite outlets, rewards coins &amp; preferences.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={tempPrefs.personalization}
                    onChange={(e) =>
                      setTempPrefs((p) => ({ ...p, personalization: e.target.checked }))
                    }
                    className="size-5 accent-brand-green rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("cookies")}
                  className="px-5 py-2.5 rounded-full bg-stone-100 text-stone-600 text-xs font-sans font-bold uppercase tracking-wider hover:bg-stone-200 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => saveCustomPreferences(tempPrefs)}
                  className="px-6 py-2.5 rounded-full bg-brand-green hover:bg-brand-green-hover text-white text-xs font-sans font-bold uppercase tracking-wider shadow-soft transition-all cursor-pointer"
                >
                  Save &amp; Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: LOCATION ACCESS */}
          {step === "location" && (
            <motion.div
              key="step-location"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-5"
            >
              {/* Header Badge */}
              <div className="flex items-center gap-2">
                <div className="size-10 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                  <MapPin className="size-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-brand-green">
                    LOCATION SERVICES
                  </span>
                  <span className="text-xs font-sans text-on-surface-variant font-medium">
                    Find Nearest GreenChillyz Kitchen
                  </span>
                </div>
              </div>

              {/* Main Heading */}
              <div className="flex flex-col gap-1.5">
                <h2 className="text-2xl sm:text-3xl font-heading text-on-surface font-extrabold uppercase tracking-tight leading-none">
                  Find Offers Near <span className="text-brand-green">You.</span>
                </h2>
                <p className="text-xs sm:text-sm font-sans text-on-surface-variant leading-relaxed">
                  Allow location access to automatically discover your closest GreenChillyz, YellowChillyz or GoldenChillyz outlet and unlock local deals.
                </p>
              </div>

              {/* Location Benefits */}
              <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/60">
                <div className="flex items-center gap-2 text-xs font-sans font-semibold text-stone-700">
                  <Check className="size-4 text-brand-green" />
                  <span>Automatic nearest outlet detection</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-sans font-semibold text-stone-700">
                  <Check className="size-4 text-brand-green" />
                  <span>Exclusive local kitchen discounts &amp; combos</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={requestLocationPermission}
                  disabled={locationLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-brand-green hover:bg-brand-green-hover text-white px-6 py-3.5 text-xs font-sans font-bold uppercase tracking-wider shadow-soft transition-all duration-200 cursor-pointer disabled:opacity-70"
                >
                  <Navigation className={`size-4 ${locationLoading ? "animate-spin" : "animate-pulse"}`} />
                  <span>{locationLoading ? "Detecting Location..." : "Enable Location Access"}</span>
                </button>

                <button
                  type="button"
                  onClick={skipLocation}
                  className="w-full py-3 text-center text-xs font-sans font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                >
                  Skip for Now
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
