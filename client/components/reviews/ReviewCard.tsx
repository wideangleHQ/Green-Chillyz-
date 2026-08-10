"use client";

import { useState, useRef, MouseEvent, memo } from "react";
import { Star, Quote, Sparkles } from "lucide-react";

export interface ReviewItemData {
  id: string;
  author: string;
  role?: string;
  outlet: string;
  brand: "GreenChillyz" | "YellowChillyz" | "GoldenChillyz";
  brandTheme: "green" | "yellow" | "gold";
  rating: number;
  quote: string;
  avatarColor: string;
  initials: string;
}

interface ReviewCardProps {
  review: ReviewItemData;
}

export const ReviewCard = memo(function ReviewCard({ review }: ReviewCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  const themeColor =
    review.brandTheme === "green"
      ? "#006B2A"
      : review.brandTheme === "yellow"
      ? "#D4A31C"
      : "#C9A227";

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = (e.clientX - rect.left - width / 2) / (width / 2);
    const mouseY = (e.clientY - rect.top - height / 2) / (height / 2);

    const rotX = -mouseY * 3.5;
    const rotY = mouseX * 3.5;
    const spotX = ((e.clientX - rect.left) / width) * 100;
    const spotY = ((e.clientY - rect.top) / height) * 100;

    cardRef.current.style.transition = "none";
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
    if (spotlightRef.current) {
      spotlightRef.current.style.background = `radial-gradient(circle at ${spotX}% ${spotY}%, ${themeColor}12 0%, transparent 65%)`;
    }
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.2s ease";
      cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative w-[280px] sm:w-[330px] md:w-[370px] shrink-0 p-5 md:p-6 rounded-[22px] md:rounded-[26px] bg-white border border-on-surface/[0.07] hover:border-brand-green/30 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,107,42,0.12)] transition-[border-color,box-shadow] duration-200 flex flex-col justify-between gap-4 will-change-transform transform-gpu cursor-pointer select-none"
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      {/* Dynamic Cursor-Tracking Spotlight Glow */}
      <div
        ref={spotlightRef}
        className="absolute inset-0 rounded-[22px] md:rounded-[26px] pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      />

      {/* Top Header: Quote Icon Accent & Gold Star Rating */}
      <div className="relative z-20 flex items-center justify-between gap-2">
        <div
          className="size-8.5 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundColor: `${themeColor}12`,
            color: themeColor,
          }}
        >
          <Quote className="size-3.5 fill-current stroke-none opacity-80" />
        </div>

        {/* Gold Star Rating Badge */}
        <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 shadow-xs">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-3.5 ${
                  i < Math.floor(review.rating)
                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_1px_2px_rgba(245,158,11,0.3)]"
                    : i < review.rating
                    ? "fill-amber-400/50 text-amber-400"
                    : "text-stone-300"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-number font-bold text-amber-700 ml-0.5">
            {review.rating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Review Body Text */}
      <div className="relative z-20 my-0.5">
        <p className="text-xs sm:text-sm font-sans text-on-surface leading-relaxed font-medium line-clamp-3">
          &ldquo;{review.quote}&rdquo;
        </p>
      </div>

      {/* Footer: Author Info & Outlet Chip */}
      <div className="relative z-20 pt-3 border-t border-on-surface/5 flex items-center justify-between gap-3 mt-auto">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar Circle */}
          <div
            className="size-9 rounded-full flex items-center justify-center font-sans font-extrabold text-[11px] text-white shadow-sm shrink-0 border-2 border-white"
            style={{
              background: review.avatarColor,
              boxShadow: `0 0 0 2px ${themeColor}25, 0 3px 8px rgba(0,0,0,0.1)`,
            }}
          >
            {review.initials}
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-sans font-extrabold text-on-surface truncate tracking-tight">
              {review.author}
            </span>
            <span className="text-[10px] sm:text-[11px] font-sans text-on-surface-variant flex items-center gap-1">
              <Sparkles className="size-3 text-emerald-600 inline" /> Verified Diner
            </span>
          </div>
        </div>

        {/* Outlet Badge Chip */}
        <span
          className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider shrink-0 shadow-xs"
          style={{
            backgroundColor: `${themeColor}12`,
            color: themeColor,
            border: `1px solid ${themeColor}25`,
          }}
        >
          {review.outlet}
        </span>
      </div>
    </div>
  );
});
