import type { Transition, Variants } from "framer-motion";

/* Motion tokens — 03_Animation_Guidelines.md / 19_Design_Tokens.md */
export const EASE_STANDARD = [0.16, 1, 0.3, 1] as const;

export const DURATION = {
  micro: 0.2, // hover/tap 150–250ms
  reveal: 0.5, // section reveals 400–700ms
  transition: 0.7, // page/section transitions 600–900ms
} as const;

export const STAGGER = {
  card: 0.08, // 80ms per card
  list: 0.06, // 60ms per list item
  line: 0.08, // 80ms per text line
} as const;

export const SPRING: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 26,
};

/* Shared variants — reused by every section; never redefined ad hoc */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.reveal, ease: EASE_STANDARD },
  },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.reveal, ease: EASE_STANDARD },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.reveal, ease: EASE_STANDARD },
  },
};

export const staggerChildren = (delta: number): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: delta } },
});

/* Reduced-motion replacement: simple ~200ms opacity fade, no transforms */
export const reducedFade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

/* Reveal trigger config: fire at 20% visibility (13_Animation_Timeline.md) */
export const VIEWPORT = { once: true, amount: 0.2 } as const;
