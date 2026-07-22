"use client";

import { MapPin, Navigation, Tag, RefreshCw, AlertCircle, ShoppingBag } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { useLocationOffers } from "@/hooks/useLocationOffers";
import { OfferCard } from "./OfferCard";
import { OutletSelectorModal } from "./OutletSelectorModal";
import { OfferCategory } from "@/types/offers";

const CATEGORIES: { label: string; value: OfferCategory }[] = [
  { label: "All Deals", value: "all" },
  { label: "Combos", value: "combos" },
  { label: "Dine-In", value: "dine-in" },
  { label: "Delivery", value: "delivery" },
  { label: "Rewards Bonus", value: "rewards" },
];

export function OffersSection() {
  const {
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
  } = useLocationOffers();

  return (
    <section
      id="offers"
      aria-labelledby="offers-heading"
      className="relative w-full bg-[#FFF8F1] py-[60px] md:py-[90px] overflow-hidden select-none"
    >
      {/* Decorative Faded Background Typography */}
      <div className="absolute top-[6%] left-1/2 -translate-x-1/2 text-[13vw] font-heading text-on-surface/[0.025] pointer-events-none select-none z-0 tracking-widest uppercase leading-none whitespace-nowrap">
        EXCLUSIVE LOCAL DEALS
      </div>

      <div className="container-site relative z-10 flex flex-col gap-8 md:gap-10">
        {/* Section Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-on-surface/10">
          <div className="flex flex-col gap-2 max-w-xl">
            <Reveal>
              <div className="flex items-center gap-2">
                <Tag className="size-4 text-brand-green" />
                <span className="text-xs font-sans font-bold uppercase tracking-wider text-brand-green">
                  Exclusive Local Deals
                </span>
              </div>
            </Reveal>
            <Reveal>
              <h2
                id="offers-heading"
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading text-on-surface font-extrabold uppercase tracking-tight leading-none"
              >
                Offers Near <span className="text-brand-green">You.</span>
              </h2>
            </Reveal>
          </div>

          {/* Location Status Bar */}
          <Reveal>
            <div className="flex flex-wrap items-center gap-3">
              {selectedOutlet ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md px-4 py-2 border border-white/80 shadow-soft text-xs font-sans font-bold text-on-surface">
                  <MapPin className="size-4 text-brand-green shrink-0 animate-bounce" />
                  <span>
                    Showing offers from{" "}
                    <strong className="text-brand-green font-extrabold">
                      {selectedOutlet.outletName}
                    </strong>
                  </span>
                  {distanceKm !== null && (
                    <span className="text-[11px] font-sans font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200 ml-1">
                      {distanceKm} km away
                    </span>
                  )}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 border border-amber-500/20 text-xs font-sans font-bold text-amber-800">
                  <AlertCircle className="size-4 text-amber-600" />
                  <span>No Outlet Selected</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 rounded-full bg-white hover:bg-stone-50 border border-stone-200 text-xs font-sans font-bold text-brand-green shadow-xs transition-all duration-200 cursor-pointer"
                >
                  Change Outlet
                </button>

                <button
                  type="button"
                  onClick={requestLocation}
                  title="Refresh Location"
                  className="size-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-on-surface transition-all duration-200 cursor-pointer"
                  aria-label="Refresh Location"
                >
                  <RefreshCw className={`size-4 text-stone-600 ${status === "requesting" ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-xs font-sans font-bold uppercase tracking-wider transition-all duration-300 shrink-0 cursor-pointer ${
                category === cat.value
                  ? "bg-brand-green text-white shadow-md scale-105"
                  : "bg-white/80 text-on-surface-variant hover:bg-white hover:text-on-surface border border-white/80 shadow-xs"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* CONTENT AREA: Skeletons, Offers Grid/Carousel, or Empty States */}
        {loading ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-full h-[380px] rounded-[28px] bg-stone-200/60 animate-pulse border border-white/60 shadow-soft"
              />
            ))}
          </div>
        ) : status === "denied" && !selectedOutlet ? (
          /* Permission Denied Empty State */
          <div className="w-full bg-white/80 backdrop-blur-md rounded-[32px] p-8 md:p-12 border border-white shadow-soft flex flex-col items-center justify-center text-center gap-4 max-w-xl mx-auto">
            <div className="size-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Navigation className="size-8 stroke-[1.5]" />
            </div>
            <h3 className="text-xl md:text-2xl font-heading uppercase text-on-surface font-extrabold">
              Enable Location to View Exclusive Offers
            </h3>
            <p className="text-sm font-sans text-on-surface-variant leading-relaxed">
              We need your location to show active deals, student discounts, and chef combos available at your nearest GreenChillyz outlet.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={requestLocation}
                className="px-6 py-3 rounded-full bg-brand-green hover:bg-brand-green-hover text-white text-xs font-sans font-bold uppercase tracking-wider shadow-soft transition-all cursor-pointer"
              >
                Enable Location
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 rounded-full bg-stone-100 hover:bg-stone-200 text-on-surface text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Choose Outlet Manually
              </button>
            </div>
          </div>
        ) : offers.length > 0 ? (
          /* Active Offers Display (Horizontal Carousel on Mobile, Grid on Desktop) */
          <div className="w-full">
            {/* Mobile Swipe Container */}
            <div className="flex md:hidden overflow-x-auto gap-4 pb-4 -mx-5 px-5 scrollbar-none snap-x snap-mandatory">
              {offers.map((offer) => (
                <div key={offer.offerId} className="snap-center shrink-0">
                  <OfferCard offer={offer} outletName={selectedOutlet?.outletName} />
                </div>
              ))}
            </div>

            {/* Desktop / Tablet Grid Container */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((offer) => (
                <OfferCard
                  key={offer.offerId}
                  offer={offer}
                  outletName={selectedOutlet?.outletName}
                />
              ))}
            </div>
          </div>
        ) : (
          /* No Offers Available at Selected Outlet */
          <div className="w-full bg-white/80 backdrop-blur-md rounded-[32px] p-8 md:p-12 border border-white shadow-soft flex flex-col items-center justify-center text-center gap-4 max-w-md mx-auto">
            <div className="size-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
              <ShoppingBag className="size-8 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-sans font-extrabold uppercase text-on-surface">
              No active offers at this outlet right now.
            </h3>
            <p className="text-xs font-sans text-on-surface-variant leading-relaxed">
              Check back soon or select another nearby outlet to explore deals.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-2 px-6 py-2.5 rounded-full bg-brand-green hover:bg-brand-green-hover text-white text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer shadow-soft"
            >
              Explore Other Outlets
            </button>
          </div>
        )}
      </div>

      {/* Manual Outlet Search Modal */}
      <OutletSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        outlets={outlets}
        selectedOutlet={selectedOutlet}
        onSelectOutlet={selectOutletManually}
        onRequestLocation={requestLocation}
      />
    </section>
  );
}
