# 11 — Accessibility

Baseline: **WCAG 2.1 AA**, non-negotiable across the homepage.

## Keyboard
Full homepage navigable via keyboard alone: logical tab order matching visual order, no keyboard traps (especially in Modal/Drawer per `04_Component_Library.md`), visible focus ring on every interactive element (never `outline: none` without a replacement).

## Screen Readers
Semantic HTML first (`nav`, `main`, `section`, `button`, `a`) — ARIA roles only where semantic HTML can't express the pattern (e.g., custom carousel/accordion). Section headings follow a logical h1→h2→h3 hierarchy, never skipped for visual sizing reasons.

## Reduced Motion
`prefers-reduced-motion: reduce` must disable: parallax, blob drift, scroll-pinning, spring overshoot. Replace with simple opacity fades (~200ms) per `03_Animation_Guidelines.md`. This is tested, not assumed.

## Contrast
Body text minimum 4.5:1 against its surface; large headline text minimum 3:1. Glass panels must be checked at their actual rendered opacity over their actual background image — not just against the flat token color.

## Focus
Focus order must survive scroll-triggered reveals (an element not yet visually revealed should not be focusable until its reveal state completes, or its reveal must be instant for keyboard users).

## Touch Targets
Minimum 44×44px for any tappable control (buttons, chips, carousel arrows) on all viewports.

## ARIA
Used precisely: `aria-label` for icon-only buttons, `aria-expanded` on accordion/dropdown triggers, `aria-live="polite"` for dynamically updating content (e.g., coin balance teaser).

## Images
All meaningful images require descriptive `alt` text (not filenames, not "image of…"). Purely decorative background/blob imagery: `alt=""` and `aria-hidden="true"`.

## Videos
Hero/background video: no essential information conveyed via video alone; muted by default; a pause/stop control available if autoplaying for more than a few seconds continuously.

## Forms
Every input has an associated, visible label (not placeholder-only); errors announced via `aria-live` and described in text, not color alone.

## Do / Don't
- Do: test every section with keyboard-only and with `prefers-reduced-motion` enabled before considering it complete.
- Don't: convey status (e.g., "offer expiring") through color alone — pair with icon/text.

## AI Implementation Notes for Fable
Accessibility requirements here override any conflicting visual instruction elsewhere in this documentation set — if `02_UI_Design_System.md` or `05_Visual_Direction.md` implies a contrast or motion violation, this file wins.
