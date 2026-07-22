# 01 — Homepage Experience (Storytelling Map)

This is the macro scroll narrative. Section-level implementation detail lives in `12_Homepage_Sections.md`; this file defines sequence, emotion, and transition logic only.

## Sequence & Emotional Beats
1. **Preloader** — brand mark assembles; sets premium tone before content is visible.
2. **Hero** — Curiosity. Full-viewport cinematic food/brand visual + hero headline (Poppins `display-hero`). Entry: fade+scale in. Exit: content parallax-recedes as next section rises over it.
3. **Brand Story** — Trust. Editorial split-layout, GreenChillyz/YellowChillyz/GoldenChillyz introduced as one family. Entry: text slides up staggered per line. Exit: cross-fade to food imagery.
4. **Food Experience** — Desire. Large-format photography, minimal glass cards for signature dishes. Parallax image drift on scroll.
5. **Menu Preview** — Clarity. Curated dish cards (not full menu) with pill CTA "View Full Menu."
6. **Games** — Delight. Interactive card teasing the coin-earning game; playful micro-motion (hover bounce).
7. **Rewards/Offers** — Confidence in value. Coin balance visual metaphor, personalized-offer teaser.
8. **Locations** — Practical trust. Map + list, "12 outlets" framed as growth proof.
9. **Reviews** — Social proof. Carousel of review cards tagged by outlet.
10. **Gallery** — Sensory close. Editorial photo grid, glass-hover captions.
11. **Franchise** — Aspiration. Short, confident CTA block for prospective franchisees.
12. **Footer** — Resolution. Navigation, brand family, legal, social.

## Transition Rules
- Only cross-fade, vertical-parallax, or reveal-on-scroll transitions are permitted between sections — no jarring cuts, no slide-from-side transitions (reserved for micro-interactions only).
- Each section's exit state must visually motivate the next section's entry (e.g., color bleed, shared visual anchor).

## Visual Hierarchy Rule
One primary focal element per section max. Supporting content is always secondary in scale, opacity, or blur (glass treatment).

## CTA Rule
Every section past the Hero carries at most one CTA. No competing CTAs in the same viewport.

## AI Implementation Notes for Fable
- Build sections in the order above; do not reorder without updating this file and `13_Animation_Timeline.md` together.
- Each section maps 1:1 to an entry in `12_Homepage_Sections.md` — implement from that file's detail, this file only for sequencing/emotion.
