"use client";

import { useState, useRef, MouseEvent, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ArrowUpRight, Sparkles } from "lucide-react";
import { RupeeCoin } from "@/components/ui/RupeeCoin";
import Image from "next/image";
import { GameData } from "./gamesData";

interface GameCardProps {
  game: GameData;
  isActive: boolean;
  onPlay?: (gameId: string) => void;
  size?: "default" | "compact";
}

export const GameCard = memo(function GameCard({ game, isActive, onPlay, size = "default" }: GameCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isActive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (spotlightRef.current) {
      spotlightRef.current.style.opacity = "1";
      spotlightRef.current.style.background = `radial-gradient(400px circle at ${x}px ${y}px, rgba(255, 255, 255, 0.4), transparent 60%)`;
    }
  };

  const handleMouseEnter = () => {
    if (isActive) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (spotlightRef.current) {
      spotlightRef.current.style.opacity = "0";
    }
  };

  const hoverActive = isActive && isHovered;
  const compact = size === "compact";

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative ${compact ? "w-[260px] sm:w-[280px] md:w-[300px] lg:w-[300px] xl:w-[310px] h-[350px] sm:h-[390px] md:h-[410px] lg:h-[430px]" : "w-full h-[380px] sm:h-[460px] md:h-[480px] lg:h-[500px]"} rounded-[28px] overflow-hidden transition-all duration-300 select-none flex flex-col justify-between border ${
        isActive
          ? "border-stone-200/80 shadow-heavy hover:shadow-hover hover:-translate-y-1.5"
          : "border-stone-200/40 shadow-soft opacity-60 scale-[0.98]"
      }`}
      style={{
        backgroundColor: "#ffffff",
      }}
    >
      {/* Interactive Spotlight Effect */}
      <div
        ref={spotlightRef}
        className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 opacity-0"
      />

      {/* Top Banner & Visual Artwork Container */}
      <div className="relative w-full h-[52%] sm:h-[55%] overflow-hidden bg-stone-100">
        {/* Visual Game Image */}
        <div className="relative w-full h-full">
          <Image
            src={game.image}
            alt={game.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`object-cover transition-transform duration-700 ease-out ${
              hoverActive ? "scale-108" : "scale-100"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 via-transparent to-black/10" />
        </div>

        {/* Ambient Floating Coins on Hover */}
        <AnimatePresence>
          {hoverActive && (
            <div className="absolute inset-0 pointer-events-none z-20 overflow-visible">
              {[0, 1].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 100, x: 50 + i * 120 }}
                  animate={{
                    opacity: [0, 1, 0],
                    y: -30,
                    x: 50 + i * 120 + (i % 2 === 0 ? 12 : -12),
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 1.5 + i * 0.3,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: i * 0.3,
                  }}
                  className="absolute"
                >
                  <RupeeCoin className="size-5 text-amber-500 fill-amber-300/40 drop-shadow" />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Floating Top Right Reward Badge */}
        <div className="absolute top-4 right-4 z-30">
          <div
            className="px-3.5 py-1.5 rounded-full text-xs font-sans font-bold uppercase tracking-wider border flex items-center gap-1.5 shadow-md transition-all duration-300"
            style={{
              backgroundColor: "#ffffff",
              color: game.accentColor,
              borderColor: `${game.accentColor}40`,
              boxShadow: hoverActive ? `0 0 16px ${game.accentColor}40` : "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            <Sparkles className="size-3.5 animate-pulse" />
            {game.rewardBadge}
          </div>
        </div>

        {/* Floating Bottom Action Button */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
          <button
            type="button"
            suppressHydrationWarning
            onClick={(e) => {
              e.stopPropagation();
              if (isActive && onPlay) onPlay(game.id);
            }}
            className={`flex items-center gap-2 rounded-full bg-brand-green px-5 py-2 text-xs font-sans font-semibold uppercase tracking-wider text-white shadow-md transition-all duration-300 border-none cursor-pointer ${isActive ? "group-hover:bg-brand-green-hover group-hover:scale-105" : ""}`}
          >
            <span>Play Now</span>
            <ArrowUpRight className={`size-3.5 transition-transform duration-300 ${isActive ? "group-hover:translate-x-0.5 group-hover:-translate-y-0.5" : ""}`} />
          </button>
        </div>
      </div>

      {/* Bottom Content Card Box */}
      <div className={`${compact ? "rounded-[18px] p-4" : "rounded-[22px] p-5"} w-full bg-white border border-stone-200/80 shadow-soft flex flex-col gap-2 transition-all duration-300 ${isActive ? "group-hover:shadow-hover" : ""}`}>
        <div className="flex items-center justify-between">
          <div className={`${compact ? "text-base md:text-lg" : "text-lg md:text-xl"} font-sans font-extrabold text-on-surface uppercase tracking-tight`}>
            {game.name}
          </div>
          {/* Rating Badge */}
          <div className="flex items-center gap-1 text-xs font-sans font-bold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            <Star className="size-3.5 fill-amber-500 text-amber-500" />
            <span>{game.rating.toFixed(1)}</span>
          </div>
        </div>

        <p className="text-xs md:text-sm text-on-surface-variant font-sans leading-relaxed line-clamp-2">
          {game.description}
        </p>
      </div>
    </div>
  );
});
