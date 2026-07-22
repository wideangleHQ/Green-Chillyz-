"use client";

import { motion } from "framer-motion";
import { BRANDS, type BrandId } from "./brandConfig";

interface Props {
  activeBrand: BrandId;
  visible: boolean;
  reducedMotion: boolean;
}

const PARTICLES = [
  { x: 8, y: 15, size: 3, dur: 7, delay: 0, dx: 12, dy: -18 },
  { x: 22, y: 45, size: 4, dur: 9, delay: 0.5, dx: -8, dy: -22 },
  { x: 35, y: 72, size: 2, dur: 6, delay: 1, dx: 10, dy: -15 },
  { x: 50, y: 20, size: 5, dur: 10, delay: 1.5, dx: -5, dy: -25 },
  { x: 65, y: 55, size: 3, dur: 8, delay: 0.8, dx: 14, dy: -20 },
  { x: 78, y: 30, size: 4, dur: 7, delay: 2, dx: -10, dy: -18 },
  { x: 88, y: 68, size: 2, dur: 11, delay: 0.3, dx: 8, dy: -12 },
  { x: 15, y: 80, size: 3, dur: 9, delay: 1.2, dx: -6, dy: -20 },
  { x: 42, y: 10, size: 4, dur: 8, delay: 0.7, dx: 11, dy: -16 },
  { x: 58, y: 85, size: 3, dur: 10, delay: 1.8, dx: -9, dy: -22 },
  { x: 72, y: 42, size: 5, dur: 7, delay: 0.4, dx: 7, dy: -14 },
  { x: 92, y: 18, size: 2, dur: 9, delay: 2.2, dx: -12, dy: -18 },
  { x: 5, y: 55, size: 4, dur: 8, delay: 1.6, dx: 10, dy: -20 },
  { x: 30, y: 35, size: 3, dur: 11, delay: 0.9, dx: -7, dy: -16 },
  { x: 82, y: 75, size: 2, dur: 6, delay: 1.4, dx: 5, dy: -12 },
  { x: 48, y: 62, size: 4, dur: 9, delay: 2.5, dx: -11, dy: -24 },
] as const;

export function HeroParticles({ activeBrand, visible, reducedMotion }: Props) {
  if (reducedMotion) return null;

  const color = BRANDS[activeBrand].colors.particle;

  return (
    <div
      className="absolute inset-0 z-10 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={
            visible
              ? {
                  backgroundColor: color,
                  y: [0, p.dy, 0],
                  x: [0, p.dx, 0],
                  opacity: [0.12, 0.35, 0.12],
                }
              : { opacity: 0, backgroundColor: color }
          }
          transition={
            visible
              ? {
                  backgroundColor: { duration: 0.8 },
                  y: { duration: p.dur, repeat: Infinity, ease: "easeInOut", delay: p.delay },
                  x: { duration: p.dur * 1.3, repeat: Infinity, ease: "easeInOut", delay: p.delay },
                  opacity: { duration: p.dur, repeat: Infinity, ease: "easeInOut", delay: p.delay },
                }
              : { opacity: { duration: 0.3 }, backgroundColor: { duration: 0.8 } }
          }
        />
      ))}
    </div>
  );
}
