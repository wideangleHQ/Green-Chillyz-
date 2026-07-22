# 07 — Tech Stack

## Architecture Overview
Next.js (App Router) + React + TypeScript frontend, deployed on Vercel, fronted by Cloudflare. Backend logic (coins, offers, dashboards, geo-personalization) is a separate NestJS service (Bun runtime) on Railway, using Prisma over PostgreSQL (Supabase) with Redis as an aggregated-response cache. This document covers homepage frontend library choices; full backend/data-layer architecture — including the geo-personalization engine, caching strategy, and outlet-locator scaling path — is defined in `18_Server_Architecture.md`, which is authoritative for that layer. High-level business context also lives in the main platform report (`GreenChillyz_Digital_Experience_Platform.docx`).

## Frontend Data Layer
Homepage components consume server state via **TanStack Query**; resolved geo/location state is held in **Zustand** (or Context API). These fetch from the single aggregated endpoint defined in `18_Server_Architecture.md` — components should never fetch from multiple separate personalization endpoints.

## Allowed Libraries
- UI: Tailwind CSS, shadcn/ui (themed via `02_UI_Design_System.md` tokens, never default theme).
- Motion: Framer Motion (component-level), GSAP + ScrollTrigger (scroll timelines), Lenis (smooth scroll).
- Icons: Lucide, React Icons.
- Media: Cloudinary for image/video delivery and optimization.

## Explicitly Disallowed
No Bootstrap. No Material UI. No jQuery. No competing animation library beyond Framer Motion/GSAP (no anime.js, no custom raw CSS-only complex timelines).

## Folder Philosophy
Feature-first, not type-first: group by homepage section (`/components/hero`, `/components/food-experience`) rather than dumping everything in `/components`. Shared primitives (Button, Card, Input) live in `/components/ui`. Detailed structure in `10_Development_Rules.md`.

## Image & Video Optimization
All imagery served through Cloudinary with responsive `srcset`/format negotiation (AVIF/WebP first). Hero video: compressed, muted, autoplay-on-scroll-into-view only, lazy-loaded poster frame first.

## SEO
Next.js metadata API for per-page title/description; structured data for LocalBusiness (per outlet) and Organization — full detail in `14_SEO_and_Metadata.md`.

## Accessibility
WCAG 2.1 AA baseline — full detail in `11_Accessibility.md`. Non-negotiable, not a "nice to have."

## Coding Standards
TypeScript strict mode. No `any` without justification comment. Functional components + hooks only, no class components. ESLint + Prettier enforced.

## Performance Targets
LCP <2.0s, CLS <0.05, INP <200ms — see `08_Performance_Guidelines.md` for full budget.

## AI Implementation Notes for Fable
Do not introduce a library outside this list (or `18_Server_Architecture.md`'s backend additions) without flagging it explicitly as a proposed exception. All motion must route through Framer Motion or GSAP, never raw CSS `@keyframes` for anything beyond trivial hover states. For anything geo/personalization/caching-related, defer to `18_Server_Architecture.md`.