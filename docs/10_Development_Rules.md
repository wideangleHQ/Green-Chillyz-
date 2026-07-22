# 10 — Development Rules

## Coding Philosophy
Composable, typed, boring-in-a-good-way. Motion and visual richness live in presentation components; logic stays in hooks/services. No cleverness for its own sake.

## Naming Conventions
- Components: PascalCase (`HeroSection.tsx`).
- Hooks: `useX` camelCase (`useScrollProgress.ts`).
- Files match exported component/hook name exactly.

## Component Architecture
- `/components/ui` — shared primitives (Button, Card, Input, Badge) per `04_Component_Library.md`.
- `/components/[section-name]` — section-specific composition (e.g. `/components/hero`).
- Sections are composed of `ui` primitives; sections never redefine primitive styling inline.

## Folder Structure (homepage-relevant)
```
/app
  /page.tsx
/components
  /ui
  /hero
  /brand-story
  /food-experience
  /games
  /rewards
  /locations
  /reviews
  /gallery
  /franchise
  /footer
/hooks
/lib
/styles
/public/assets  (mirrors 09_Asset_Pipeline structure)
```

## Hooks
Scroll/animation state (`useScrollProgress`, `useReducedMotion`) centralized in `/hooks`, consumed by any section needing scroll-linked behavior — never reimplemented per-component.

## State
Homepage is largely presentational/static; any dynamic state (e.g., live coin balance teaser, personalized offer) fetched via typed API client, loading/error states always handled explicitly (see `06_Content_and_Copy.md` for copy).

## Accessibility (implementation-level)
Every interactive element keyboard-reachable and focus-visible; semantic HTML first, ARIA only to fill genuine gaps — full policy in `11_Accessibility.md`.

## Motion Implementation
Framer Motion `variants` defined per component, not inline ad hoc — keeps timing/easing consistent with `03_Animation_Guidelines.md`. GSAP timelines centralized per section, cleaned up on unmount.

## Responsive Rules
Mobile-first Tailwind breakpoints; never build desktop-first and retrofit mobile.

## Error Handling
Every data-fetching section has an explicit error boundary/fallback UI (never a blank section or console-only failure).

## Reusable Components
If a UI pattern appears twice, it becomes a shared component in `/components/ui` before a third use.

## Do / Don't
- Do: colocate a component's Framer Motion variants with the component.
- Don't: use inline styles for anything expressible via Tailwind tokens.

## AI Implementation Notes for Fable
Generate homepage as composed section components per this structure; reference `04_Component_Library.md` for what each primitive must support (props/variants) before implementing.
