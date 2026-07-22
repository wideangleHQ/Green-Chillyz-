# 09 — Asset Pipeline

## Asset Creation Workflow
1. **Concept** — direction pulled from `05_Visual_Direction.md`.
2. **Generation/Sourcing** — AI-assisted generation (Whisk for stills, Veo for motion/video) or licensed/original photography; Canva for lightweight graphic composites (badges, social-sized exports).
3. **Review** — checked against Visual Direction + brand accuracy (no invented brand marks).
4. **Optimization** — run through Cloudinary pipeline (auto-format, auto-quality, responsive breakpoints).
5. **Delivery** — placed in the naming/folder structure below.

## Whisk Workflow
Used for still concept imagery (food styling, ambient backgrounds) where original photography isn't yet available. Output must be validated against lighting/composition rules in `05_Visual_Direction.md` and never presented as real outlet photography.

## Veo Workflow
Used for short ambient motion loops (hero background, gallery motion accents). Constraints: <15s, no audio required, matches Visual Direction mood (warm, cinematic, no jarring cuts).

## Canva Workflow
Used only for flat graphic assets — social share cards, OG images, simple badges. Not used for core homepage photography or hero assets.

## Icons
Sourced exclusively from Lucide/React Icons (per `07_Tech_Stack.md`) — never mixed with a third icon set, never custom-drawn unless a brand-specific icon (e.g., coin icon) is required, in which case it follows the organic/rounded shape language.

## Naming Conventions
`[section]-[asset-type]-[descriptor]-[variant].[ext]`
Example: `hero-video-brand-loop-01.mp4`, `menu-photo-signature-dish-03.webp`.

## Folder Structure
```
/assets
  /hero
  /brand-story
  /food
  /games
  /rewards
  /locations
  /reviews
  /gallery
  /franchise
  /icons
  /og
```

## Compression & Formats
Images: AVIF primary, WebP fallback, JPEG last-resort. Video: H.264/MP4 for compatibility, WebM/AV1 optional secondary. All compressed before entering the repo/CDN — never commit raw uncompressed exports.

## AI Implementation Notes for Fable
When an asset is not yet available, use a clearly-marked placeholder (labelled, not a fake final image) rather than fabricating a "final-looking" stand-in — see `16_Project_TODO.md` for asset-pending tracking.
