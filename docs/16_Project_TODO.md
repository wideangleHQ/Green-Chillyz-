# 16 — Project TODO / Roadmap

## Milestones
1. Documentation system complete (this set) — **Done**.
2. Design token implementation (Tailwind config from `DESIGN.md` + `02_UI_Design_System.md`) — **Done** (`web/app/globals.css` `@theme`; `DESIGN.md` file absent, literal values taken from `19_Design_Tokens.md`).
3. Component library build-out (`04_Component_Library.md`) — **Done** for homepage-scope primitives (`web/components/ui`); Modal/Dropdown/Accordion/Tooltip deferred until a section needs them (built once required per reuse rule).
4. Section-by-section homepage build (`12_Homepage_Sections.md`) — **Done** (all 11 sections, `web/components/*`). All photography/video/Mapbox are labelled pending-asset placeholders per `09_Asset_Pipeline.md`.
5. Animation pass (`03_Animation_Guidelines.md`, `13_Animation_Timeline.md`) — **Done** at implementation level (per-section controllers, reduced-motion fallbacks); FPS validation pending real assets.
6. Accessibility audit (`11_Accessibility.md`) — Implementation-level pass done (structure/landmarks/targets/reduced-motion branches verified); full manual keyboard + screen-reader audit pending.
7. Performance audit (`08_Performance_Guidelines.md`) — Pending real assets (Lighthouse must run against Cloudinary media, not placeholders).
8. SEO/metadata pass (`14_SEO_and_Metadata.md`) — **Done** (Metadata API, Organization + per-outlet structured data, sitemap/robots). OG images pending Canva pipeline. Review/AggregateRating markup intentionally omitted until genuine reviews are sourced.
9. Content/copy finalization with Group review (`06_Content_and_Copy.md`) — Pending. All copy in `web/lib/content.ts` is illustrative and flagged for Group review.
10. Launch QA — Pending (blocked on assets + final copy).

## Ideas / Future Features (out of current homepage scope)
- Mobile app teaser section.
- POS-linked live ordering CTA.
- Franchise portal deep-link from Franchise section.
- Personalization: geo-aware nearest-outlet hero variant.

## QA Checklist (pre-launch)
- [ ] Lighthouse: LCP/CLS/INP within budget (`08_Performance_Guidelines.md`).
- [ ] Full keyboard-only pass across all sections.
- [ ] `prefers-reduced-motion` verified across all animated sections.
- [ ] Contrast-checked glass panels against real backgrounds.
- [ ] All imagery has correct alt text / decorative images marked `aria-hidden`.
- [ ] Structured data validates (Organization, LocalBusiness, Review).
- [ ] Copy reviewed against `06_Content_and_Copy.md` tone rules.
- [ ] No disallowed libraries present (Bootstrap/Material UI/jQuery).

## AI Implementation Notes for Fable
Treat this file as a living tracker — update status as sections are completed rather than treating the documentation set as static after generation.
