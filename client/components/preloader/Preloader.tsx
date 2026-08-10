"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_STANDARD } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
/**
 * Brand-mark preloader (13_Animation_Timeline.md): ring stroke-draws
 * around the mark, then the whole layer fades — under 1.5s total.
 * Skipped entirely under reduced motion.
 */
export function Preloader() {
  const reducedMotion = usePrefersReducedMotion();
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      const t = setTimeout(() => setDone(true), 200);
      return () => clearTimeout(t);
    }

    let start = performance.now();
    let rAF: number;
    const duration = 1200; // 1.2s minimum visual time

    const animate = (time: number) => {
      const elapsed = time - start;
      const p = Math.min((elapsed / duration) * 100, 100);
      setProgress(p);

      if (p < 100) {
        rAF = requestAnimationFrame(animate);
      } else {
        setDone(true);
      }
    };

    rAF = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rAF);
  }, [reducedMotion]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          aria-hidden="true"
          className="fixed inset-0 z-[100] grid place-items-center bg-surface"
          exit={{ opacity: 0, transition: { duration: 0.4, ease: EASE_STANDARD } }}
        >
          {!reducedMotion && (
            <div className="relative grid place-items-center w-32 h-32">
              <motion.svg
                viewBox="0 0 120 120"
                className="absolute inset-0 w-full h-full text-primary"
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
                className="relative z-10 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: EASE_STANDARD }}
              >
                <Image
                  src="/assets/icons/logo.png"
                  alt="Green Chillyz Logo"
                  width={72}
                  height={72}
                  priority
                  className="w-[72px] h-[72px] object-contain"
                />
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
