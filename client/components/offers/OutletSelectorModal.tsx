"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, X, Check, Navigation } from "lucide-react";
import { OutletLocation } from "@/types/offers";

interface OutletSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  outlets: OutletLocation[];
  selectedOutlet: OutletLocation | null;
  onSelectOutlet: (outlet: OutletLocation) => void;
  onRequestLocation: () => void;
}

export function OutletSelectorModal({
  isOpen,
  onClose,
  outlets,
  selectedOutlet,
  onSelectOutlet,
  onRequestLocation,
}: OutletSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOutlets = useMemo(() => {
    if (!searchQuery.trim()) return outlets;
    const query = searchQuery.toLowerCase();
    return outlets.filter(
      (o) =>
        o.outletName.toLowerCase().includes(query) ||
        o.area.toLowerCase().includes(query) ||
        o.city.toLowerCase().includes(query) ||
        o.address.toLowerCase().includes(query)
    );
  }, [outlets, searchQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-on-surface/50 cursor-pointer"
          />

          {/* Modal / Bottom Sheet Panel */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-floating z-10 flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden border border-stone-200/80"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-on-surface/10">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-sans font-extrabold text-on-surface uppercase tracking-tight">
                    Select Your Outlet
                  </h3>
                  <p className="text-xs font-sans text-on-surface-variant">
                    View active offers &amp; deals at your nearest location
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                type="button"
                className="size-9 rounded-full bg-stone-100 flex items-center justify-center text-on-surface hover:bg-stone-200 transition-colors cursor-pointer"
                aria-label="Close outlet selector"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Auto Detect Location Button */}
            <div className="my-4">
              <button
                type="button"
                onClick={() => {
                  onRequestLocation();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-stone-100 hover:bg-stone-200/80 px-4 py-3 text-xs font-sans font-bold uppercase tracking-wider text-brand-green transition-all duration-200 cursor-pointer border border-stone-200/60"
              >
                <Navigation className="size-4 animate-pulse text-brand-green" />
                <span>Auto-Detect Nearest Outlet</span>
              </button>
            </div>

            {/* Search Input Box */}
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant/60" />
              <input
                type="text"
                placeholder="Search by area, landmark or outlet name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-sans text-on-surface focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
              />
            </div>

            {/* Outlets List */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1 -mr-1">
              {filteredOutlets.length > 0 ? (
                filteredOutlets.map((outlet) => {
                  const isSelected = selectedOutlet?.id === outlet.id;
                  const brandColor =
                    outlet.brand === "GreenChillyz"
                      ? "text-brand-green bg-brand-green/10"
                      : outlet.brand === "YellowChillyz"
                      ? "text-amber-700 bg-amber-500/10"
                      : "text-amber-600 bg-amber-500/15";

                  return (
                    <button
                      key={outlet.id}
                      type="button"
                      onClick={() => onSelectOutlet(outlet)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? "bg-brand-green/5 border-brand-green shadow-sm"
                          : "bg-white border-stone-200/80 hover:border-brand-green/40 hover:bg-stone-50"
                      }`}
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-sans font-bold text-on-surface truncate">
                            {outlet.outletName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider ${brandColor}`}
                          >
                            {outlet.area}
                          </span>
                        </div>
                        <p className="text-xs font-sans text-on-surface-variant line-clamp-1">
                          {outlet.address}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="size-6 rounded-full bg-brand-green text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          <Check className="size-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs font-sans text-on-surface-variant">
                  No outlets found matching &ldquo;{searchQuery}&rdquo;
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
