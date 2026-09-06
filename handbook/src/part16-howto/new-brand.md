# 40. How to Add a New Brand

GreenChillyz currently operates three brands: GreenChillyz, YellowChillyz, GoldenChillyz. Adding a fourth brand touches the database, backend, and frontend.

---

## Step 1 — Create the Brand Record

```
POST /api/v1/brands
Auth: SUPER_ADMIN
Body: {
  name: "RedChillyz",
  slug: "redchillyz",
  tagline: "Fiery flavors for bold souls",
  primaryColor: "#C62828",
  logoUrl: "https://r2.../redchillyz-logo.png",
  isActive: true
}
```

Or via Prisma Studio → `Brand` model.

---

## Step 2 — Theme Configuration

Each brand has its own visual identity. The `Brand.primaryColor` is used by the frontend to apply brand-specific theming.

In `client/`, the brand color system likely lives in:
- `client/lib/brands.ts` — brand config map
- `client/styles/` — CSS variable overrides per brand

Add the new brand's color tokens to the theme config. The exact implementation depends on how multi-brand theming is structured (verify in `client/` source).

---

## Step 3 — Logo and Assets

Upload brand assets to Cloudflare R2:
- Logo (SVG or WebP, 200x200 minimum)
- Hero imagery
- Icon set

Update `Brand.logoUrl` and any related asset fields via API or Prisma Studio.

---

## Step 4 — Frontend Brand Page

If the brand gets its own landing page (e.g., `/yellowchillyz`):

1. Add the brand page in `client/app/(brands)/redchillyz/page.tsx`
2. Configure metadata (title, description, OG image) via Next.js metadata API
3. Add to navigation if applicable

---

## Step 5 — Create Outlets for the Brand

Follow [Section 39 — New Outlet](new-outlet.md) using the new `brandId`.

---

## Step 6 — Verify

```bash
# Brand appears in brand listing
curl http://localhost:4000/api/v1/brands

# Outlets linked to new brand appear correctly
curl "http://localhost:4000/api/v1/stores?brandId=<new-brand-id>"

# Dashboard login for a new brand outlet works
POST /api/v1/dashboard/auth/login { storeCode: "RC-XXXX0001" }
```

---

## Considerations

- **Reward campaigns** can be scoped to a brand (`RewardCampaign.brandId`). Create brand-specific campaigns after adding the brand.
- **Games** can be brand-specific if `Game.brandId` is supported in the schema (check schema).
- **Dashboard theming**: the franchise dashboard shows the brand name and potentially brand colors — verify `DashboardAuth.me` response includes brand info.
- **SEO metadata**: ensure the new brand has correct `metadataBase` and Open Graph configuration in the client app.
