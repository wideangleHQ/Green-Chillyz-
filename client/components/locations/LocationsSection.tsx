"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, ArrowUpRight, Clock, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { OUTLETS, OUTLET_COUNT } from "@/lib/content";

export function LocationsSection() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  // 250ms debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Filter outlets by name, address, or brand
  const filteredOutlets = useMemo(
    () =>
      OUTLETS.filter((o) =>
        `${o.name} ${o.address} ${o.brand}`
          .toLowerCase()
          .includes(debounced.toLowerCase())
      ),
    [debounced]
  );

  // Track scroll position for fade masks
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const updateScroll = () => {
      setCanScrollUp(el.scrollTop > 8);
      setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 8);
    };

    updateScroll();
    el.addEventListener("scroll", updateScroll, { passive: true });
    const observer = new ResizeObserver(updateScroll);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScroll);
      observer.disconnect();
    };
  }, [filteredOutlets]);

  // Use hovered outlet if available, else active selected outlet
  const displayIndex = hoveredIndex !== null ? hoveredIndex : selected;
  const activeOutlet = OUTLETS[displayIndex] || OUTLETS[0];

  return (
    <section
      id="locations"
      aria-labelledby="locations-heading"
      className="relative w-full min-h-screen lg:h-screen lg:max-h-screen bg-[#FFF8F1] p-[39px] mt-16 md:mt-24 overflow-hidden flex flex-col justify-between"
    >
      {/* Large Faded Background Typography */}
      <div className="absolute top-[4%] left-1/2 -translate-x-1/2 text-[13vw] font-heading text-on-surface/[0.035] pointer-events-none select-none z-0 tracking-widest uppercase leading-none whitespace-nowrap">
        LOCATIONS
      </div>

      {/* Soft Ambient Radial Glow */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.85)_0%,transparent_70%)]" />

      {/* Header Area (Anton Reserved for Section Heading Only) */}
      <div className="relative z-10 w-full shrink-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-on-surface/10">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="relative flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-brand-green" />
            </span>
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-brand-green">
              {OUTLET_COUNT} Locations &amp; Growing
            </span>
          </div>
          <h2
            id="locations-heading"
            className="text-2xl md:text-4xl lg:text-5xl font-heading text-on-surface font-extrabold uppercase tracking-tight leading-none"
          >
            Find Your <span className="text-brand-red">Nearest Table.</span>
          </h2>
        </div>
        <p className="text-xs md:text-sm font-sans text-on-surface-variant max-w-md text-left sm:text-right">
          Play, Redeem Rewards &amp; Visit Your Nearest GreenChillyz Experience.
        </p>
      </div>

      {/* Split Content Area (Fixed within 100vh) */}
      <div className="relative z-10 w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 min-h-0 overflow-hidden">
        {/* LEFT COLUMN: Sticky Search & Independently Scrollable Outlet List (40% / 5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 relative">
          {/* Sticky Search Bar */}
          <div className="shrink-0 pb-3">
            <div className="relative flex items-center w-full rounded-full bg-white/80 backdrop-blur-md border border-white/80 px-4 py-2.5 shadow-soft transition-all duration-300 focus-within:border-brand-green/60 focus-within:ring-2 focus-within:ring-brand-green/20 focus-within:bg-white">
              <Search className="size-4 text-on-surface-variant mr-3 shrink-0" />
              <input
                id="outlet-search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by area, city or outlet name..."
                className="w-full bg-transparent text-xs md:text-sm font-sans text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="size-5 rounded-full bg-on-surface/10 flex items-center justify-center text-on-surface hover:bg-on-surface/20 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Independently Scrollable Outlet List with Fade Masks */}
          <div className="relative flex-1 min-h-0">
            {/* Top fade mask */}
            <div
              className="pointer-events-none absolute top-0 left-0 right-0 h-6 z-10 transition-opacity duration-300"
              style={{
                background: "linear-gradient(to bottom, #FFF8F1, transparent)",
                opacity: canScrollUp ? 1 : 0,
              }}
            />

            {/* Bottom fade mask */}
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 z-10 transition-opacity duration-300"
              style={{
                background: "linear-gradient(to top, #FFF8F1, transparent)",
                opacity: canScrollDown ? 1 : 0,
              }}
            />

            <div
              ref={listRef}
              className="h-full max-h-[460px] lg:max-h-[520px] overflow-y-auto overscroll-contain space-y-3 pr-2 pb-8"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#006B2A transparent",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {filteredOutlets.length === 0 ? (
                <div className="p-6 rounded-[20px] bg-white/60 backdrop-blur-md border border-white/60 text-center text-xs md:text-sm font-sans text-on-surface-variant">
                  No outlets found matching &quot;{query}&quot;. Try searching for &quot;Indiranagar&quot; or &quot;Koramangala&quot;.
                </div>
              ) : (
                filteredOutlets.map((outlet) => {
                  const index = OUTLETS.indexOf(outlet);
                  const isSelected = index === selected;
                  const isHovered = index === hoveredIndex;

                  const themeColor =
                    outlet.brandTheme === "green"
                      ? "#006B2A"
                      : outlet.brandTheme === "yellow"
                      ? "#D4A31C"
                      : "#C9A227";

                  return (
                    <motion.button
                      key={outlet.name}
                      type="button"
                      onClick={() => setSelected(index)}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className={`shrink-0 w-full text-left p-4 rounded-[20px] transition-all duration-300 flex flex-col gap-2 relative overflow-hidden group cursor-pointer border ${
                        isSelected
                          ? "bg-white shadow-md border-brand-green"
                          : "bg-white/70 backdrop-blur-md border-white/80 hover:bg-white hover:shadow-soft"
                      }`}
                      style={{
                        borderColor: isSelected ? themeColor : undefined,
                      }}
                    >
                      {/* Selected Active Indicator Strip */}
                      {isSelected && (
                        <motion.div
                          layoutId="activeOutletIndicator"
                          className="absolute left-0 top-0 bottom-0 w-1.5"
                          style={{ backgroundColor: themeColor }}
                        />
                      )}

                      {/* Top Row: Outlet Name (Manrope ExtraBold 800) & Brand Chip */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-base md:text-lg font-sans font-extrabold text-on-surface tracking-tight flex items-center gap-2">
                          <MapPin
                            className="size-4 shrink-0"
                            style={{ color: isSelected || isHovered ? themeColor : "#1E1B17" }}
                          />
                          <span>{outlet.name}</span>
                        </div>

                        {/* Brand Badge */}
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider shrink-0"
                          style={{
                            backgroundColor: `${themeColor}15`,
                            color: themeColor,
                            border: `1px solid ${themeColor}30`,
                          }}
                        >
                          {outlet.brand}
                        </span>
                      </div>

                      {/* Address Line (Manrope Regular) */}
                      <p className="text-xs font-sans text-on-surface-variant line-clamp-1">
                        {outlet.address}
                      </p>

                      {/* Details Row: Hours, Distance, Status, Directions (Manrope Medium & Bold) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-on-surface/5 text-[11px] font-sans text-on-surface-variant">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 font-sans font-medium">
                            <Clock className="size-3 text-on-surface-variant/70" />
                            {outlet.hours}
                          </span>
                          <span className="font-sans font-bold text-on-surface">
                            {outlet.distance} away
                          </span>
                          {outlet.isOpen && (
                            <span className="inline-flex items-center gap-1 font-sans font-bold text-emerald-600">
                              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Open Now
                            </span>
                          )}
                        </div>

                        {/* Directions CTA (Manrope Medium) */}
                        <span className="inline-flex items-center gap-1 font-sans font-medium text-brand-green group-hover:translate-x-1 transition-transform">
                          Directions <ArrowUpRight className="size-3" />
                        </span>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Large Location Image Showcase (60% / 7 Cols on Desktop) */}
        <div className="lg:col-span-7 h-full min-h-[280px] lg:min-h-0 rounded-[28px] md:rounded-[36px] overflow-hidden relative border border-white/80 shadow-soft bg-stone-100 flex flex-col justify-end p-6">
          {/* Dynamic Location Image Showcase with Crossfade & Soft Zoom */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeOutlet.name}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              <Image
                src={activeOutlet.image}
                alt={activeOutlet.name}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
                priority
              />
              {/* Soft Ambient Gradient Overlay for Text Legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Bottom Floating Glassmorphism Overlay Content */}
          <div className="relative z-10 w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeOutlet.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="w-full bg-black/40 backdrop-blur-md rounded-[22px] p-5 border border-white/20 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm border border-white/30">
                      {activeOutlet.brand}
                    </span>
                    <span className="text-xs font-sans text-emerald-400 font-bold flex items-center gap-1">
                      <Sparkles className="size-3" /> Flagship Dining Experience
                    </span>
                  </div>
                  {/* Outlet Name in Manrope ExtraBold 800 */}
                  <div className="text-lg md:text-2xl font-sans font-extrabold text-white tracking-tight">
                    {activeOutlet.name}
                  </div>
                  <p className="text-xs font-sans text-white/80 line-clamp-1">
                    {activeOutlet.address} • Open {activeOutlet.hours} • {activeOutlet.distance} away
                  </p>
                </div>

                {/* Explore Outlet CTA Button (Manrope SemiBold) */}
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    activeOutlet.name + " " + activeOutlet.address
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-white text-on-surface px-5 py-2.5 text-xs font-sans font-semibold uppercase tracking-wider shadow-md hover:bg-brand-green hover:text-white transition-all duration-300 shrink-0"
                >
                  Explore Outlet
                  <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
