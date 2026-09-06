"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";
import { EASE_STANDARD } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function Preloader() {
  const reducedMotion = usePrefersReducedMotion();
  const [done, setDone] = useState(false);
  // Motion value drives pathLength directly — no React re-render per frame
  const pathProgress = useMotionValue(0);

  useEffect(() => {
    if (reducedMotion) {
      const t = setTimeout(() => setDone(true), 200);
      return () => clearTimeout(t);
    }

    const anim = animate(pathProgress, 1, {
      duration: 1.2,
      ease: "easeOut",
      onComplete: () => setDone(true),
    });

    return () => anim.stop();
  }, [reducedMotion, pathProgress]);

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
                  style={{ pathLength: pathProgress }}
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
