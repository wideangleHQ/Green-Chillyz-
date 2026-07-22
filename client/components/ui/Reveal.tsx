"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp, reducedFade, staggerChildren, VIEWPORT } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * Scroll-triggered reveal wrapper — fires at 20% visibility
 * (13_Animation_Timeline.md). Under reduced motion, collapses to a
 * 200ms opacity fade with no transforms (11_Accessibility.md).
 */
export function Reveal({
  children,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "figure" | "h2" | "h3" | "p";
}) {
  const reducedMotion = usePrefersReducedMotion();
  const Component = motion[as];
  return (
    <Component
      className={className}
      variants={reducedMotion ? reducedFade : fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
    >
      {children}
    </Component>
  );
}

/**
 * Parent that staggers its Reveal-variant children (80ms cards / 60ms lists).
 * Reduced motion caps stagger at 20ms per 13_Animation_Timeline.md.
 */
export function RevealGroup({
  children,
  className = "",
  stagger = 0.08,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  as?: "div" | "ul" | "ol";
}) {
  const reducedMotion = usePrefersReducedMotion();
  const Component = motion[as];
  return (
    <Component
      className={className}
      variants={staggerChildren(reducedMotion ? 0.02 : stagger)}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
    >
      {children}
    </Component>
  );
}

/** Child item for RevealGroup — inherits the parent's stagger timing. */
export function RevealItem({
  children,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "figure";
}) {
  const reducedMotion = usePrefersReducedMotion();
  const Component = motion[as];
  return (
    <Component className={className} variants={reducedMotion ? reducedFade : fadeUp}>
      {children}
    </Component>
  );
}
