"use client";

import { useMemo } from "react";
import { Star, MessageSquareHeart } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { ReviewCard, ReviewItemData } from "./ReviewCard";

const ALL_REVIEWS: ReviewItemData[] = [
  {
    id: "rev-1",
    author: "Ananya Roy",
    outlet: "Indiranagar",
    brand: "GreenChillyz",
    brandTheme: "green",
    rating: 5,
    quote:
      "The paneer skewers arrived still smoking and fragrant with mustard oil. Easily the best casual dining experience in Bangalore!",
    avatarColor: "linear-gradient(135deg, #006B2A, #004D1E)",
    initials: "AR",
  },
  {
    id: "rev-2",
    author: "Vikram Sharma",
    outlet: "Koramangala",
    brand: "YellowChillyz",
    brandTheme: "yellow",
    rating: 5,
    quote:
      "Earned GreenChillyz Coins over my lunch breaks for a free biryani portion. The rewards program is addictively generous.",
    avatarColor: "linear-gradient(135deg, #D4A31C, #9E770E)",
    initials: "VS",
  },
  {
    id: "rev-3",
    author: "Meera Kulkarni",
    outlet: "UB City",
    brand: "GoldenChillyz",
    brandTheme: "gold",
    rating: 5,
    quote:
      "GoldenChillyz feels like a royal dining room — same warmth and rich Odisha flavors, elevated into a true luxury occasion.",
    avatarColor: "linear-gradient(135deg, #C9A227, #8C6F12)",
    initials: "MK",
  },
  {
    id: "rev-4",
    author: "Dev Patel",
    outlet: "Whitefield",
    brand: "GreenChillyz",
    brandTheme: "green",
    rating: 5,
    quote:
      "Discovered it on a business trip near ITPL. Now visiting GreenChillyz every Friday night is a non-negotiable family ritual.",
    avatarColor: "linear-gradient(135deg, #008737, #004D1E)",
    initials: "DP",
  },
  {
    id: "rev-5",
    author: "Priya Nair",
    outlet: "Jayanagar",
    brand: "YellowChillyz",
    brandTheme: "yellow",
    rating: 4.8,
    quote:
      "The Mutton Kassa melts off the bone. Authentic spices, impeccable hospitality, and beautiful editorial ambience.",
    avatarColor: "linear-gradient(135deg, #B5860C, #735C00)",
    initials: "PN",
  },
  {
    id: "rev-6",
    author: "Rohan Verma",
    outlet: "HSR Layout",
    brand: "GreenChillyz",
    brandTheme: "green",
    rating: 5,
    quote:
      "Lightning fast delivery for late office dinners. The Butter Chicken is velvety smooth without being overly sweet.",
    avatarColor: "linear-gradient(135deg, #1F6C3A, #004D1E)",
    initials: "RV",
  },
  {
    id: "rev-7",
    author: "Siddharth Rao",
    outlet: "Indiranagar",
    brand: "GreenChillyz",
    brandTheme: "green",
    rating: 5,
    quote:
      "Brought out-of-town guests here for dinner. Everyone was blown away by the live tandoor and signature mocktails.",
    avatarColor: "linear-gradient(135deg, #006B2A, #003615)",
    initials: "SR",
  },
  {
    id: "rev-8",
    author: "Kavya Murthy",
    outlet: "Koramangala",
    brand: "YellowChillyz",
    brandTheme: "yellow",
    rating: 5,
    quote:
      "Cleanest kitchen standards and extremely courteous staff. The Chicken Roll is the benchmark for street-style comfort food.",
    avatarColor: "linear-gradient(135deg, #D4A31C, #8C6A05)",
    initials: "KM",
  },
  {
    id: "rev-9",
    author: "Aarav Gupta",
    outlet: "UB City",
    brand: "GoldenChillyz",
    brandTheme: "gold",
    rating: 5,
    quote:
      "Impeccable plating and high-end fine dining aesthetics. The seafood thali is worth every single rupee.",
    avatarColor: "linear-gradient(135deg, #C9A227, #70580B)",
    initials: "AG",
  },
  {
    id: "rev-10",
    author: "Nisha Bhat",
    outlet: "Whitefield",
    brand: "GreenChillyz",
    brandTheme: "green",
    rating: 4.9,
    quote:
      "Consistently fresh ingredients and warm ambiance. Love how seamless the online rewards redemption is at checkout!",
    avatarColor: "linear-gradient(135deg, #008737, #005E25)",
    initials: "NB",
  },
  {
    id: "rev-11",
    author: "Rahul Das",
    outlet: "Jayanagar",
    brand: "YellowChillyz",
    brandTheme: "yellow",
    rating: 5,
    quote:
      "Hands down the best biryani in Bangalore. The aroma alone when they unseal the handi brings back childhood memories.",
    avatarColor: "linear-gradient(135deg, #B5860C, #5C4700)",
    initials: "RD",
  },
  {
    id: "rev-12",
    author: "Sneha Sen",
    outlet: "HSR Layout",
    brand: "GreenChillyz",
    brandTheme: "green",
    rating: 5,
    quote:
      "The hospitality team treated our anniversary dinner like royalty. Outstanding food and unforgettable service!",
    avatarColor: "linear-gradient(135deg, #1F6C3A, #003615)",
    initials: "SS",
  },
];

export function ReviewsSection() {
  // Desktop datasets (Row 1 & Row 2)
  const desktopRow1 = useMemo(() => ALL_REVIEWS.slice(0, 6), []);
  const desktopRow2 = useMemo(() => ALL_REVIEWS.slice(6, 12), []);

  // Mobile datasets (Row 1, Row 2, Row 3)
  const mobileRow1 = useMemo(() => ALL_REVIEWS.slice(0, 4), []);
  const mobileRow2 = useMemo(() => ALL_REVIEWS.slice(4, 8), []);
  const mobileRow3 = useMemo(() => ALL_REVIEWS.slice(8, 12), []);

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="relative w-full bg-[#FFF8F1] py-[60px] md:py-[90px] overflow-hidden select-none flex flex-col gap-8 md:gap-10"
    >
      {/* LAYER 1: CLEAN EDITORIAL HEADER LAYER (Zero gradients, masks, or overlays) */}
      <div className="container-site relative z-20 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
        <div className="flex flex-col gap-2 max-w-xl">
          <Reveal>
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-brand-green" />
              </span>
              <span className="text-xs font-sans font-bold uppercase tracking-wider text-brand-green">
                50,000+ Verified Dining Reviews
              </span>
            </div>
          </Reveal>
          <Reveal>
            <h2
              id="reviews-heading"
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading text-on-surface font-extrabold uppercase tracking-tight leading-none"
            >
              Word Travels <span className="text-brand-green">Fast.</span>
            </h2>
          </Reveal>
        </div>

        <Reveal>
          <div className="flex flex-col sm:items-end gap-2">
            {/* Trust Badge Pill */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-md px-3.5 py-1.5 border border-white/80 shadow-soft">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="size-3.5 fill-amber-400 text-amber-400 drop-shadow-[0_1px_2px_rgba(245,158,11,0.3)]"
                  />
                ))}
              </div>
              <span className="text-xs font-sans font-extrabold text-on-surface">
                4.9 / 5.0
              </span>
              <span className="text-[11px] font-sans text-on-surface-variant font-medium border-l border-on-surface/10 pl-2">
                Google &amp; Zomato
              </span>
            </div>
            <p className="text-xs md:text-sm font-sans text-on-surface-variant text-left sm:text-right">
              Authentic testimonials from lovers of GreenChillyz, YellowChillyz &amp; GoldenChillyz.
            </p>
          </div>
        </Reveal>
      </div>

      {/* LAYER 2: REVIEWS MARQUEE LAYER (All edge masks, background typography, and ambient glows are scoped ONLY inside this container) */}
      <div className="relative w-full overflow-hidden">
        {/* Subtle Background Faded Typography — scoped to marquee track area only */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[13vw] font-heading text-on-surface/[0.025] pointer-events-none select-none z-0 tracking-widest uppercase leading-none whitespace-nowrap">
          VOICES OF GREENCHILLYZ
        </div>

        {/* Ambient Low-Opacity Accent — scoped to marquee track area only */}
        <div className="absolute bottom-2 right-[4%] pointer-events-none z-0 opacity-10 rotate-12">
          <MessageSquareHeart className="size-24 text-emerald-700 stroke-[1]" />
        </div>

        {/* Left & Right Soft Edge Fade Masks — scoped strictly to review wall height */}
        <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-20 sm:w-36 md:w-52 z-20 bg-gradient-to-r from-[#FFF8F1] via-[#FFF8F1]/90 to-transparent" />
        <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-20 sm:w-36 md:w-52 z-20 bg-gradient-to-l from-[#FFF8F1] via-[#FFF8F1]/90 to-transparent" />

        {/* DESKTOP / TABLET: 2 Infinite Marquee Rows */}
        <div className="hidden md:flex flex-col gap-5 w-full py-2 relative z-10">
          {/* Row 1: Leftward Scrolling */}
          <div className="group relative w-full overflow-hidden flex">
            <div className="flex gap-5 w-max animate-marquee-left group-hover:[animation-play-state:paused] transform-gpu">
              {[...desktopRow1, ...desktopRow1, ...desktopRow1].map((review, idx) => (
                <ReviewCard key={`${review.id}-row1-${idx}`} review={review} />
              ))}
            </div>
          </div>

          {/* Row 2: Rightward Scrolling */}
          <div className="group relative w-full overflow-hidden flex">
            <div className="flex gap-5 w-max animate-marquee-right group-hover:[animation-play-state:paused] transform-gpu">
              {[...desktopRow2, ...desktopRow2, ...desktopRow2].map((review, idx) => (
                <ReviewCard key={`${review.id}-row2-${idx}`} review={review} />
              ))}
            </div>
          </div>
        </div>

        {/* MOBILE: 3 Compact Marquee Rows */}
        <div className="flex md:hidden flex-col gap-3.5 w-full py-1 relative z-10">
          {/* Mobile Row 1: Leftward */}
          <div className="relative w-full overflow-hidden flex">
            <div className="flex gap-3.5 w-max animate-marquee-left-mobile transform-gpu">
              {[...mobileRow1, ...mobileRow1, ...mobileRow1, ...mobileRow1].map((review, idx) => (
                <ReviewCard key={`${review.id}-mob1-${idx}`} review={review} />
              ))}
            </div>
          </div>

          {/* Mobile Row 2: Rightward */}
          <div className="relative w-full overflow-hidden flex">
            <div className="flex gap-3.5 w-max animate-marquee-right-mobile transform-gpu">
              {[...mobileRow2, ...mobileRow2, ...mobileRow2, ...mobileRow2].map((review, idx) => (
                <ReviewCard key={`${review.id}-mob2-${idx}`} review={review} />
              ))}
            </div>
          </div>

          {/* Mobile Row 3: Leftward */}
          <div className="relative w-full overflow-hidden flex">
            <div className="flex gap-3.5 w-max animate-marquee-left-mobile transform-gpu">
              {[...mobileRow3, ...mobileRow3, ...mobileRow3, ...mobileRow3].map((review, idx) => (
                <ReviewCard key={`${review.id}-mob3-${idx}`} review={review} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
