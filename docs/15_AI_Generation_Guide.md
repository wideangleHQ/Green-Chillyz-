# 15 — AI Generation Guide (Prompt Library)

Supports the `09_Asset_Pipeline.md` workflow. All prompts must encode the Visual Direction (`05_Visual_Direction.md`) mood: warm, cinematic, editorial, organic.

## Whisk Prompt Template (stills)
"[Subject], macro/45°-angle food photography, shallow depth of field, warm natural + soft artificial light, steam/texture visible, generous negative space, muted warm-neutral background (#FFF8F0 tone), no clutter, editorial fine-dining magazine style."

## Veo Prompt Template (motion)
"[Subject/scene], slow cinematic drift or gentle handheld motion, warm color grade, soft natural light, 10–15 second loop, no hard cuts, ambient premium restaurant mood, no visible logos or text overlays."

## Canva Prompt/Brief Template (graphics)
"[Asset type — OG image/badge], Luxe Gastronomy palette (primary green #006B2A, warm neutral #FFF8F0, gold accent #D4AF37 reserved for premium elements only), Poppins typography, pill/rounded shapes, no stock-template clipart."

## Negative Prompts (all generation types)
Avoid: cold/blue lighting, cluttered tablescapes, stock-photo stiff posing, sharp/hard-edged shapes, any Bootstrap/Material-style flat UI aesthetics, fabricated brand logos not matching the Group's actual identity, text/watermarks baked into imagery.

## Lighting Prompts
"Warm, soft, directional light with gentle falloff; avoid flat overhead lighting; shadows soft-edged, never harsh."

## Camera Prompts
"45° angle for hero dish shots; top-down for spread/ingredient shots; eye-level, candid framing for people/ambience shots."

## Consistency Rules
Every generated asset must be checked against: (1) color palette adherence, (2) lighting/mood match, (3) no invented brand elements, (4) composition leaves room for glass UI overlay per `02_UI_Design_System.md`.

## AI Implementation Notes for Fable
When generating placeholder or production imagery, apply these templates verbatim as a starting point, then adjust per-section context from `12_Homepage_Sections.md`.

use higsfeild MCP Automatically when required
