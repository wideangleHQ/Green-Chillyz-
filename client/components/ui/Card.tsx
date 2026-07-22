"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { SPRING } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface CardProps {
  variant?: "glass" | "solid";
  interactive?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Shared card primitive (04_Component_Library.md): ≥24px radius,
 * 32–40px padding, identical hover behavior everywhere on the homepage —
 * subtle 1.02 scale + green-tinted shadow (17_Interaction_Principles.md).
 */
export function Card({
  variant = "solid",
  interactive = false,
  children,
  className = "",
}: CardProps) {
  const reducedMotion = usePrefersReducedMotion();
  const surface =
    variant === "glass"
      ? "glass"
      : "bg-surface-container shadow-soft";

  return (
    <motion.div
      className={`rounded-md p-6 md:p-8 text-on-surface ${surface} ${
        interactive ? "transition-shadow duration-200 hover:shadow-hover" : ""
      } ${className}`}
      whileHover={interactive && !reducedMotion ? { scale: 1.02 } : undefined}
      transition={SPRING}
    >
      {children}
    </motion.div>
  );
}
