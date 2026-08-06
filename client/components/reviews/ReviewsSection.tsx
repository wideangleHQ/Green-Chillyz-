"use client";

import { useMemo } from "react";
import { Star, MessageSquareHeart } from "lucide-react";
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
];

export function ReviewsSection() {
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

        {/* 3 Curated Testimonial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CURATED_REVIEWS.map((review) => (
            <Reveal key={review.id}>
              <div className="w-full h-full flex">
                <ReviewCard review={review} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
