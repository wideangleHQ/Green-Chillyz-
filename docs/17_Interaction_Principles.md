# 17 — Interaction Principles

The most important behavioral file. Every interactive decision on the homepage should trace back to a rule here.

## Hover Philosophy
Hover confirms "this is interactive" and previews the result of clicking — never surprises the user with unrelated motion. Scale 1.01–1.02, shadow lift/tint toward primary green, 150–250ms.

## Motion Philosophy
Motion explains cause and effect (per `03_Animation_Guidelines.md`). If a user can't explain in one sentence what an animation communicated, it shouldn't exist.

## Scrolling Philosophy
Scroll is the primary narrative driver (per `01_Homepage_Experience.md`). Smooth (Lenis-powered) but never hijacked — the user is always in control of scroll speed/direction.

## Click Behaviour
Every click gives immediate feedback (visual state change within one frame) even before any navigation/async action completes. No dead clicks.

## Page Transitions
Cross-fade/vertical-reveal only, consistent with `01_Homepage_Experience.md` — homepage-to-subpage transitions should feel continuous, not a hard reload sensation even where technically a route change occurs.

## Delight Moments
Reserved for genuinely earned beats: coin-earning confirmation (Games/Rewards), first successful outlet-found interaction (Locations). Delight is rationed, not sprinkled everywhere — overuse cheapens the premium feel.

## Feedback System
Every user action (hover, click, form submit, error) has a visible, immediate response. Loading states always shown for anything >300ms (see `06_Content_and_Copy.md` for loading copy).

## Interaction Hierarchy
Primary action (the one CTA per section) is always the most visually confident element in its viewport; secondary actions are visually quieter (ghost buttons, smaller scale).

## Animation Consistency
The same interaction type (e.g., card hover) behaves identically everywhere on the homepage — a user should never have to relearn how a card behaves between sections.

## User Psychology
Design leverages: progressive disclosure (one idea per scroll beat), social proof (Reviews before final CTA), reciprocity/gamification (Games → Rewards loop) — all grounded in the emotional journey defined in `00_Project_Vision.md`.

## Do / Don't
- Do: make every interactive element's affordance obvious without relying on a tooltip.
- Don't: let two sections compete for attention with simultaneous high-motion moments.

## AI Implementation Notes for Fable
When a specific interaction isn't explicitly documented elsewhere, default to the principles in this file rather than inventing a new pattern.
