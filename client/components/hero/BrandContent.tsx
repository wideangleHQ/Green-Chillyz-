"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BRANDS, type BrandId } from "./brandConfig";

const MotionLink = motion.create(Link);

interface Props {
  activeBrand: BrandId;
  introComplete: boolean;
  reducedMotion: boolean;
}

export function BrandContent({
  activeBrand,
  introComplete,
  reducedMotion,
}: Props) {
  const [displayBrand, setDisplayBrand] = useState(activeBrand);
  const [faded, setFaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (activeBrand === displayBrand) return;
    if (reducedMotion) {
      setDisplayBrand(activeBrand);
      return;
    }

    setFaded(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDisplayBrand(activeBrand);
      setFaded(false);
    }, 320);

    return () => clearTimeout(timerRef.current);
  }, [activeBrand, displayBrand, reducedMotion]);

  if (!introComplete) return null;

  const brand = BRANDS[displayBrand];

  return (
    <div className="absolute bottom-[6%] md:bottom-[10%] left-0 right-0 z-30 flex justify-center px-5 md:px-8">
      <div
        className={`flex flex-col items-center text-center gap-4 md:gap-5 max-w-2xl transition-[opacity,transform] duration-300 ease-out ${faded ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}
      >
        <p
          className="text-[10px] md:text-label-caps uppercase tracking-[0.18em] font-semibold transition-colors duration-500"
          style={{ color: brand.colors.accent }}
        >
          {brand.tagline}
        </p>

        <h1
          id="hero-headline"
          className="text-display-hero-mobile md:text-display-hero-tablet xl:text-display-hero text-white whitespace-pre-line"
        >
          {brand.headline}
        </h1>

        <p className="max-w-lg text-body-md md:text-body-lg text-white/55 leading-relaxed">
          {brand.description}
        </p>

        <MotionLink
          href={brand.cta.href}
          className="group relative mt-1 inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 text-nav-link font-medium overflow-hidden"
          style={{ color: brand.colors.accent }}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          <span className="absolute inset-0 rounded-full border border-white/[.12] group-hover:border-white/[.22] transition-colors duration-300" />
          <span
            className="absolute inset-0 rounded-full opacity-[.08] group-hover:opacity-[.16] transition-opacity duration-300"
            style={{ backgroundColor: brand.colors.primary }}
          />
          {brand.cta.label}
          <span className="text-sm opacity-50 group-hover:translate-x-0.5 transition-transform duration-200">
            →
          </span>
        </MotionLink>
      </div>
    </div>
  );
}
