# 12 — Homepage Sections (Detailed Spec)

Master section-by-section spec. Sequencing/emotion lives in `01_Homepage_Experience.md`; this file is implementation detail per section. Components referenced by name from `04_Component_Library.md`.

---
### 1. Hero
- **Purpose**: Immediate premium impression, brand identity established in <1s.
- **Layout**: Full-viewport, centered headline + one CTA, background video/image.
- **Components**: Hero, Buttons (primary).
- **Animation**: Preloader → fade+scale content in (600ms); background subtle Ken Burns drift; exits via parallax recede.
- **Copy**: Per `06_Content_and_Copy.md` hero example.
- **Responsive**: Video swapped for static poster on mobile if bandwidth-constrained; headline drops to `display-hero-mobile`.
- **Accessibility**: Video muted, decorative; headline is real `h1`.
- **Performance**: Eager-loaded, no lazy-load (see `08_Performance_Guidelines.md`).
- **Dev Notes**: Background media controlled via a single `HeroMedia` component supporting video/image variants.
- **Interaction**: CTA scroll-links to Brand Story.
- **Future Upgrades**: A/B testable headline variants.

### 2. Brand Story
- **Purpose**: Establish the 3-brand family as one Group.
- **Layout**: Editorial split (text left/right alternating with visual).
- **Components**: Cards (generic, for each sub-brand).
- **Animation**: Staggered line-reveal text, cross-fade transition in/out.
- **Copy**: "One Family. Three Flavors." + one line per brand.
- **Responsive**: Stacks vertically <768px.
- **Accessibility**: Each brand block is its own `section` with `h2`.
- **Performance**: Images lazy-loaded with reserved aspect-ratio boxes.
- **Interaction**: None beyond scroll; no CTA (this section builds trust, not action).
- **Future Upgrades**: Link each brand block to a dedicated brand sub-page.

### 3. Food Experience
- **Purpose**: Sensory desire — hero-quality food photography.
- **Layout**: Large-format alternating image blocks with minimal glass captions.
- **Components**: Cards (glass caption overlay).
- **Animation**: Parallax image drift (8–16px per `03_Animation_Guidelines.md`).
- **Accessibility**: Descriptive alt text per dish.
- **Performance**: Highest-weight images on the page — strict Cloudinary compression required.
- **Interaction**: Optional hover reveals dish name/price.
- **Future Upgrades**: Link through to full Menu Preview section.

### 4. Menu Preview
- **Purpose**: Curated taste, not the full menu (avoids "restaurant ordering site" feel).
- **Layout**: Horizontal card row (Menu Cards), 4–6 signature dishes max.
- **Animation**: Cards reveal on scroll with slight stagger (80ms delta).
- **Copy**: Dish name + price only; no long descriptions.
- **Interaction**: "View Full Menu" ghost CTA routes off-homepage.
- **Future Upgrades**: Filter by brand (Green/Yellow/Golden).

### 5. Games
- **Purpose**: Delight; introduce the coin-earning mechanic playfully.
- **Layout**: Single large interactive teaser card + short explanatory copy.
- **Components**: Game Cards.
- **Animation**: Hover bounce/scale micro-interaction; possible GSAP-pinned mini-demo.
- **Interaction**: "Play & Earn" CTA routes to logged-in games area (or triggers sign-in if logged out).
- **Accessibility**: Interactive teaser must be operable via keyboard, not only pointer/touch.
- **Future Upgrades**: Live leaderboard teaser.

### 6. Rewards / Offers
- **Purpose**: Make the value of loyalty tangible.
- **Layout**: Coin balance visual metaphor + 2–3 personalized/generic offer cards.
- **Components**: Offer Cards, Badges.
- **Copy**: Per `06_Content_and_Copy.md` microcopy (empty state included).
- **Interaction**: "Join Free" CTA for logged-out visitors.
- **Future Upgrades**: Birthday-reward teaser once user is identified.

### 7. Locations
- **Purpose**: Practical trust — the brand is real and nearby.
- **Layout**: Map (Mapbox) + scrollable outlet list.
- **Components**: Location Cards, Search.
- **Interaction**: Click list item highlights map pin; "Directions" ghost button.
- **Accessibility**: Map has a text-list equivalent (never map-only information).
- **Future Upgrades**: Filter by brand/city.

### 8. Reviews
- **Purpose**: Social proof, outlet-tagged.
- **Layout**: Carousel (Review Cards), star rating + outlet chip.
- **Animation**: Snap-scroll carousel, swipe on touch.
- **Accessibility**: Carousel keyboard-navigable (arrow keys), pause-on-hover/focus if autoplaying.
- **Future Upgrades**: Filter reviews by brand/outlet.

### 9. Gallery
- **Purpose**: Sensory close before the final CTA push.
- **Layout**: Editorial photo grid, glass-hover captions.
- **Animation**: Hover reveals glass caption overlay (200ms fade).
- **Future Upgrades**: User-submitted photo integration.

### 10. Franchise
- **Purpose**: Aspiration for prospective franchisees.
- **Layout**: Confident, short text block + single CTA, minimal imagery.
- **Copy**: "Grow With GreenChillyz."
- **Interaction**: CTA routes to franchise inquiry form.
- **Future Upgrades**: Franchise success-metrics teaser (outlet count, growth stat).

### 11. Footer
- **Purpose**: Resolution — navigation, brand family, legal.
- **Layout**: Dark inverse-surface, multi-column nav + brand logos + social icons.
- **Accessibility**: Sufficient contrast on dark surface (validated per `11_Accessibility.md`).

## AI Implementation Notes for Fable
Implement sections top-to-bottom in this exact order matching `01_Homepage_Experience.md`. Each section is a self-contained component folder per `10_Development_Rules.md`. Do not add a section not listed here without updating `01_Homepage_Experience.md` and `13_Animation_Timeline.md`.
