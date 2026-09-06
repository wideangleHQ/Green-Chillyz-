# 13. Store Locator & Outlet System

## Overview

The store/outlet system is one of the most complete backend features. It covers the full lifecycle of an outlet — creation, management, public display, and franchise dashboard access.

## Database Models

| Model | Purpose |
|---|---|
| `Store` | Core outlet record (location, contact, dashboard auth, flags) |
| `StoreGallery` | Ordered photo gallery for the outlet |
| `StoreTiming` | Operating hours per day of week (7 rows per store) |
| `StoreHoliday` | Specific closed dates |
| `StoreFacility` | Amenity tags (e.g., "WiFi", "Parking", "AC") |
| `StoreManager` | Staff/manager user assignments |
| `StoreAnnouncement` | Time-bounded announcements visible in dashboard |

## Store Fields

Key fields on the `Store` model:

```
id, brandId, name, slug (unique), code (unique)
description, shortDescription
email, phone, alternatePhone, website
addressLine1, addressLine2, city, state, country, postalCode
latitude, longitude (Decimal 10,8 / 11,8)
googleMapsLink, placeId
thumbnailImage, coverImage, logo
isActive, isFeatured
supportsDelivery, supportsTakeaway, supportsDineIn
averageRating (denormalized), totalReviews (denormalized)
```

## Backend API (StoreModule)

**Controller:** `server/src/modules/store/store.controller.ts`

Endpoints:
```
GET    /api/v1/stores              → List all active stores (public)
GET    /api/v1/stores/nearby       → Geo-sorted nearby stores (NearbyStoreQueryDto)
GET    /api/v1/stores/:idOrSlug    → Single store detail (public)
POST   /api/v1/stores              → Create store (admin)
PATCH  /api/v1/stores/:id          → Update store (admin/franchise)
DELETE /api/v1/stores/:id          → Soft-delete store (admin)

GET    /api/v1/stores/:id/gallery         → Gallery images
POST   /api/v1/stores/:id/gallery         → Upload gallery image
DELETE /api/v1/stores/:id/gallery/:imgId  → Remove gallery image

GET    /api/v1/stores/:id/timings         → Operating hours
PUT    /api/v1/stores/:id/timings         → Update timings (UpdateStoreTimingDto)

GET    /api/v1/stores/:id/holidays        → Holiday closures
POST   /api/v1/stores/:id/holidays        → Add holiday (CreateStoreHolidayDto)
DELETE /api/v1/stores/:id/holidays/:hId   → Remove holiday
```

Additional store-manager endpoints are in `store-manager.controller.ts`.

## Geo-Sorting (Nearby Stores)

The `/stores/nearby` endpoint accepts:
```json
{
  "latitude": 20.2961,
  "longitude": 85.8245,
  "radius": 10,
  "brandId": "optional"
}
```

Distance is computed using the **Haversine formula** in-app (via `server/src/utils/locationUtils.ts`). The `(latitude, longitude)` index (`idx_stores_location`) supports efficient geo queries. At 500+ outlets, this is designed to swap to PostGIS without API changes (see `docs/21_Server_Architecture.md`).

## Outlet Public Page

Each outlet has a unique slug (e.g., `greenchillyz-bhubaneswar-unit-1`). The public route structure is:

```
/stores/:slug    → Outlet detail page (📋 not yet implemented as a frontend page)
```

The outlet data flow:
```
Store (database)
  → GET /api/v1/stores/:slug (backend)
  → JSON response with gallery, timings, facilities
  → Frontend renders outlet page
```

> **Status:** The backend API for outlet detail is implemented. The frontend outlet detail page route is **not yet implemented** as a dedicated page.

## Store Locator Frontend

The `LocationsSection` on the homepage shows stores. The intended implementation uses:
- **Mapbox** for interactive map display
- Browser Geolocation API for user location
- `GET /api/v1/stores/nearby` for geo-sorted results

As of the current commit, the Mapbox integration and interactive map are **placeholder** — the section renders with static/mock data. The backend API is ready.

## Geo-Personalization (Planned)

Per `docs/21_Server_Architecture.md`, the intended system is:

```
1. User visits homepage
2. Browser Geolocation API called (2-3s timeout)
3. If denied → ipwho.is fallback (city-level)
4. POST /api/v1/geo/resolve { latitude, longitude, source }
5. Backend resolves nearest outlet
6. Returns personalized homepage bundle (offers, menu, reviews)
```

The `geo` module does not currently exist in `server/src/modules/`. This is a planned feature.

## Cache Strategy (Per Design)

Per `docs/21_Server_Architecture.md`, outlet data should be cached in Redis:
```
Key: homepage:outlet:{id}   TTL: 30 minutes
Key: geo:nearest:{lat}:{lng}
```

The `StoreService` and `StoreCacheService` (referenced in graph) handle cache invalidation via `.invalidateStore()` when store data is updated.
