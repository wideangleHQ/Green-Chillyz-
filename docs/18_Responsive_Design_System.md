# 18 — Responsive Design System

Governs how every component, animation, layout, spacing and interaction defined elsewhere in this doc set adapts across viewport sizes. Extends the 3-tier breakpoint system in `02_UI_Design_System.md` (mobile/tablet/desktop) with 7 granular sub-breakpoints for fine-tuning within those tiers. `02_UI_Design_System.md` remains the source of truth for token *values*; this file governs *behavior* at each size.

---

## Responsive Philosophy
- **Mobile First**: base styles target the smallest viewport; complexity is added upward via `min-width` queries, never removed downward.
- **Progressive Enhancement**: heavier motion, blur, and layout richness are added as viewport/device capability increases — the mobile experience must stand alone as complete, not "the desktop site with things removed."
- **Content First**: layout decisions follow content priority (per `01_Homepage_Experience.md` emotional sequence), not available screen space alone.
- **Touch First**: primary interaction model is touch even on laptop trackpads; hover is treated as a bonus enhancement, never a requirement to access content or actions.
- **Performance First**: every responsive decision is checked against `08_Performance_Guidelines.md` — a breakpoint change that improves visual richness but breaks the Core Web Vitals budget is rejected.

## Breakpoints
| Tier | Range | Maps to `02_UI_Design_System.md` |
|---|---|---|
| Mobile | 320–639px | Mobile (<768px, 4-col) |
| Large Mobile | 640–767px | Mobile (<768px, 4-col) |
| Tablet | 768–1023px | Tablet (768–1199px, 8-col) |
| Laptop | 1024–1279px | Tablet (768–1199px, 8-col) |
| Desktop | 1280–1535px | Desktop (≥1200px, 12-col) |
| Large Desktop | 1536–1919px | Desktop (≥1200px, 12-col) |
| Ultra Wide | 1920px+ | Desktop (≥1200px, 12-col), container capped |

Sub-breakpoints exist to tune spacing/type-scale/motion intensity without ever changing the underlying grid column count defined in `02_UI_Design_System.md` — grid shifts only happen at the three core tier boundaries (768px, 1200px).

## Container Widths
- **Maximum Width**: 1440px (`spacing.container-max` per `DESIGN.md`), centered, with content never touching viewport edge above Ultra Wide.
- **Responsive Padding**: 20px mobile, 24px tablet gutter, 80px desktop side margins (per `DESIGN.md` spacing tokens).
- **Safe Areas**: `env(safe-area-inset-*)` respected on notch/home-indicator devices — Navbar and Footer padding account for this, never covered by system UI.
- **Grid System**: 4-col mobile, 8-col tablet, 12-col desktop (per `02_UI_Design_System.md`) — never a 5th, 6th, or interpolated column count.
- **Column Behaviour**: components span fixed column counts per tier (e.g., Menu Cards: 2-col mobile, 3-col tablet, 4-col desktop) — never fluid arbitrary widths that ignore the grid.

## Typography Scaling
| Token | Mobile | Tablet | Desktop |
|---|---|---|---|
| Hero | `display-hero-mobile` 48px/800 | 64px/800 (interpolated) | `display-hero` 84px/800 |
| Headings (`headline-lg`) | 32px/700 | 40px/700 | 48px/700 |
| Body (`body-lg`/`body-md`) | 16px/400 | 18px/400 | 20px / 16px per context |
| Buttons | 14px/500 | 16px/500 | 16px/500 |
| Labels (`label-caps`) | 11px/600 tracked | 12px/600 tracked | 12px/600 tracked |
| Navigation (`nav-link`) | hidden (drawer) | 15px/500 | 16px/500 |

Scaling is never linear/uniform shrink — each tier has its own defined size per `02_UI_Design_System.md`'s "never a linear/uniform shrink" rule. Tablet values interpolate proportionally between mobile and desktop where not explicitly tokenized.

## Responsive Navigation
- **Desktop Navbar**: floating glass pill, full `nav-link` set visible, Coins Button + Profile inline right.
- **Tablet Navbar**: floating glass pill, primary links visible, secondary links collapse into a "More" dropdown.
- **Mobile Navigation**: fixed-top glass bar, logo + hamburger + Coins Button only.
- **Hamburger Behaviour**: opens a full-height Drawer (per `04_Component_Library.md`) with focus trap, ESC/overlay-close, and reduced-motion-respecting slide.
- **Search**: icon-only on mobile (expands to full-width overlay input on tap); inline pill input from tablet up.
- **Profile**: avatar-only icon on mobile/tablet; avatar + name on desktop.
- **Coins Button**: always visible at every tier — the coin balance is a core retention hook and is never hidden behind a menu.

## Hero Behaviour
- **Desktop Layout**: full-viewport, centered headline + one CTA over background video.
- **Tablet Layout**: same composition, headline drops to interpolated size, video retained if bandwidth allows.
- **Mobile Layout**: video swapped for static poster (per `08_Performance_Guidelines.md`), headline set in `display-hero-mobile`.
- **CTA Position**: always directly below headline, never floating separately — consistent tap target across tiers.
- **Video Behaviour**: autoplay-on-load desktop/tablet; poster-first, tap-to-play or auto-swap-to-poster on mobile per bandwidth detection.
- **Image Cropping**: art-directed crop (not naive scale) per tier — subject stays centered/visible, per `05_Visual_Direction.md` composition rules.
- **Negative Space**: preserved at every tier so headline/CTA never overlaps the photographic focal point.

## Section Behaviour
Applies uniformly to every homepage section in `12_Homepage_Sections.md`:
- **Desktop**: full multi-column layouts (e.g., alternating Brand Story split, horizontal Menu Preview row).
- **Tablet**: reduced column count, same visual hierarchy, glass captions retained.
- **Mobile**: single-column stack, all content visible (nothing desktop-only is dropped — see Visibility below).
- **Element Order**: DOM order matches visual/reading order at every tier — no CSS-only reordering that breaks screen-reader/tab order (per `11_Accessibility.md`).
- **Spacing**: section vertical padding 120px+ desktop, 64px+ mobile (per `02_UI_Design_System.md`).
- **Alignment**: center-aligned single-focal compositions on mobile; editorial left/right split retained from tablet up.
- **Visibility**: no section or CTA is hidden at any breakpoint — only *layout density* changes, never content availability. If something must be hidden (e.g., decorative blob), it is `aria-hidden` regardless of tier, not tier-conditional.

## Responsive Motion
- **Disable heavy effects on mobile**: scroll-pinned GSAP timelines (e.g., Games teaser pin) disabled below Tablet — replaced with a standard scroll-triggered reveal.
- **Reduce blur**: glassmorphism blur capped at 16px on mobile (vs. 16–32px desktop) to protect GPU budget per `08_Performance_Guidelines.md`.
- **Reduce particle/blob count**: background blob shapes limited to 1 concurrent blob on mobile (vs. multiple on desktop).
- **Reduce parallax**: parallax offset capped at 8px on mobile (vs. up to 16px desktop, 40px for background blobs).
- **Reduce shadows**: single-layer shadow on mobile list/card items instead of multi-layer ambient shadow stack.
- **Reduce video quality**: 720p hero video capped further to a compressed poster-swap on low-bandwidth mobile connections (Network Information API where available).
- **Maintain premium feel**: reductions are invisible to the user as "cuts" — timing/easing per `03_Animation_Guidelines.md` is preserved even when effect intensity is reduced.

## Touch Interaction
- **Touch Targets**: minimum 44×44px at every tier, no exceptions (per `11_Accessibility.md`).
- **Swipe**: Reviews and Gallery carousels support native swipe gesture on touch devices, matching desktop arrow-click behavior 1:1.
- **Drag**: not used for any core navigation — reserved only for optional/future features (e.g., a future draggable gallery), never gating core content access.
- **Long Press**: not used homepage-wide (reserved for potential future franchise-portal features, out of current scope per `16_Project_TODO.md`).
- **Gesture Behaviour**: gestures always have a visible, non-gesture-dependent equivalent (arrow buttons, dots) — gesture is an enhancement, never the only path.

## Image Behaviour
- **Responsive Images**: `srcset`/`sizes` served per breakpoint via Cloudinary (per `07_Tech_Stack.md`, `09_Asset_Pipeline.md`).
- **Art Direction**: distinct crops per tier where composition requires it (e.g., wide hero crop desktop vs. tighter vertical crop mobile), not simple downscaling.
- **Cropping**: subject-anchored (never center-crop blind) — validated against `05_Visual_Direction.md` composition rules.
- **Loading**: hero imagery eager; all else lazy (per `08_Performance_Guidelines.md`), consistent across tiers.
- **Lazy Loading**: 150px rootMargin at every tier; mobile additionally defers non-critical below-fold imagery until first scroll interaction to protect initial load on constrained connections.

## Video Behaviour
- **Desktop Hero**: full video background, Ken Burns drift, autoplay muted.
- **Tablet Hero**: video retained, drift continues, slightly reduced bitrate.
- **Mobile Hero**: static poster by default; video only loads if connection/data conditions allow (see `08_Performance_Guidelines.md`).
- **Compression**: <3MB, <15s loop, 720p source at every tier — device-level scaling handled via CSS, never a heavier source file shipped to mobile.
- **Autoplay Rules**: muted, no audio track, pause control if playing continuously beyond a few seconds (per `11_Accessibility.md`).
- **Fallback Images**: every video has a matching static poster asset, named per `09_Asset_Pipeline.md` convention, used identically as the mobile default and the pre-load frame on all tiers.

## Accessibility
- **Touch Targets**: 44×44px minimum, all tiers (duplicated here for responsive-context emphasis; canonical rule lives in `11_Accessibility.md`).
- **Readable Typography**: body text never drops below 16px on mobile regardless of density pressure.
- **Safe Areas**: interactive elements never placed under notch/home-indicator safe-area insets.
- **Landscape Behaviour**: mobile landscape retains single-focal hierarchy; Navbar compresses height (not hidden) to preserve vertical content space.
- **Dynamic Font Sizes**: respects OS-level text-scaling (iOS Dynamic Type / Android font scale) up to 200% without breaking layout or truncating content.

## Performance Rules
- **Maximum Assets**: no more than 1 hero video + Cloudinary-optimized images loaded above-the-fold at any tier.
- **Maximum Animation**: 2–3 simultaneous animated properties on screen (per `08_Performance_Guidelines.md`), regardless of tier.
- **Maximum GPU Usage**: concurrent `backdrop-filter: blur()` elements limited further on mobile (nav only) vs. desktop (nav + one active glass region).
- **Maximum Blur**: 16px mobile / 32px desktop ceiling.
- **Maximum Shadows**: single-layer mobile, multi-layer ambient desktop.

## Developer Notes
- Breakpoint values are implemented as Tailwind custom screens extending (not replacing) the 3-tier system in `02_UI_Design_System.md`.
- Responsive logic lives alongside each component per `10_Development_Rules.md` folder structure — no separate global "responsive" override stylesheet.

## Future Expansion
Foldable/dual-screen device support and native-app-shell (mobile app teaser, per `16_Project_TODO.md`) responsive rules are explicitly out of current scope and will be added as a dedicated section if/when that phase begins.

## Do / Don't
- Do: test every section at all 7 sub-breakpoints, not just the 3 core tiers, before sign-off.
- Do: treat mobile as the complete experience, not a stripped-down desktop fallback.
- Don't: hide content or CTAs at any breakpoint to "simplify" — reduce density, not availability.
- Don't: introduce a grid column count outside 4/8/12 as defined in `02_UI_Design_System.md`.

## AI Implementation Notes for Fable
Implement responsive behavior mobile-first per `10_Development_Rules.md`. When a rule here conflicts with a fixed pixel value elsewhere in the doc set, this file governs *adaptation logic*; `02_UI_Design_System.md` and `DESIGN.md` remain the source of truth for the underlying token *values* being adapted. Accessibility requirements in `11_Accessibility.md` override any responsive convenience shortcut.
