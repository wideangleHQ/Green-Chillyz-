"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { BRANDS, BRAND_ORDER, type BrandId } from "./brandConfig";
import { EASE_STANDARD } from "@/lib/motion";

const PETAL =
  "M 0 -110 C 18 -80 32 -20 28 45 C 24 85 10 115 0 130 C -10 115 -24 85 -28 45 C -32 -20 -18 -80 0 -110 Z";

const STEM =
  "M -4 -110 C -6 -130 -2 -145 4 -140 C 10 -136 8 -125 4 -110 Z";

interface Props {
  splitProgress: MotionValue<number>;
  activeBrand: BrandId;
  introComplete: boolean;
  onBrandSelect: (brand: BrandId) => void;
  reducedMotion: boolean;
}

export function ChilliSwitcher({
  splitProgress,
  activeBrand,
  introComplete,
  onBrandSelect,
  reducedMotion,
}: Props) {
  /* ── scroll-derived transforms (all hooks called unconditionally) ── */

  // petal 0 — green (left)
  const p0x = useTransform(splitProgress, [0.25, 0.65], [0, -80]);
  const p0y = useTransform(splitProgress, [0.25, 0.65], [0, -10]);
  const p0r = useTransform(splitProgress, [0.25, 0.65], [0, -18]);

  // petal 1 — yellow (center)
  const p1x = useTransform(splitProgress, [0.25, 0.65], [0, 0]);
  const p1y = useTransform(splitProgress, [0.25, 0.65], [0, -28]);
  const p1r = useTransform(splitProgress, [0.25, 0.65], [0, 0]);

  // petal 2 — red (right)
  const p2x = useTransform(splitProgress, [0.25, 0.65], [0, 80]);
  const p2y = useTransform(splitProgress, [0.25, 0.65], [0, -10]);
  const p2r = useTransform(splitProgress, [0.25, 0.65], [0, 18]);

  const petalTransforms = [
    { x: p0x, y: p0y, rotate: p0r },
    { x: p1x, y: p1y, rotate: p1r },
    { x: p2x, y: p2y, rotate: p2r },
  ];

  // whole-chilli transforms
  const chilliScale = useTransform(
    splitProgress,
    [0, 0.15, 0.65, 0.85],
    [1, 1.06, 0.82, 0.72],
  );
  const chilliRotateZ = useTransform(splitProgress, [0, 0.25], [0, 12]);
  const chilliY = useTransform(splitProgress, [0.5, 0.9], [0, -40]);

  // neutral → brand crossfade
  const neutralOpacity = useTransform(splitProgress, [0.2, 0.5], [1, 0]);
  const brandOpacity = useTransform(splitProgress, [0.2, 0.5], [0, 1]);

  // glow
  const glowIntensity = useTransform(splitProgress, [0.1, 0.35], [0, 0.7]);

  // stem fades during split
  const stemOpacity = useTransform(splitProgress, [0.2, 0.4], [1, 0]);

  // energy lines
  const energyOpacity = useTransform(
    splitProgress,
    [0.15, 0.3, 0.5, 0.65],
    [0, 0.6, 0.6, 0],
  );

  // labels appear after split
  const labelOpacity = useTransform(splitProgress, [0.72, 0.92], [0, 1]);

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
      {/* floating wrapper — continuous idle drift */}
      <motion.div
        animate={
          reducedMotion
            ? undefined
            : { y: [0, -8, 0], rotate: [0, 1.5, 0] }
        }
        transition={
          reducedMotion
            ? undefined
            : { duration: 5, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {/* scroll-linked wrapper */}
        <motion.div
          style={
            reducedMotion
              ? undefined
              : { scale: chilliScale, rotate: chilliRotateZ, y: chilliY }
          }
        >
          <svg
            viewBox="-160 -160 320 320"
            className="w-52 h-60 md:w-72 md:h-80 xl:w-80 xl:h-[22rem]"
            aria-hidden="true"
          >
            <defs>
              {/* glow filters */}
              {BRAND_ORDER.map((id) => (
                <filter
                  key={id}
                  id={`glow-${id}`}
                  x="-80%"
                  y="-80%"
                  width="260%"
                  height="260%"
                >
                  <feGaussianBlur stdDeviation="10" result="b" />
                  <feFlood floodColor={BRANDS[id].colors.glow} result="c" />
                  <feComposite in="c" in2="b" operator="in" result="cb" />
                  <feMerge>
                    <feMergeNode in="cb" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}

              {/* brand gradients */}
              {BRAND_ORDER.map((id) => (
                <linearGradient
                  key={id}
                  id={`grad-${id}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={BRANDS[id].chilliGradient[0]}
                  />
                  <stop
                    offset="100%"
                    stopColor={BRANDS[id].chilliGradient[1]}
                  />
                </linearGradient>
              ))}

              {/* neutral chilli gradient */}
              <linearGradient id="grad-neutral" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2e7d32" />
                <stop offset="100%" stopColor="#1b5e20" />
              </linearGradient>

              {/* specular highlight */}
              <linearGradient id="specular" x1="0.3" y1="0" x2="0.7" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
                <stop offset="40%" stopColor="rgba(255,255,255,0.06)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>

            {/* energy lines — radiate outward during split */}
            {BRAND_ORDER.map((id, i) => {
              const angle = (i - 1) * 45;
              const rad = (angle * Math.PI) / 180;
              return (
                <motion.line
                  key={`e-${id}`}
                  x1="0"
                  y1="0"
                  x2={Math.sin(rad) * 110}
                  y2={-Math.cos(rad) * 110}
                  stroke={BRANDS[id].colors.primary}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  style={{ opacity: energyOpacity }}
                />
              );
            })}

            {/* stem */}
            <motion.path
              d={STEM}
              fill="#2e7d32"
              style={{ opacity: stemOpacity }}
            />

            {/* petals */}
            {BRAND_ORDER.map((id, i) => {
              const t = petalTransforms[i];
              const isActive = activeBrand === id;
              const brand = BRANDS[id];

              return (
                <motion.g
                  key={id}
                  style={reducedMotion ? undefined : { x: t.x, y: t.y, rotate: t.rotate }}
                  className={
                    introComplete
                      ? "pointer-events-auto cursor-pointer"
                      : ""
                  }
                  onClick={
                    introComplete ? () => onBrandSelect(id) : undefined
                  }
                  role={introComplete ? "button" : undefined}
                  aria-label={
                    introComplete ? `Switch to ${brand.name}` : undefined
                  }
                  tabIndex={introComplete ? 0 : undefined}
                  onKeyDown={
                    introComplete
                      ? (e: React.KeyboardEvent) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onBrandSelect(id);
                          }
                        }
                      : undefined
                  }
                >
                  {/* glow layer */}
                  <motion.path
                    d={PETAL}
                    fill={brand.colors.glow}
                    style={{ opacity: glowIntensity }}
                    filter={`url(#glow-${id})`}
                  />

                  {/* neutral fill (fades out during split) */}
                  <motion.path
                    d={PETAL}
                    fill="url(#grad-neutral)"
                    style={
                      reducedMotion ? { opacity: 0 } : { opacity: neutralOpacity }
                    }
                  />

                  {/* brand fill (fades in during split) */}
                  <motion.path
                    d={PETAL}
                    fill={`url(#grad-${id})`}
                    style={
                      reducedMotion ? { opacity: 1 } : { opacity: brandOpacity }
                    }
                  />

                  {/* specular */}
                  <path d={PETAL} fill="url(#specular)" />

                  {/* active ring */}
                  {introComplete && (
                    <motion.ellipse
                      cx="0"
                      cy="10"
                      rx="36"
                      ry="50"
                      fill="none"
                      stroke={brand.colors.accent}
                      strokeWidth="1.5"
                      initial={false}
                      animate={{
                        opacity: isActive ? 0.5 : 0,
                        scale: isActive ? 1 : 0.85,
                      }}
                      transition={{ duration: 0.4, ease: EASE_STANDARD }}
                    />
                  )}
                </motion.g>
              );
            })}
          </svg>
        </motion.div>
      </motion.div>

      {/* ── brand labels beneath the chilli ── */}
      <motion.div
        className="mt-4 flex gap-6 md:gap-12"
        style={{
          opacity: reducedMotion ? 1 : labelOpacity,
          pointerEvents: introComplete ? "auto" : "none",
        }}
      >
        {BRAND_ORDER.map((id) => {
          const brand = BRANDS[id];
          const isActive = activeBrand === id;
          return (
            <motion.button
              key={id}
              type="button"
              onClick={() => onBrandSelect(id)}
              className="flex flex-col items-center gap-2 bg-transparent border-none outline-none"
              animate={{
                opacity: isActive ? 1 : 0.35,
                scale: isActive ? 1 : 0.96,
              }}
              transition={{ duration: 0.35 }}
              aria-label={`Switch to ${brand.name}`}
              aria-pressed={isActive}
            >
              <span className="text-[10px] md:text-label-caps uppercase tracking-[0.15em] text-white/70 font-medium whitespace-nowrap">
                {brand.name}
              </span>
              <motion.div
                className="h-[2px] rounded-full"
                style={{ backgroundColor: brand.colors.primary }}
                animate={{
                  width: isActive ? 28 : 0,
                  opacity: isActive ? 1 : 0,
                }}
                transition={{ duration: 0.4, ease: EASE_STANDARD }}
              />
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
