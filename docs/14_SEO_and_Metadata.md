# 14 — SEO & Metadata

## Meta Titles / Descriptions
Homepage title: "GreenChillyz — [Brand tagline]" (≤60 chars). Description: one sentence capturing the 3-brand storytelling angle + primary CTA intent (≤155 chars). No keyword-stuffing.

## Structured Data
- `Organization` schema for the Group.
- `LocalBusiness` schema per outlet (name, address, hours, geo) — feeds Locations section and supports local search/map pack visibility.
- `Review`/`AggregateRating` schema for the Reviews section (only if reviews are genuinely sourced/verifiable — never fabricated ratings markup).

## OG Images / Twitter Cards
Dedicated OG image (1200×630) per brand, built via Canva pipeline (`09_Asset_Pipeline.md`), following Visual Direction (`05_Visual_Direction.md`) — not a random homepage screenshot.

## Image ALT Rules
Every meaningful image: descriptive, specific alt text (e.g., "Grilled paneer skewers at GreenChillyz signature menu," not "food photo"). Decorative-only imagery: empty alt (`alt=""`).

## Semantic HTML
One `h1` per page (Hero headline). Section headings follow logical `h2`/`h3` nesting matching `12_Homepage_Sections.md` order. Landmarks (`nav`, `main`, `footer`) used correctly for SEO and accessibility simultaneously.

## AI Implementation Notes for Fable
Use Next.js Metadata API to generate title/description/OG per brand context (Green/Yellow/Golden) if the homepage is brand-parameterized; otherwise single canonical Group-level metadata set.
