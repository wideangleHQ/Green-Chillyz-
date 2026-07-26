"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, CircleDollarSign, Gamepad2 } from "lucide-react";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Navbar } from "@/components/navbar/Navbar";
import { GameCard } from "@/components/games/GameCard";
import { GAMES_DATA } from "@/components/games/gamesData";
import { GameOverlay } from "@/components/games/GameOverlay";
import { Reveal } from "@/components/ui/Reveal";
import { EASE_STANDARD, DURATION, STAGGER } from "@/lib/motion";

const GAME_ID_TO_SLUG: Record<string, string> = {
  "spin-win": "spin-wheel",
};

// Framer Motion Stagger Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: STAGGER.card,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 35 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.transition,
      ease: EASE_STANDARD,
    },
  },
};

export default function GamesPage() {
  const [activePlayGame, setActivePlayGame] = useState<string | null>(null);

  return (
    <SmoothScroll>
      <Navbar />
      <main className="relative min-h-screen bg-[#FFF8F1] overflow-x-hidden pt-28 pb-16 px-5 sm:px-8">
        
        {/* Large Faded Background Typography */}
        <div className="absolute top-[8%] left-1/2 -translate-x-1/2 text-[15vw] lg:text-[12vw] font-heading text-on-surface/[0.025] pointer-events-none select-none z-0 tracking-widest uppercase leading-none whitespace-nowrap">
          GC ARCADE
        </div>

        {/* Soft Ambient Radial Lights */}
        <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.95)_0%,transparent_60%)]" />
        <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,107,42,0.03)_0%,transparent_50%)]" />

        {/* Floating Low-Opacity Coin Accents */}
        <div className="absolute top-[15%] left-[5%] pointer-events-none z-0 opacity-10 rotate-12">
          <CircleDollarSign className="size-16 md:size-24 text-amber-600 stroke-[1]" />
        </div>
        <div className="absolute bottom-[15%] right-[5%] pointer-events-none z-0 opacity-10 -rotate-[20deg]">
          <CircleDollarSign className="size-20 md:size-28 text-amber-600 stroke-[1]" />
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col gap-10">
          
          {/* Header Block */}
          <div className="flex flex-col items-center text-center gap-4 max-w-2xl mx-auto">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-green/10 text-brand-green px-4 py-1.5 text-xs font-sans font-bold uppercase tracking-wider border border-brand-green/20">
                <Gamepad2 className="size-3.5 animate-pulse" /> Play & Win
              </div>
            </Reveal>

            <Reveal>
              <h1 className="text-[44px] sm:text-[54px] md:text-[62px] font-heading leading-[0.92] uppercase font-extrabold tracking-tight">
                GC <span className="text-brand-green">ARCADE</span> LOBBY
              </h1>
            </Reveal>

            {/* Star Divider */}
            <div className="flex items-center gap-3 justify-center w-full my-0.5">
              <div className="h-[1.5px] bg-on-surface/15 w-16" />
              <Star className="size-4 text-brand-red fill-none stroke-[1.5]" />
              <div className="h-[1.5px] bg-on-surface/15 w-16" />
            </div>

            <Reveal>
              <p className="text-sm sm:text-base md:text-lg font-sans text-on-surface-variant leading-relaxed">
                Step into the GreenChillyz Arcade! Choose your favorite game below, score points on the weekly leaderboard, and earn coins to redeem for premium dishes and discounts.
              </p>
            </Reveal>
          </div>

          {/* Grid Layout of Games */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 justify-items-center mt-4"
          >
            {GAMES_DATA.map((game) => (
              <motion.div
                key={game.id}
                variants={itemVariants}
                className="w-full flex justify-center"
              >
                <GameCard
                  game={game}
                  isActive={true} // Enable full tilt & hover interactions on all games
                  onPlay={(id) => setActivePlayGame(id)}
                />
              </motion.div>
            ))}
          </motion.div>

        </div>

        {/* Game Overlay Modal */}
        <AnimatePresence>
          {activePlayGame && (
            <GameOverlay
              gameSlug={GAME_ID_TO_SLUG[activePlayGame] || activePlayGame}
              onClose={() => setActivePlayGame(null)}
            />
          )}
        </AnimatePresence>
      </main>
    </SmoothScroll>
  );
}
