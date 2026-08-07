"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, CircleDollarSign, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { GameCard } from "./GameCard";
import { GAMES_DATA } from "./gamesData";
import { GameOverlay } from "./GameOverlay";

const GAME_ID_TO_SLUG: Record<string, string> = {
  "spin-win": "spin-wheel",
};

export function GamesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activePlayGame, setActivePlayGame] = useState<string | null>(null);
  const touchStartX = useRef(0);

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % GAMES_DATA.length);
  }, []);

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + GAMES_DATA.length) % GAMES_DATA.length);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 2000);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  return (
    <section
      id="games"
      aria-labelledby="games-heading"
      className="relative w-full bg-[#FFF8F1] py-[24px] sm:py-[60px] md:py-[80px] h-[100dvh] max-h-[100dvh] lg:h-auto lg:max-h-none overflow-x-hidden overflow-y-visible select-none flex flex-col justify-between"
    >
      <div id="rewards" className="absolute top-0 left-0" />

      {/* Large Faded Background Typography */}
      <div className="absolute top-[3%] lg:top-[6%] left-1/2 -translate-x-1/2 text-[15vw] lg:text-[13vw] font-heading text-on-surface/[0.035] pointer-events-none select-none z-0 tracking-widest uppercase leading-none whitespace-nowrap">
        PLAY • WIN • REDEEM
      </div>

      {/* Soft Ambient Radial Light */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.85)_0%,transparent_70%)]" />

      {/* Floating Low-Opacity Coin Accents */}
      <div className="absolute top-[6%] lg:top-[12%] left-[2%] lg:left-[4%] pointer-events-none z-0 opacity-15 rotate-12">
        <CircleDollarSign className="size-16 md:size-20 text-amber-600 stroke-[1]" />
      </div>
      <div className="absolute bottom-[4%] lg:bottom-[10%] right-[3%] lg:right-[5%] pointer-events-none z-0 opacity-15 -rotate-[20deg]">
        <CircleDollarSign className="size-20 md:size-24 text-amber-600 stroke-[1]" />
      </div>

      <div className="container-site relative z-10 w-full h-full flex flex-col lg:flex-row gap-3 sm:gap-8 lg:gap-14 items-center justify-between min-h-0 overflow-x-hidden overflow-y-visible">
        {/* LEFT COLUMN: Editorial Header */}
        <div className="w-full lg:w-[28%] flex flex-col items-start gap-2.5 sm:gap-4 md:gap-5 shrink-0 z-20">
          <Reveal>
            <h2
              id="games-heading"
              className="text-[44px] sm:text-[50px] md:text-[52px] lg:text-[56px] font-heading leading-[0.92] text-left flex flex-row lg:flex-col gap-2.5 lg:gap-0 tracking-normal font-extrabold uppercase"
            >
              <span className="text-brand-green">PLAY</span>
              <span className="text-on-surface">EARN</span>
              <span className="text-brand-red">REDEEM</span>
            </h2>
          </Reveal>

          {/* Star Divider */}
          <div className="hidden sm:flex items-center gap-3 w-full my-0.5 md:my-1">
            <div className="h-[1.5px] bg-on-surface/15 w-16" />
            <Star className="size-4 text-brand-red fill-none stroke-[1.5]" />
          </div>

          <Reveal>
            <p className="text-sm sm:text-base md:text-lg font-sans text-on-surface-variant leading-snug text-left line-clamp-2 sm:line-clamp-none max-w-sm lg:max-w-none">
              Play fun games. Earn GreenChillyz Coins. Redeem rewards at your nearest GreenChillyz, YellowChillyz or GoldenChillyz outlet.
            </p>
          </Reveal>

          {/* Premium CTA Button */}
          <Reveal>
            <Link
              href="/games"
              className="group inline-flex items-center gap-2 rounded-full bg-brand-green px-5 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-sans font-semibold uppercase tracking-wider text-white shadow-soft transition-all duration-300 hover:bg-brand-green-hover hover:scale-105 cursor-pointer mt-0.5 sm:mt-2"
            >
              Explore More Games
              <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </Reveal>
        </div>

        {/* RIGHT COLUMN: Mobile View Vertical Overflow Visible */}
        <div
          className="w-full lg:w-[72%] relative flex-1 min-h-0 w-full overflow-x-hidden overflow-y-visible flex items-center justify-center -mt-1 lg:mt-0"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={(e) => {
            setIsPaused(true);
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            setIsPaused(false);
            const deltaX = e.changedTouches[0].clientX - touchStartX.current;
            if (deltaX < -35) nextSlide();
            if (deltaX > 35) prevSlide();
          }}
        >
          {/* Left Arrow Navigation Button */}
          <button
            onClick={prevSlide}
            type="button"
            suppressHydrationWarning
            className="absolute left-0 sm:left-1 md:left-2 z-50 size-9 sm:size-11 md:size-13 rounded-full bg-white flex items-center justify-center text-on-surface shadow-soft border border-stone-200 hover:scale-110 hover:bg-stone-50 transition-all duration-300 cursor-pointer"
            aria-label="Previous Game"
          >
            <ChevronLeft className="size-4.5 md:size-6 text-on-surface" />
          </button>

          {/* Centered Perspective Carousel Container (Vertical Overflow Visible on Mobile) */}
          <div className="w-full h-full overflow-x-hidden overflow-y-visible py-2 md:py-12 flex items-center justify-center min-h-[380px] sm:min-h-[440px] md:min-h-[520px]">
            <div className="relative w-full flex items-center justify-center transform-gpu overflow-y-visible">
              {GAMES_DATA.map((game, index) => {
                let offset = index - activeIndex;
                const total = GAMES_DATA.length;
                if (offset < -Math.floor(total / 2)) offset += total;
                if (offset > Math.floor(total / 2)) offset -= total;

                const isActive = offset === 0;
                const isAdjacent = Math.abs(offset) === 1;

                const cardWidth = isMobile ? 285 : 320;
                const translateX = offset * (isMobile ? 195 : cardWidth * 0.75);
                const scale = isActive ? (isMobile ? 1.02 : 1.06) : isAdjacent ? (isMobile ? 0.82 : 0.88) : 0.72;
                const opacity = isActive ? 1 : isAdjacent ? 0.85 : 0.4;
                const zIndex = isActive ? 30 : 20 - Math.abs(offset);

                return (
                  <motion.div
                    key={game.id}
                    className="absolute cursor-pointer will-change-transform transform-gpu overflow-y-visible"
                    animate={{
                      x: translateX,
                      scale,
                      opacity,
                    }}
                    transition={{
                      duration: 0.6,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{
                      zIndex,
                    }}
                    onClick={() => setActiveIndex(index)}
                  >
                    <GameCard
                      game={game}
                      isActive={isActive}
                      onPlay={(id) => setActivePlayGame(id)}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right Arrow Navigation Button */}
          <button
            onClick={nextSlide}
            type="button"
            suppressHydrationWarning
            className="absolute right-0 sm:right-1 md:right-2 z-50 size-9 sm:size-11 md:size-13 rounded-full bg-white flex items-center justify-center text-on-surface shadow-soft border border-stone-200 hover:scale-110 hover:bg-stone-50 transition-all duration-300 cursor-pointer"
            aria-label="Next Game"
          >
            <ChevronRight className="size-4.5 md:size-6 text-on-surface" />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {activePlayGame && (
          <GameOverlay
            gameSlug={GAME_ID_TO_SLUG[activePlayGame] || activePlayGame}
            onClose={() => setActivePlayGame(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
