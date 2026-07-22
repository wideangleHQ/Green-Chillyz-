# 04 — Component Library

Every component inherits tokens from `02_UI_Design_System.md` and motion rules from `03_Animation_Guidelines.md`. No component may define its own colors, radii, or easing.

| Component | Purpose | Key Rules |
|---|---|---|
| **Navbar** | Global nav | Floating pill, glass (24px blur), 1px border, collapses to hamburger <768px, hides on scroll-down/reveals on scroll-up |
| **Buttons (Primary/Secondary/Ghost)** | Actions | Pill shape; primary = gradient fill; secondary = ghost+border; one primary CTA per view max |
| **Hero** | First impression | Full-viewport, single headline + one CTA, background video/image with subtle Ken Burns drift |
| **Cards (generic)** | Content grouping | 24px+ radius, glass or solid per context, 32–40px padding |
| **Offer Cards** | Promote deals | Gold accent border only if "Signature" tier; badge for expiry |
| **Menu Cards** | Dish preview | Photo-forward, price in `label-caps`, no full description (link to full menu) |
| **Game Cards** | Loyalty games | Playful hover (scale+shadow-tint), coin icon consistent with Rewards module |
| **Location Cards** | Outlet info | Address, hours, distance, "Directions" ghost button, map-pin icon |
| **Review Cards** | Social proof | Star rating, outlet tag chip, truncated quote (2 lines) + "read more" |
| **Footer** | Close/nav | Dark inverse-surface, brand family logos, legal links, social icons |
| **Inputs** | Forms | Semi-transparent, 24px radius, gold focus ring |
| **Dropdowns** | Selection | Glass panel, 8px item padding, keyboard navigable |
| **Search** | Find content/outlet | Pill input, icon-left, live filter, debounce 250ms |
| **Modal** | Focused task | Glass overlay backdrop, center-anchored, ESC + overlay-click to close |
| **Drawer** | Mobile nav / filters | Slide from right, glass, traps focus while open |
| **Tooltip** | Micro-help | Dark inverse-surface bg, 150ms fade, 8px offset |
| **Badges** | Status flags (new/popular) | `label-caps` type, pill shape, primary or gold fill |
| **Tags/Chips** | Categorization (cuisine, outlet) | Ghost pill, removable variant has close icon |
| **Carousel** | Reviews/Gallery | Snap-scroll, dot indicators, swipe on touch, arrows on desktop |
| **Accordion** | FAQ / details | Smooth height animation (300ms), one open at a time (or configurable) |

## Do / Don't
- Do: reuse the same button/card component across sections; never fork a one-off variant.
- Don't: introduce shadcn/ui default styling unmodified — always apply Luxe Gastronomy tokens on top.

## AI Implementation Notes for Fable
Build each component once as a shared, prop-driven unit (see `10_Development_Rules.md` for folder/architecture placement). Section documents (`12_Homepage_Sections.md`) reference these components by name only — do not redefine component behavior inside section docs.
