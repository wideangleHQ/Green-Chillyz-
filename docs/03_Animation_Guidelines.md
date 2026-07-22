# 03 — Animation Guidelines

Governs Framer Motion + GSAP + Lenis usage. Pairs with `13_Animation_Timeline.md` (sequence) and `17_Interaction_Principles.md` (behavioral philosophy).

## Animation Philosophy
Every animation must communicate a state change, relationship, or causality. If an animation can be removed with no loss of meaning, remove it.

## Timing & Duration
- Micro-interactions (hover, tap): 150–250ms.
- Section reveals: 400–700ms.
- Page/section transitions: 600–900ms.
- Never exceed 1000ms for any single homepage animation.

## Easing & Springs
- Standard ease: `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) for reveals.
- Springs (Framer Motion): `stiffness: 260, damping: 26` for card/button feedback — soft, not bouncy.
- Avoid linear easing entirely except for continuous background drift (blob gradients).

## Scroll Behaviour (Lenis)
Smooth-scroll enabled globally, damping ~1.1, no scroll-jacking (user must always be able to scroll past a section without being trapped).

## Parallax
8–16px offset max relative to scroll position, per `DESIGN.md`. Background blobs may drift further (up to 40px) since they're non-focal.

## Hover
Buttons: shadow expands + slight (2–4px) lift. Cards: subtle scale (1.01–1.02) + shadow tint toward primary green. No hover rotation, no color inversion.

## Page/Section Transitions
Cross-fade + vertical reveal only, per `01_Homepage_Experience.md`. GSAP ScrollTrigger pins used sparingly — only where a section genuinely needs a held moment (e.g., Games interactive teaser).

## Loading States
Preloader: brand mark stroke-draws in, then fades (under 1.5s total). Section-level lazy content: skeleton shimmer in surface-container tones, never a spinner.

## Reduced Motion
`prefers-reduced-motion: reduce` disables parallax, blob drift, and scroll-pinning; reveals become simple opacity fades (200ms), no transforms. This is non-negotiable — see `11_Accessibility.md`.

## Interaction Rules / Physics
- One element animates at a time within a small interaction (no simultaneous competing motion in the same click/hover target).
- Motion direction should always match scroll direction (content entering from the direction the user is scrolling toward).

## Do / Don't
- Do: tie every animation trigger to scroll position or explicit user action.
- Don't: auto-play decorative looping animations with no semantic purpose.
- Don't: use spring overshoot/bounce on entrance of body text.

## AI Implementation Notes for Fable
Use Framer Motion for component-level transitions/hover states; GSAP+ScrollTrigger only for scroll-pinned or complex timeline sequences (see `13_Animation_Timeline.md`). Never mix both libraries animating the same property on the same element.
