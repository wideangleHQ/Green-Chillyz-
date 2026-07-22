# 19 — Design Tokens

Single centralized reference for every visual value used across the site. All literal values originate in `DESIGN.md` frontmatter; this file organizes them into a usable token taxonomy and documents naming/governance. Per `02_UI_Design_System.md`'s governance rule: **if a value is missing here, it does not exist — do not invent one.**

---

## Color Tokens
Sourced from `DESIGN.md` frontmatter. Never hardcode a hex value in a component — always reference the token.

| Group | Token | Value |
|---|---|---|
| Primary | `primary` | `#006B2A` |
| Primary | `primary-container` | `#008737` |
| Primary | `on-primary` | `#FFFFFF` |
| Secondary | `secondary` | `#1F6C3A` |
| Secondary | `secondary-container` | `#A4F1B2` |
| Accent | `tertiary` (gold) | `#735C00` |
| Accent | `tertiary-container` | `#CCA72F` |
| Background | `background` / `surface` | `#FFF8F1` |
| Surface | `surface-container` | `#F4EDE5` |
| Surface | `surface-container-highest` | `#E8E1DA` |
| Glass | white fill @ 60–80% opacity | see Opacity Tokens |
| Borders | `outline` | `#6E7B6C` |
| Borders | `outline-variant` | `#BDCAB9` |
| States | `error` | `#BA1A1A` |
| States | `error-container` | `#FFDAD6` |
| Text | `on-surface` | `#1E1B17` |
| Text | `on-surface-variant` | `#3E4A3D` |
| Icons | inherit `on-surface` / `on-primary` per context | — |
| Gradients | Primary → Dark Green (buttons), low-opacity Lime radial (ambient bg) | see `DESIGN.md` Colors section |

Gold (`tertiary` family) is reserved exclusively for Signature/premium moments — never a standard CTA or default accent (per `02_UI_Design_System.md`).

## Typography Tokens
| Token | Family | Size | Weight | Line Height | Tracking |
|---|---|---|---|---|---|
| Display (`display-hero`) | Poppins | 84px (48px mobile) | 800 | 1.1 | -0.04em |
| Heading (`headline-lg`) | Poppins | 48px | 700 | 1.2 | -0.02em |
| Subheading (`headline-md`) | Poppins | 32px | 600 | 1.3 | normal |
| Body (`body-lg`) | Poppins | 20px | 400 | 1.6 | normal |
| Body (`body-md`) | Poppins | 16px | 400 | 1.5 | normal |
| Caption (`label-caps`) | Poppins | 12px | 600 | 1.0 | +0.1em, uppercase |
| Navigation (`nav-link`) | Poppins | 16px | 500 | 1.0 | +0.02em |
| Buttons | Poppins | 16px | 500 | 1.0 | +0.02em (shares `nav-link` scale) |

Hero tracking is negative; label tracking is positive — these are never mixed on the same element (per `02_UI_Design_System.md`).

## Spacing Tokens
Base-8 scale (`DESIGN.md` → `spacing.base: 8px`):

| Token | Value |
|---|---|
| space-4 | 4px |
| space-8 | 8px |
| space-12 | 12px |
| space-16 | 16px |
| space-20 | 20px (mobile margin) |
| space-24 | 24px (gutter) |
| space-32 | 32px (card padding min) |
| space-40 | 40px (card padding max) |
| space-48 | 48px |
| space-64 | 64px (mobile section padding min) |
| space-80 | 80px (desktop side margin) |
| space-120 | 120px (desktop section padding min) |
| space-160 | 160px (large hero/editorial breathing room) |

## Radius Tokens
Per `DESIGN.md` → `rounded`:

| Token | Value | Usage |
|---|---|---|
| radius-sm | 0.5rem (8px) | rarely used — smallest permitted radius |
| radius-default | 1rem (16px) | base component radius |
| radius-md | 1.5rem (24px) | cards/containers minimum (per `02_UI_Design_System.md`) |
| radius-lg | 2rem (32px) | large cards/panels |
| radius-xl | 3rem (48px) | hero/feature panels |
| radius-full | 9999px | pills — buttons, chips, nav bar |

Sharp (0px) corners are never used anywhere in this system.

## Elevation Tokens
| Level | Usage |
|---|---|
| Level 0 | flat page background, no shadow |
| Level 1 | resting card state |
| Level 2 | hovered/active card |
| Level 3 | floating elements (Navbar) |
| Hero | full-viewport hero layer, sits above ambient background blobs |
| Overlay | glass panel over photography |
| Modal | topmost interactive layer, per Z-Index Tokens |

## Shadow Tokens
Multi-layer ambient shadows only — never a single flat drop-shadow (per `02_UI_Design_System.md`).

| Token | Value |
|---|---|
| shadow-soft | `0 4px 6px -1px rgba(0,0,0,.05), 0 10px 15px -3px rgba(0,0,0,.1)` |
| shadow-medium | soft + increased spread for elevated cards |
| shadow-heavy | reserved for Modal/Drawer overlays |
| shadow-floating | Navbar resting shadow |
| shadow-glass | paired with `backdrop-filter`, tinted white |
| shadow-hover | soft-shadow, tinted toward `primary` (#006B2A) on interactive hover |

## Motion Tokens
Per `03_Animation_Guidelines.md`:

| Token | Value |
|---|---|
| duration-micro | 150–250ms (hover, tap) |
| duration-reveal | 400–700ms (section reveals) |
| duration-transition | 600–900ms (page/section transitions) |
| duration-max | 1000ms hard ceiling |
| delay-stagger-card | 80ms per item |
| delay-stagger-list | 60ms per item |
| spring | stiffness 260, damping 26 |
| easing-standard | `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) |
| easing-continuous | linear (background drift only) |

## Opacity Tokens
| Token | Value |
|---|---|
| opacity-disabled | 38% |
| opacity-glass-fill | 60–80% white |
| opacity-overlay | modal/drawer backdrop, ~40–50% inverse-surface |
| opacity-hover | shadow/tint shift, no element-opacity change on hover |
| opacity-backdrop | matches opacity-overlay for Modal |
| opacity-border-glass | 20% white |
| opacity-blob | 10–20% (ambient background shapes) |

## Blur Tokens
| Token | Value |
|---|---|
| blur-sm | 16px (mobile glass ceiling, per `18_Responsive_Design_System.md`) |
| blur-md | 24px |
| blur-lg | 32px (desktop glass ceiling) |
| blur-background | 100px+ (blob shapes) |
| blur-glass | 16–32px range, standard glass panel |

## Border Tokens
| Token | Value |
|---|---|
| border-thickness | 1px, always |
| border-opacity-default | 20% white (on glass) |
| border-opacity-hover | unchanged thickness, shadow tint communicates hover instead |
| border-focus | transitions to gold `#D4AF37` on input focus |

## Icon Tokens
| Token | Value |
|---|---|
| icon-size-sm | 16px |
| icon-size-md | 20–24px (default) |
| icon-size-lg | 32px+ (feature/empty-state icons) |
| icon-stroke | 1.5–2px |
| icon-style | outlined only — no filled icon sets, per `02_UI_Design_System.md` |
| icon-source | Lucide / React Icons exclusively, per `07_Tech_Stack.md` |

## Animation Tokens
| Token | Pattern |
|---|---|
| fade | opacity 0→1, paired with `duration-reveal` |
| scale | 0.98→1 (entrance), 1→1.01–1.02 (hover) |
| slide | reserved for micro-interactions only, not section transitions (per `01_Homepage_Experience.md`) |
| rotate | not used homepage-wide (no hover rotation, per `03_Animation_Guidelines.md`) |
| reveal | staggered line/card reveal, `delay-stagger-*` |
| parallax | 8–16px content, up to 40px background blobs |

## Z-Index Tokens
| Layer | Token | Approx. Value |
|---|---|---|
| Background | z-background | 0 |
| Content | z-content | 1–10 |
| Floating Cards | z-floating | 20 |
| Navigation | z-nav | 50 |
| Drawer | z-drawer | 60 |
| Modal | z-modal | 70 |
| Toast | z-toast | 80 |
| Tooltip | z-tooltip | 90 |

## Responsive Tokens
Cross-reference `18_Responsive_Design_System.md` for full behavior; token *values* summarized here:

| Tier | Container Margin | Section Padding | Hero Type Size |
|---|---|---|---|
| Mobile | 20px | 64px+ | 48px (`display-hero-mobile`) |
| Tablet | 24px gutter | ~90px (interpolated) | ~64px (interpolated) |
| Desktop | 80px | 120px+ | 84px (`display-hero`) |
| Ultra Wide | 80px, container capped 1440px | 120px+ | 84px |

## Accessibility Tokens
| Token | Value |
|---|---|
| contrast-body-min | 4.5:1 |
| contrast-headline-min | 3:1 |
| touch-target-min | 44×44px |
| focus-ring | visible, never `outline: none` without replacement (per `11_Accessibility.md`) |

## Naming Convention
`[category]-[variant]-[scale]` — e.g., `color-primary-container`, `space-32`, `radius-md`, `shadow-hover`. Tokens are always referenced by name in component code, never by raw value. Any new token is added to `DESIGN.md` frontmatter first, then documented here — this file never introduces a value that doesn't already exist upstream.

## Developer Notes
Implemented as a Tailwind theme extension generated from `DESIGN.md` frontmatter (per `16_Project_TODO.md` milestone 2). No component defines its own color, radius, shadow, or easing inline — all values route through this token layer (per `04_Component_Library.md`, `02_UI_Design_System.md`).

## Examples
```
/* Correct */
className="rounded-md bg-primary text-on-primary shadow-hover"

/* Incorrect — raw value, bypasses token layer */
className="rounded-[24px] bg-[#006B2A]"
```

## AI Implementation Notes for Fable
Generate the Tailwind config directly from `DESIGN.md` frontmatter values as listed in this file. If a component appears to need a value not present here, stop and flag it as a proposed new token rather than inventing an inline value.
