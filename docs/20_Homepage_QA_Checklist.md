# 20 — Homepage Quality Assurance Checklist

Ensures every release meets premium production quality before deployment. Consolidates the acceptance criteria scattered across this doc set into one pre-launch pass. Cross-references the source-of-truth file for each category — this file is the checklist, not a new set of rules.

---

## Visual QA
- [ ] Alignment matches the 4/8/12-col grid at every tier (`02_UI_Design_System.md`, `18_Responsive_Design_System.md`).
- [ ] Spacing uses only base-8 scale values (`19_Design_Tokens.md`).
- [ ] Typography uses Poppins exclusively, correct scale/weight/tracking per element (`02_UI_Design_System.md`).
- [ ] Color consistency — no hardcoded hex values, all tokens referenced (`19_Design_Tokens.md`).
- [ ] Glass effects: blur 16–32px, 60–80% fill, 1px/20% border, never two glass layers stacked (`DESIGN.md`, `05_Visual_Direction.md`).
- [ ] Shadow consistency — multi-layer ambient shadows only, no flat single drop-shadow (`02_UI_Design_System.md`).
- [ ] Border radius ≥24px on cards/containers, pill on buttons/chips, never 0px (`19_Design_Tokens.md`).
- [ ] Icon alignment/sizing consistent, Lucide/React Icons only, no mixed families (`04_Component_Library.md`).
- [ ] Branding — no invented 4th brand, no color outside `DESIGN.md` tokens, gold reserved for Signature moments only (`00_Project_Vision.md`).

## Animation QA
- [ ] Smoothness — no dropped frames on scroll-triggered reveals.
- [ ] Frame rate holds under animation load per `08_Performance_Guidelines.md` budget.
- [ ] Easing matches `cubic-bezier(0.16, 1, 0.3, 1)` for reveals, spring (260/26) for cards/buttons (`03_Animation_Guidelines.md`).
- [ ] Duration within budget — micro 150–250ms, reveals 400–700ms, never exceeding 1000ms.
- [ ] No jitter on parallax or scroll-linked motion.
- [ ] No flickering on glass/backdrop-filter elements during scroll.
- [ ] Hover behaviour consistent across all card/button types (`17_Interaction_Principles.md`).
- [ ] Scroll behaviour: Lenis-smooth, never hijacked, no scroll-jacking traps.
- [ ] Page transition: cross-fade/vertical-reveal only, no hard-reload sensation (`01_Homepage_Experience.md`).

## Responsive QA
- [ ] Desktop (1280–1919px) — full grid, all effects at max intensity.
- [ ] Laptop (1024–1279px) — verified independently, not assumed identical to Desktop.
- [ ] Tablet (768–1023px) — 8-col grid, reduced-but-present richness.
- [ ] Mobile (320–767px) — single-column, all content present, no hidden CTAs.
- [ ] Ultra Wide (1920px+) — container capped at 1440px, no excessive whitespace imbalance.
- [ ] Landscape — mobile landscape tested explicitly, not just portrait.
- [ ] Portrait — default mobile orientation fully verified.
(Full behavior spec: `18_Responsive_Design_System.md`.)

## Accessibility QA
- [ ] Full keyboard navigation, logical tab order, no traps (`11_Accessibility.md`).
- [ ] Screen reader pass — semantic HTML first, ARIA only where needed.
- [ ] ARIA used precisely (`aria-label`, `aria-expanded`, `aria-live` where applicable).
- [ ] Focus states visible on every interactive element, survive scroll-triggered reveals.
- [ ] Contrast checked at real rendered glass opacity over real backgrounds, not flat token color.
- [ ] `prefers-reduced-motion` verified across every animated section.
- [ ] Touch targets ≥44×44px on all viewports.
- [ ] Forms: visible labels (not placeholder-only), errors announced via `aria-live`.

## Performance QA
- [ ] Lighthouse run on homepage (mobile + desktop profiles).
- [ ] Core Web Vitals within budget: LCP <2.0s, CLS <0.05, INP <200ms (`08_Performance_Guidelines.md`).
- [ ] CLS specifically checked on all lazy-loaded media (reserved aspect-ratio boxes).
- [ ] FPS holds during heaviest scroll section (Food Experience parallax / Games teaser).
- [ ] GPU usage — concurrent blur elements within limit (nav + one active glass region max, further reduced on mobile per `18_Responsive_Design_System.md`).
- [ ] Image compression verified via Cloudinary pipeline — hero ≤200KB, thumbnails <50KB.
- [ ] Video compression verified — hero <3MB, <15s, 720p, muted, no audio track.
- [ ] Bundle size reviewed — no disallowed library present (see Cross-check below).

## SEO QA
- [ ] Titles ≤60 chars, descriptions ≤155 chars, no keyword-stuffing (`14_SEO_and_Metadata.md`).
- [ ] Structured data validates: `Organization`, `LocalBusiness` per outlet, `Review`/`AggregateRating` (only if genuinely sourced).
- [ ] OG image present per brand, 1200×630, built via Canva pipeline — not a raw homepage screenshot.
- [ ] Alt text descriptive and specific on every meaningful image; decorative images use empty alt.
- [ ] Heading structure — one `h1` (Hero), logical `h2`/`h3` nesting matching `12_Homepage_Sections.md` order.
- [ ] Semantic HTML landmarks (`nav`, `main`, `footer`) present and correctly scoped.

## Content QA
- [ ] Grammar pass complete on all final copy.
- [ ] Microcopy matches tone/format rules in `06_Content_and_Copy.md` (empty states, loading states, errors).
- [ ] Button labels verb-first, ≤3 words, never "Click Here"/"Learn More" alone.
- [ ] Consistency — brand names used naturally (GreenChillyz/YellowChillyz/GoldenChillyz), never "our brands."
- [ ] Brand voice — confident/warm/editorial, no filler marketing adjectives ("delicious," "amazing," "best-in-class").
- [ ] All copy in this doc set is explicitly flagged as illustrative — confirm final copy has been through Group review per `13. Project Governance` (main platform report).

## Cross Browser QA
- [ ] Chrome (desktop + mobile)
- [ ] Safari (desktop + iOS — glassmorphism/`backdrop-filter` behavior verified specifically, historically inconsistent)
- [ ] Firefox
- [ ] Edge
- [ ] Mobile browser variants (Samsung Internet, mobile Chrome/Safari)

## Device QA
- [ ] iPhone (recent + one older/smaller model, notch/safe-area check)
- [ ] Android (recent mid-range, not flagship-only)
- [ ] Tablet (iPad or equivalent, both orientations)
- [ ] Desktop (standard 1280–1536px range)
- [ ] 4K / Ultra Wide (container-cap and whitespace verified)

## Interaction QA
- [ ] Hover — confirms interactivity, previews click result, no surprise motion (`17_Interaction_Principles.md`).
- [ ] Click — immediate visual feedback within one frame, no dead clicks.
- [ ] Focus — keyboard-only pass matches mouse-hover affordance.
- [ ] Scroll — smooth, user always retains control, no hijacking.
- [ ] Gesture — swipe/touch always has a non-gesture equivalent (arrows/dots).
- [ ] Loading states shown for anything >300ms, brand-voiced copy (`06_Content_and_Copy.md`).
- [ ] Error states — plain-language, no stack traces or provider names (Supabase/Railway) ever exposed to end users.
- [ ] Empty states — copy matches `06_Content_and_Copy.md` microcopy examples (rewards, reviews).

## Security QA
- [ ] Links — all external links verified, no broken/placeholder URLs shipped.
- [ ] External navigation opens safely (`rel="noopener noreferrer"` where `target="_blank"` is used).
- [ ] Privacy — customer-facing privacy notice live at launch (per Section 14 of the main platform report).
- [ ] Cookie banner present and functional if required by applicable regulation.
- [ ] Analytics (Google Analytics, Microsoft Clarity) deferred until after first interaction/idle callback, per `08_Performance_Guidelines.md` — never blocking initial render, and disclosed in the privacy notice.

## Final Launch Checklist
- [ ] Homepage Complete — all 11 sections built per `12_Homepage_Sections.md`.
- [ ] Animations Verified — full pass against `03_Animation_Guidelines.md` and `13_Animation_Timeline.md`.
- [ ] Assets Optimized — Cloudinary pipeline confirmed for every image/video (`09_Asset_Pipeline.md`).
- [ ] SEO Verified — all SEO QA items above complete.
- [ ] Accessibility Passed — all Accessibility QA items above complete, WCAG 2.1 AA confirmed.
- [ ] Performance Passed — Core Web Vitals budget met on real Lighthouse run, not local dev only.
- [ ] Cross Browser Passed — all browsers/devices above verified.
- [ ] Content Approved — final copy signed off by GreenChillyz Group per project governance (Section 13, main platform report).
- [ ] Ready for Production.

## Future Improvements
Tracked ideas out of current scope: mobile app teaser section, POS-linked ordering CTA, franchise portal deep-link, geo-aware nearest-outlet hero variant (see `16_Project_TODO.md` for the authoritative roadmap — this file does not duplicate scope decisions, only tracks QA-relevant follow-ups).

## Known Issues
_(Populate during QA cycles — leave empty in the template; do not fabricate issues before testing has occurred.)_

## Technical Debt
_(Populate as engineering flags shortcuts taken under deadline pressure — reference the specific file/component and the doc rule it deviates from.)_

## Version History
| Date | Change |
|---|---|
| — | Initial checklist created alongside `18_Responsive_Design_System.md` and `19_Design_Tokens.md`. |

## AI Implementation Notes for Fable
This file is a checklist, not a rules source — every item here traces back to a rule already defined in `02`–`18`. If a QA item fails, fix the implementation against the referenced source file rather than editing this checklist to match the implementation. Update **Known Issues** and **Technical Debt** as living sections during real QA cycles; do not pre-fill them with speculative content.
