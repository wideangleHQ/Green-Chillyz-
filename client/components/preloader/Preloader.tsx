"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_STANDARD } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { imageLoader } from "@/lib/imageLoader";

/**
 * Brand-mark preloader (13_Animation_Timeline.md): ring stroke-draws
 * around the mark, then the whole layer fades — under 1.5s total.
 * Skipped entirely under reduced motion.
 */
export function Preloader() {
  const reducedMotion = usePrefersReducedMotion();
  const [progress, setProgress] = useState(0);
  const [isPriorityDone, setIsPriorityDone] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    // Start preloading the images
    imageLoader.start();

    // Subscribe to loading progress
    const unsubscribe = imageLoader.subscribe((prog, loaded, total, done) => {
      setProgress(prog);
      if (done) {
        setIsPriorityDone(true);
      }
    });

    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, reducedMotion ? 200 : 1200);

    const failsafeTimer = setTimeout(() => {
      setIsPriorityDone(true);
      setMinTimeElapsed(true);
      setProgress(100);
    }, 4500);

    return () => {
      unsubscribe();
      clearTimeout(timer);
      clearTimeout(failsafeTimer);
    };
  }, [reducedMotion]);

  const done = reducedMotion ? minTimeElapsed : (isPriorityDone && minTimeElapsed);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          aria-hidden="true"
          className="fixed inset-0 z-80 flex items-center justify-center bg-surface"
          exit={{ opacity: 0, transition: { duration: 0.4, ease: EASE_STANDARD } }}
        >
          {!reducedMotion && (
            <div className="relative flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center size-36">
                <motion.svg
                  viewBox="0 0 120 120"
                  className="absolute size-32 text-primary"
                  fill="none"
                  initial={{ rotate: -90 }}
                >
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: progress / 100 }}
                    transition={{ duration: 0.1, ease: "easeOut" }}
                  />
                </motion.svg>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: EASE_STANDARD }}
                >
                  <Image
                    src="/assets/icons/logo.png"
                    alt=""
                    width={72}
                    height={72}
                    priority
                    className="size-18 object-contain"
                  />
                </motion.div>
              </div>

              {/* High-end loading text and percentage indicator */}
              <div className="absolute bottom-[-16px] flex flex-col items-center gap-1.5 select-none pointer-events-none">
                <span className="text-[10px] uppercase tracking-[0.25em] text-on-surface-variant/40 font-medium">
                  Loading Experience
                </span>
                <span className="text-[13px] font-bold tracking-wider text-primary tabular-nums">
                  {progress}%
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
