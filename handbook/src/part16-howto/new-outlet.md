# 39. How to Add a New Outlet

A new outlet (store/franchise location) requires both a database record and a dashboard access code.

---

## Step 1 — Create the Store Record

### Via Admin API

```
POST /api/v1/dashboard/stores
Auth: Admin JWT (SUPER_ADMIN or CORPORATE_ADMIN role)
Body: {
  name: "GreenChillyz Bhubaneswar",
  slug: "greenchillyz-bhubaneswar",
  brandId: "<green-chillyz-brand-uuid>",
  address: "Plot 123, Saheed Nagar",
  city: "Bhubaneswar",
  state: "Odisha",
  country: "India",
  pincode: "751007",
  phone: "+91-9XXXXXXXXX",
  email: "bbsr@greenchillyz.com",
  latitude: 20.296,
  longitude: 85.824,
}
```

### Via Prisma Studio (dev only)

Open Prisma Studio → `Store` model → Add record manually.

---

## Step 2 — Set the Dashboard Access Code

The access code is how franchise staff log into `dashboard.greenchillyz.com`. It must be set after creating the store.

```
PATCH /api/v1/dashboard/stores/:id
Body: {
  dashboardCode: "GC-BBSR0001"   // or any chosen code
}
```

The server will:
1. Hash the code with argon2 → stores in `dashboardCodeHash`
2. Compute HMAC blind index → stores in `dashboardCodeLookup`
3. Encrypt the plaintext code → stores in `dashboardCodeEncrypted` (for admin recovery)

> **Keep the plaintext code** — give it to the franchise operator. Admin can recover it from `dashboardCodeEncrypted` if lost, but simpler to just note it.

---

## Step 3 — Configure Operating Hours

```
PUT /api/v1/stores/:id/timings
Body: {
  timings: [
    { dayOfWeek: 1, openTime: "10:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 2, openTime: "10:00", closeTime: "22:00", isClosed: false },
    // ... 0=Sunday through 6=Saturday
    { dayOfWeek: 0, openTime: null, closeTime: null, isClosed: true }
  ]
}
```

---

## Step 4 — Add Gallery Images

```
POST /api/v1/stores/:id/gallery
(multipart/form-data with image files)
```

Images are uploaded to Cloudflare R2. Returned URLs are stored in the `StoreGallery` join table.

---

## Step 5 — Activate the Store

Set `isActive = true` to make the store visible in public API:

```
PATCH /api/v1/dashboard/stores/:id
Body: { isActive: true }
```

---

## Step 6 — Verify the Outlet is Live

```bash
# Public store listing
curl http://localhost:4000/api/v1/stores

# Specific store
curl http://localhost:4000/api/v1/stores/greenchillyz-bhubaneswar

# Nearby search
curl "http://localhost:4000/api/v1/stores/nearby?latitude=20.296&longitude=85.824"
```

The outlet should appear in all three responses.

---

## Step 7 — Test Dashboard Login

```
POST /api/v1/dashboard/auth/login
Body: { storeCode: "GC-BBSR0001" }
```

Should return store context with the new outlet's details.

---

## Multi-Brand Outlets

Each store is linked to a `Brand` via `brandId`. To create a YellowChillyz outlet, use the YellowChillyz brand ID.

```
GET /api/v1/brands   → list available brands with IDs
```

The `brand` field on stores drives visual theming in the frontend (different color schemes per brand).

---

## Data Checklist

```
[ ] Store record created (isActive = false initially)
[ ] Brand assigned correctly
[ ] Lat/lng set correctly (used for nearby search)
[ ] Dashboard access code set + shared with franchise operator
[ ] Operating hours configured
[ ] Gallery images uploaded
[ ] Store activated (isActive = true)
[ ] Verified in /api/v1/stores response
[ ] Verified dashboard login works
```
