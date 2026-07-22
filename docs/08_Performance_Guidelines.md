# 08 — Performance Guidelines

## Core Web Vitals Targets
- **LCP** (Largest Contentful Paint): < 2.0s
- **CLS** (Cumulative Layout Shift): < 0.05
- **INP** (Interaction to Next Paint): < 200ms

## Animation Budget
No more than 2–3 simultaneous animated properties on screen at once (opacity/transform preferred; avoid animating `width`/`height`/`top`/`left` — use `transform`/`opacity` only for GPU-accelerated compositing).

## GPU Usage
Blur effects (glassmorphism) are expensive — limit concurrent `backdrop-filter: blur()` elements on screen to a small, deliberate number (nav + one active glass card region), not every card simultaneously blurred at full viewport scroll.

## Image Sizes
Hero imagery: max delivered weight ~200KB (AVIF/WebP, responsive). Card thumbnails: <50KB each. All via Cloudinary auto-format/auto-quality.

## Video Sizes
Hero background video: <3MB, <15s loop, 720p delivered (upscale via CSS, not source), muted, no audio track shipped.

## Loading Strategy
Above-the-fold (Hero) content: eager-loaded, no lazy-load, no skeleton (must paint immediately). Everything below the fold: lazy-loaded via intersection observer with skeleton placeholders matching final layout dimensions (prevents CLS).

## Lazy Loading
Sections load their imagery/video only as they approach viewport (150px rootMargin). Non-critical scripts (analytics, Clarity) deferred until after first interaction or idle callback.

## Caching
Static assets cached at Cloudflare edge; Cloudinary handles image CDN caching independently; Next.js ISR/static generation used for homepage where content isn't fully dynamic per-user.

## Asset Optimization
All images/video pre-processed through Cloudinary pipeline (see `09_Asset_Pipeline.md`) — never ship unoptimized source files to production.

## Do / Don't
- Do: reserve exact space (aspect-ratio boxes) for all lazy-loaded media to prevent layout shift.
- Don't: animate box-shadow directly on scroll for many elements simultaneously — pre-render shadow states and cross-fade opacity instead.

## AI Implementation Notes for Fable
Treat every performance number here as a hard constraint to validate against (Lighthouse/PageSpeed), not an aspiration. If a design choice in other docs conflicts with this budget, performance wins and the conflict should be flagged.
