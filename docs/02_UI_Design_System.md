# 02 — UI Design System

Extends `DESIGN.md`. This file is the single source of truth for all visual tokens; do not redefine tokens elsewhere.

## Color System
Use exact hex values from `DESIGN.md` frontmatter (`surface`, `primary` #006B2A, `secondary` #1F6C3A, `tertiary`/gold #735C00 family, `error` #BA1A1A). Primary Green = action/brand. Gold = Signature/premium moments only, never for standard CTAs. Neutral base #FFF8F0 throughout — never pure white backgrounds.

## Typography
Poppins exclusively. Scale: `display-hero` 84px/800 (48px mobile), `headline-lg` 48px/700, `headline-md` 32px/600, `body-lg` 20px/400, `body-md` 16px/400, `nav-link` 16px/500 (tracked +0.02em), `label-caps` 12px/600 (tracked +0.1em, uppercase). Hero tracking is negative (-0.04em); label tracking is positive — never mix these.

## Grid & Spacing
Base-8 spacing scale. Desktop: 12-col grid, 80px side margins, 1440px container max. Mobile: 4-col grid, 20px margins. Section vertical padding: 120px+ desktop, 64px+ mobile. Gutter: 24px.

## Elevation & Shadows
Multi-layer ambient shadows only, e.g. `0 4px 6px -1px rgba(0,0,0,.05), 0 10px 15px -3px rgba(0,0,0,.1)`. Interactive hover shadows tint toward primary green. Never use a single flat drop-shadow.

## Radius
Cards/containers ≥24px. Buttons/chips: full pill (`rounded-full`). Inputs: 24px. Never use sharp (0px) corners anywhere in this system.

## Surfaces / Glassmorphism
Glass panels: 16–32px backdrop blur, 60–80% white opacity fill, 1px solid white border at 20% opacity. Glass always sits over imagery/gradient, never over another flat glass panel (max one glass layer deep visually).

## Buttons
Primary: pill, gradient fill primary→dark green, soft diffuse shadow that expands on hover. Secondary: ghost pill, 1px white border, blur backdrop, no fill.

## Cards
Frosted-glass metric/info cards, 32–40px padding, high-contrast charcoal (#111827) text. Minimum 24px radius.

## Forms/Inputs
Semi-transparent, 24px radius. Focus state: border transitions white → gold (#D4AF37). Gold appears here as a "you're in a premium interaction" cue, consistent with `DESIGN.md`'s Signature-moment rule.

## Icons
Lucide + React Icons only (per `07_Tech_Stack.md`). Icon stroke weight 1.5–2px, matched to Poppins' geometric character. No filled icon sets, no mixed icon families in the same view.

## Illustration / Photography / 3D
Photography-led, not illustration-led (see `05_Visual_Direction.md`). Any 3D/organic blob background elements: heavy Gaussian blur (100px+), positioned behind glass, never as a foreground focal element.

## Responsive Behaviour
Breakpoints: mobile <768px (4-col), tablet 768–1199px (8-col), desktop ≥1200px (12-col). Typography and spacing scale down proportionally per the mobile tokens above — never a linear/uniform shrink.

## Design Tokens Governance
All tokens are defined once in `DESIGN.md` frontmatter. This file documents *usage rules*, not new values. Any new token must be added to `DESIGN.md` first.

## Do / Don't
- Do: reuse the 8px scale for every margin/padding decision.
- Do: reserve gold strictly for Signature/premium contexts.
- Don't: introduce Bootstrap/Material UI spacing or shadow conventions.
- Don't: use pure white (#FFFFFF) as a large background surface.

## AI Implementation Notes for Fable
Pull literal token values from `DESIGN.md`. This file is the interpretation layer — if a value is missing here, it does not exist; do not invent one.
