# 13 — Animation Timeline

Full homepage animation sequence, trigger points, and cross-section timing. Governed by rules in `03_Animation_Guidelines.md`; sequence matches `01_Homepage_Experience.md`.

## Global Timeline
```
Preloader        (0.0s–1.5s)    brand mark stroke-draw + fade out
Hero              (on load)     fade+scale in (0.6s), background Ken Burns drift (continuous)
  ↓ scroll trigger
Brand Story       (on enter)    staggered line-reveal (0.5s + 80ms/line), cross-fade transition
  ↓ scroll trigger
Food Experience   (on enter)    parallax image drift (continuous, 8–16px), glass captions fade in (0.3s)
  ↓ scroll trigger
Menu Preview      (on enter)    card stagger reveal (0.4s + 80ms/card)
  ↓ scroll trigger
Games             (on enter)    teaser card scale-in (0.5s spring), hover bounce (continuous, on interaction)
  ↓ scroll trigger
Offers/Rewards    (on enter)    coin metaphor reveal (0.5s), offer cards stagger (80ms/card)
  ↓ scroll trigger
Locations         (on enter)    map fade-in (0.4s), list stagger (60ms/item)
  ↓ scroll trigger
Reviews           (on enter)    carousel fade-in (0.4s), snap-scroll active
  ↓ scroll trigger
Gallery           (on enter)    grid stagger reveal (0.4s + 60ms/item)
  ↓ scroll trigger
Franchise         (on enter)    text reveal (0.5s), CTA fade-in
  ↓ scroll trigger
Footer            (on enter)    simple fade-in (0.3s), no stagger
```

## Trigger Points
All section-level reveals fire via IntersectionObserver at 20% element visibility (not full visibility) to feel responsive rather than delayed. GSAP ScrollTrigger used only for: Hero background drift, Food Experience parallax, Games teaser pin (if implemented).

## Sequencing Rules
- No two sections animate their *entrance* simultaneously — one section settles before the next begins its reveal.
- Continuous ambient animations (background drift, blob movement) run independently of scroll-triggered reveals and never block interaction.

## Reduced Motion Timeline
Entire timeline above collapses to: instant/near-instant (200ms) opacity fades per section, no parallax, no continuous drift, no stagger delays beyond 20ms — per `03_Animation_Guidelines.md` and `11_Accessibility.md`.

## AI Implementation Notes for Fable
Implement one GSAP ScrollTrigger/Framer Motion controller per section (not a single monolithic global timeline) so sections remain independently maintainable, matching the folder structure in `10_Development_Rules.md`.
