"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ShieldAlert, Sparkles, X } from "lucide-react";
import { useGameConfig, useMyGameSessions } from "@/hooks/useGames";
import { SpinWheelGame } from "./SpinWheelGame";

interface GameOverlayProps {
  gameSlug: string;
  onClose: () => void;
}

export function GameOverlay({ gameSlug, onClose }: GameOverlayProps) {
  const { data: game, isLoading: isConfigLoading, error: configError } = useGameConfig(gameSlug);
  const { data: sessionHistory, isLoading: isHistoryLoading, refetch: refetchHistory } = useMyGameSessions(
    { gameId: game?.id },
    !!game?.id,
  );

  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState<number>(0);
  const [playsToday, setPlaysToday] = useState<number>(0);
  const [showGameInstance, setShowGameInstance] = useState(false);

  // Calculate daily limit usage and cooldown timers based on session history
  useEffect(() => {
    if (!game || !sessionHistory?.items) return;

    const history = sessionHistory.items;
    
    // 1. Calculate Daily Plays
    const today = new Date().toISOString().split("T")[0];
    const dailyPlays = history.filter((s) => {
      if (!s.createdAt) return false;
      const createdDate = s.createdAt.split("T")[0];
      return (
        createdDate === today &&
        ["COMPLETED", "REWARDED", "FAILED"].includes(s.status)
      );
    }).length;
    setPlaysToday(dailyPlays);

    // 2. Calculate Cooldown Timer
    if (game.cooldown > 0) {
      const completedSessions = history.filter((s) =>
        ["COMPLETED", "REWARDED", "FAILED"].includes(s.status) && s.endedAt
      );

      if (completedSessions.length > 0) {
        // Find most recent ended session
        const lastEnded = Math.max(
          ...completedSessions.map((s) => new Date(s.endedAt!).getTime())
        );
        const cooldownMs = game.cooldown * 1000;
        const now = Date.now();
        const diff = lastEnded + cooldownMs - now;

        if (diff > 0) {
          setCooldownSecondsLeft(Math.ceil(diff / 1000));
        } else {
          setCooldownSecondsLeft(0);
        }
      } else {
        setCooldownSecondsLeft(0);
      }
    }
  }, [game, sessionHistory]);

  // Cooldown Countdown Interval
  useEffect(() => {
    if (cooldownSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setCooldownSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSecondsLeft]);

  const handleGameSuccess = () => {
    refetchHistory();
  };

  const isLoading = isConfigLoading || isHistoryLoading;
  const isDailyLimitReached = game && game.dailyLimit > 0 && playsToday >= game.dailyLimit;
  const isInCooldown = cooldownSecondsLeft > 0;
  const isPlayDisabled = isDailyLimitReached || isInCooldown;

  // Format cooldown remaining
  const formatCooldown = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs > 0 ? hrs + "h " : ""}${mins > 0 ? mins + "m " : ""}${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
      {/* Click Outside to Close */}
      <div className="absolute inset-0 cursor-default" onClick={showGameInstance ? undefined : onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-lg overflow-y-auto max-h-[90vh]"
      >
        {isLoading ? (
          <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-xl flex flex-col items-center gap-4 text-center">
            <div className="size-12 rounded-full border-4 border-stone-200 border-t-brand-green animate-spin" />
            <h3 className="font-sans font-bold text-stone-600">Loading Game Details...</h3>
          </div>
        ) : configError || !game ? (
          <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-xl flex flex-col items-center gap-4 text-center">
            <div className="size-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <ShieldAlert className="size-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-stone-900">Game Not Found</h3>
            <p className="text-sm font-sans text-stone-500">
              This game is not currently available or active in your region.
            </p>
            <button
              onClick={onClose}
              className="bg-brand-red text-white py-2 px-6 rounded-full font-semibold transition"
            >
              Close
            </button>
          </div>
        ) : showGameInstance ? (
          /* Render the actual active game component (e.g. SpinWheelGame) */
          game.slug === "spin-wheel" ? (
            <SpinWheelGame
              game={game}
              onClose={() => setShowGameInstance(false)}
              onSuccess={handleGameSuccess}
            />
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-xl text-center flex flex-col items-center gap-4">
              <div className="size-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <ShieldAlert className="size-6" />
              </div>
              <h3 className="font-heading text-lg font-bold text-stone-900 uppercase">Coming Soon!</h3>
              <p className="text-sm font-sans text-stone-500">
                The game "{game.name}" is not yet pluggable. Support will be added soon.
              </p>
              <button
                onClick={() => setShowGameInstance(false)}
                className="bg-brand-green text-white py-2.5 px-6 rounded-full font-semibold transition hover:bg-brand-green-hover"
              >
                Back
              </button>
            </div>
          )
        ) : (
          /* Render the Lobby/Pre-play Screen */
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xl flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-heading text-xl font-bold uppercase text-on-surface tracking-wide">
                Game Lobby
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Game Card Lobby Preview */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-stone-50 rounded-2xl p-4 border border-stone-100">
              <div className="flex-1">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-green bg-brand-green/10 px-2.5 py-1 rounded-full border border-brand-green/20">
                  {game.rewardType || "COINS"} Reward Game
                </span>
                <h4 className="font-sans text-lg font-bold text-on-surface uppercase tracking-tight mt-2.5">
                  {game.name}
                </h4>
                <p className="text-xs font-sans text-stone-500 leading-normal mt-1">
                  {game.description}
                </p>
              </div>
            </div>

            {/* Daily Limits & Cooldown Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 flex flex-col gap-1">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-400">
                  Daily Limit
                </span>
                <span className="font-sans font-extrabold text-sm text-stone-700">
                  {game.dailyLimit > 0 ? `${playsToday} / ${game.dailyLimit} played` : "Unlimited plays"}
                </span>
              </div>
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 flex flex-col gap-1">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-400">
                  Cooldown
                </span>
                <span className="font-sans font-extrabold text-sm text-stone-700">
                  {game.cooldown > 0 ? formatCooldown(game.cooldown) : "None"}
                </span>
              </div>
            </div>

            {/* Eligibility Warnings */}
            {isDailyLimitReached && (
              <div className="bg-red-50 text-red-700 border border-red-200/50 rounded-xl p-3 flex items-start gap-2 text-xs">
                <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                <span>You have reached the daily play limit for this game. Try again tomorrow!</span>
              </div>
            )}

            {isInCooldown && (
              <div className="bg-amber-50 text-amber-700 border border-amber-200/50 rounded-xl p-3 flex items-start gap-2 text-xs">
                <Clock className="size-4 shrink-0 mt-0.5 animate-pulse" />
                <span>
                  Cooldown is active. Please wait <strong>{formatCooldown(cooldownSecondsLeft)}</strong> before playing again.
                </span>
              </div>
            )}

            {/* Play CTA Button */}
            <button
              onClick={() => setShowGameInstance(true)}
              disabled={isPlayDisabled}
              className={`w-full font-sans font-semibold py-3.5 px-6 rounded-full transition shadow-soft flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-sm ${
                isPlayDisabled
                  ? "bg-stone-150 border border-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                  : "bg-brand-green hover:bg-brand-green-hover text-white"
              }`}
            >
              <Sparkles className="size-4" />
              {isInCooldown ? "Lobby Locked" : "Play Game"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
