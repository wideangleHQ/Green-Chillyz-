"use client";

import { useMemo } from "react";
import { Star } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { ReviewCard, ReviewItemData } from "./ReviewCard";

const CURATED_REVIEWS: ReviewItemData[] = [
  {
    id: "rev-dinein",
    author: "Soumya Ranjan Patnaik",
    role: "Dine-In Guest",
    outlet: "Bhubaneswar Flagship",
    brand: "GreenChillyz",
    brandTheme: "green",
    rating: 5.0,
    quote:
      "GreenChillyz has been our go-to family dining spot for over a decade. The tandoori platter and authentic biryani flavor never fail to delight.",
    avatarColor: "linear-gradient(135deg, #006B2A, #004D1E)",
    initials: "SP",
  },
  {
    id: "rev-delivery",
    author: "Priyanka Mohanty",
    role: "Doorstep Delivery",
    outlet: "Cuttack Outlet",
    brand: "GreenChillyz",
    brandTheme: "green",
    rating: 5.0,
    quote:
      "Orders always arrive piping hot and spill-proof. The signature Kathi rolls and Schezwan noodles are my late-night office fuel!",
    avatarColor: "linear-gradient(135deg, #C62828, #8E0000)",
    initials: "PM",
  },
  {
    id: "rev-catering",
    author: "Rajesh Kumar Mishra",
    role: "Corporate Event Host",
    outlet: "GreenChillyz Catering",
    brand: "GreenChillyz",
    brandTheme: "gold",
    rating: 5.0,
    quote:
      "We hired GreenChillyz Catering for our corporate summit (500+ guests). Flawless live counter service and glowing reviews from all attendees.",
    avatarColor: "linear-gradient(135deg, #C9A227, #8C6F12)",
    initials: "RM",
  },
  {
    id: "rev-dinein-2",
    author: "Ananya Das",
    role: "Dine-In Guest",
    outlet: "Puri Flagship",
    brand: "GreenChillyz",
    brandTheme: "green",
    rating: 5.0,
    quote:
      "The biryani is simply magical. YellowChillyz's special paneer rolls are also a fantastic option for vegetarian days!",
    avatarColor: "linear-gradient(135deg, #006B2A, #C9A227)",
    initials: "AD",
  },
  {
    id: "rev-family",
    author: "Subhasish Mohapatra",
    role: "Family Feast",
    outlet: "Patia Outlet",
    brand: "GreenChillyz",
    brandTheme: "green",
    rating: 4.8,
    quote:
      "Unmatched dining experience. We order Kathi rolls weekly, and they are always perfectly fresh and full of flavour.",
    avatarColor: "linear-gradient(135deg, #C62828, #006B2A)",
    initials: "SM",
  },
  {
    id: "rev-premium",
    author: "Swati Priyadarshini",
    role: "Premium Dining",
    outlet: "GoldenChillyz Cuttack",
    brand: "GreenChillyz",
    brandTheme: "gold",
    rating: 5.0,
    quote:
      "GoldenChillyz is local luxury dining at its best. The mutton handi and premium dessert spreads were outstanding.",
    avatarColor: "linear-gradient(135deg, #C9A227, #003615)",
    initials: "SP",
  },
];

export function ReviewsSection() {
  // Multiply items to ensure continuous marquee loop without blank gaps
  const row1 = useMemo(() => [
    ...CURATED_REVIEWS.slice(0, 3),
    ...CURATED_REVIEWS.slice(0, 3),
    ...CURATED_REVIEWS.slice(0, 3),
    ...CURATED_REVIEWS.slice(0, 3),
  ], []);

  const row2 = useMemo(() => [
    ...CURATED_REVIEWS.slice(3, 6),
    ...CURATED_REVIEWS.slice(3, 6),
    ...CURATED_REVIEWS.slice(3, 6),
    ...CURATED_REVIEWS.slice(3, 6),
  ], []);

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="relative w-full bg-[#FFF8F1] py-16 md:py-24 overflow-hidden select-none"
    >
      <div className="container-site relative z-10 flex flex-col gap-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 pb-6 border-b border-on-surface/10">
          <div className="flex flex-col gap-2 max-w-xl">
            <Reveal>
              <div className="flex items-center gap-2">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-brand-green" />
                </span>
                <span className="text-xs font-sans font-bold uppercase tracking-wider text-brand-green">
                  Guest Experiences &amp; Reviews
                </span>
              </div>
            </Reveal>
            <Reveal>
              <h2
                id="reviews-heading"
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading text-on-surface font-extrabold uppercase tracking-tight leading-none"
              >
                Loved Across <span className="text-brand-green">Odisha.</span>
              </h2>
            </Reveal>
          </div>

          <Reveal>
            <div className="flex flex-col sm:items-end gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-md px-3.5 py-1.5 border border-white/80 shadow-soft">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="size-3.5 fill-amber-400 text-amber-400 drop-shadow-[0_1px_2px_rgba(245,158,11,0.3)]"
                    />
                  ))}
                </div>
                <span className="text-xs font-number font-extrabold text-on-surface">
                  4.9 / 5.0
                </span>
                <span className="text-[11px] font-sans text-on-surface-variant font-medium border-l border-on-surface/10 pl-2">
                  <span className="font-number font-bold">10,000+</span> Daily Guests
                </span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* 2-Row Marquee Slider */}
        <div className="relative w-full overflow-hidden py-4 flex flex-col gap-6 select-none">
          {/* Row 1: Left scrolling marquee */}
          <div className="flex overflow-hidden w-full whitespace-nowrap">
            <div className="flex gap-6 animate-marquee-left hover:[animation-play-state:paused] [@media(prefers-reduced-motion:reduce)]:[animation-play-state:paused]">
              {row1.map((review, idx) => (
                <div key={`${review.id}-row1-${idx}`} className="shrink-0">
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          </div>

          {/* Row 2: Right scrolling marquee */}
          <div className="flex overflow-hidden w-full whitespace-nowrap">
            <div className="flex gap-6 animate-marquee-right hover:[animation-play-state:paused] [@media(prefers-reduced-motion:reduce)]:[animation-play-state:paused]">
              {row2.map((review, idx) => (
                <div key={`${review.id}-row2-${idx}`} className="shrink-0">
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          </div>

          {/* Smooth fading gradients at left & right edges */}
          <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-[#FFF8F1] via-[#FFF8F1]/85 to-transparent z-20 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-[#FFF8F1] via-[#FFF8F1]/85 to-transparent z-20 pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
