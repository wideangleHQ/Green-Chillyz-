"use client";

import { useState, useRef, MouseEvent, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, CircleDollarSign, ArrowUpRight, Sparkles } from "lucide-react";
import Image from "next/image";
import { GameData } from "./gamesData";

interface GameCardProps {
  game: GameData;
  isActive: boolean;
  onPlay?: (gameId: string) => void;
}

export const GameCard = memo(function GameCard({ game, isActive, onPlay }: GameCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isActive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = (e.clientX - rect.left - width / 2) / (width / 2);
    const mouseY = (e.clientY - rect.top - height / 2) / (height / 2);

    const rotX = -mouseY * 7;
    const rotY = mouseX * 7;
    const spotX = ((e.clientX - rect.left) / width) * 100;
    const spotY = ((e.clientY - rect.top) / height) * 100;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-12px) scale(1.04)`;
    if (spotlightRef.current) {
      spotlightRef.current.style.background = `radial-gradient(circle at ${spotX}% ${spotY}%, rgba(255,255,255,0.6) 0%, transparent 65%)`;
    }
  };

  const handleMouseEnter = () => {
    if (!isActive) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (!isActive) return;
    setIsHovered(false);
    if (cardRef.current) {
      cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)`;
    }
  };

  const hoverActive = isActive && isHovered;

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-[285px] sm:w-[310px] md:w-[350px] flex flex-col gap-3.5 will-change-transform transform-gpu transition-transform duration-300 ease-out ${isActive ? "group" : ""}`}
      style={{
        transformStyle: "preserve-3d",
        pointerEvents: isActive ? "auto" : "none",
      }}
    >
      {/* Top Image Container (+10% height on mobile view only) */}
      <div className={`relative w-full aspect-[4/4.2] sm:aspect-[4/3.8] md:aspect-[4/3.8] rounded-[28px] md:rounded-[36px] overflow-visible bg-stone-100 border border-white/80 shadow-soft transition-all duration-500 ${isActive ? "group-hover:shadow-hover" : ""}`}>
        <div className="relative w-full h-full rounded-[28px] md:rounded-[36px] overflow-hidden">
          {/* Dynamic GPU Spotlight on Hover — active card only */}
          {isActive && (
            <div
              ref={spotlightRef}
              className="absolute inset-0 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
          )}

          {/* Main Artwork Image */}
          <Image
            src={game.image}
            alt={game.name}
            fill
            sizes="(max-width: 768px) 85vw, 350px"
            className={`object-cover transition-transform duration-700 ease-out ${isActive ? "group-hover:scale-108" : ""}`}
          />
        </div>

        {/* Floating Coin Sparkles — active card hover only */}
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
                  <CircleDollarSign className="size-5 text-amber-500 fill-amber-300/40 drop-shadow" />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Floating Top Right Reward Badge */}
        <div className="absolute top-4 right-4 z-30">
          <div
            className="px-3.5 py-1.5 rounded-full text-xs font-sans font-bold uppercase tracking-wider backdrop-blur-md border flex items-center gap-1.5 shadow-md transition-all duration-300"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
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
      <div className={`w-full rounded-[22px] bg-white/80 backdrop-blur-md p-5 border border-white/80 shadow-soft flex flex-col gap-2 transition-all duration-300 ${isActive ? "group-hover:bg-white group-hover:shadow-hover" : ""}`}>
        <div className="flex items-center justify-between">
          <div className="text-lg md:text-xl font-sans font-extrabold text-on-surface uppercase tracking-tight">
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
