"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { SPRING } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type ButtonVariant = "primary" | "primary-green" | "primary-red" | "secondary" | "ghost";

interface ButtonProps {
  variant?: ButtonVariant;
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

/* Pill buttons per 04_Component_Library.md:
   primary = gradient fill, expanding soft shadow; secondary = ghost pill,
   1px white border + blur backdrop; ghost = borderless quiet action. */
const base =
  "inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-full px-8 py-3.5 text-nav-link transition-all duration-200 font-sans font-extrabold uppercase tracking-wider";

const variants: Record<ButtonVariant, string> = {
  primary:
    "btn-fluid-red text-white shadow-soft font-bold tracking-wider",
  "primary-green":
    "bg-brand-green hover:bg-brand-green-hover text-white shadow-soft hover:shadow-hover font-bold tracking-wider",
  "primary-red":
    "btn-fluid-red text-white shadow-soft font-bold tracking-wider",
  secondary:
    "bg-white/90 hover:bg-white text-stone-900 border border-stone-200/80 shadow-soft font-bold tracking-wider hover:border-brand-green/40 transition-colors duration-200",
  ghost:
    "border border-stone-300 text-on-surface hover:bg-stone-100/80 transition-colors duration-200 font-bold",
};

const MotionLink = motion.create(Link);

export function Button({
  variant = "primary",
  href,
  onClick,
  children,
  className = "",
  ariaLabel,
}: ButtonProps) {
  const reducedMotion = usePrefersReducedMotion();
  const interaction = reducedMotion
    ? {}
    : {
        whileHover: { y: -3 },
        whileTap: { scale: 0.98 },
        transition: SPRING,
      };
  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <MotionLink href={href} aria-label={ariaLabel} className={classes} {...interaction}>
        {children}
      </MotionLink>
    );
  }
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={classes}
      {...interaction}
    >
      {children}
    </motion.button>
  );
}
