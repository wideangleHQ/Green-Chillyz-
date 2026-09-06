# 43. Complete Franchise Journey

The franchise journey covers how an outlet operator manages their store day-to-day via the franchise dashboard.

---

## Onboarding (One-Time Setup)

```
Admin creates store record in system
  ↓
Admin sets dashboard access code (e.g., "GC-BBSR0001")
  ↓
Admin shares access code with franchise operator
  ↓
Franchise operator opens dashboard.greenchillyz.com
```

**Code path:** [Section 39 — New Outlet](../part16-howto/new-outlet.md)

---

## Daily Login

```
Staff opens dashboard.greenchillyz.com/login
  ↓
client/app/login/page.tsx (✅ IMPLEMENTED)
  ↓
Enters store access code: "GC-BBSR0001"
  ↓
POST /api/v1/dashboard/auth/login
  { storeCode: "GC-BBSR0001" }
  ↓
Server flow:
  1. HMAC blind index computed from storeCode
  2. Store lookup by dashboardCodeLookup (indexed, fast)
  3. argon2 verify: storeCode vs dashboardCodeHash
  4. Check lockout state
  5. DashboardSession created in Redis + PostgreSQL
  6. gc_dashboard_access_token (15min) + gc_dashboard_refresh_token (7d) set as HttpOnly cookies
  ↓
Staff sees outlet dashboard (📋 frontend pending)
```

---

## Customer Coin Redemption (📋 Backend Ready, Frontend Pending)

```
Customer visits outlet with voucher
  ↓
[📋] Staff opens redemption screen in dashboard
  ↓
Staff enters customer's voucher code or scans QR
  ↓
[📋] POST /api/v1/dashboard/rewards/vouchers/:code/validate
  → DashboardAuthGuard extracts storeId from JWT
  → Validates voucher belongs to this outlet's reward catalog
  → Returns voucher details + customer info
  ↓
Staff confirms redemption
  ↓
[📋] POST /api/v1/dashboard/rewards/vouchers/:code/redeem
  → Voucher status changed to USED
  → RewardRedemption.redeemedAt set
  → AuditLog entry created
```

---

## Outlet Profile Management (📋 Backend Ready, Frontend Pending)

```
[📋] Staff opens store settings
  ↓
Update operating hours:
  PUT /api/v1/stores/:id/timings
  
Add/remove gallery images:
  POST /api/v1/stores/:id/gallery (upload)
  DELETE /api/v1/stores/:id/gallery/:imageId
  
Add holiday closure:
  POST /api/v1/stores/:id/holidays
  { date: "2026-12-25", reason: "Christmas" }

Update store description / announcement:
  PATCH /api/v1/dashboard/stores/:id
```

---

## Store Voucher Creation (📋 Backend Ready, Frontend Pending)

Franchise operators can create time-limited vouchers for their outlet:

```
[📋] Staff opens "Create Offer" screen
  ↓
POST /api/v1/dashboard/vouchers
  {
    title: "10% off on orders above ₹500",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minOrderValue: 500,
    validFrom: "2026-10-01",
    validUntil: "2026-10-31",
    usageLimit: 100
  }
  ↓
Voucher submitted for admin approval
  ↓
Admin reviews and approves
  ↓
Voucher becomes visible to customers at that outlet
```

---

## Session Management

```
Staff finishes shift
  ↓
POST /api/v1/dashboard/auth/logout
  → Current session revoked in Redis + PostgreSQL
  → Cookies cleared
  ↓
[📋] Staff can view active sessions:
  GET /api/v1/dashboard/auth/sessions
  → Lists all active sessions (useful if code was shared)
  
[📋] Staff can revoke a session:
  DELETE /api/v1/dashboard/auth/sessions/:id
```

---

## Token Recovery (Lost Access Code)

```
Franchise operator loses access code
  ↓
Contact admin
  ↓
Admin looks up Store.dashboardCodeEncrypted
  ↓
Admin decrypts with DASHBOARD_CODE_SECRET (AES-256-GCM)
  ↓
Admin provides plaintext code OR resets with a new code:
  PATCH /api/v1/dashboard/stores/:id { dashboardCode: "GC-BBSR-NEW" }
```

---

## Access Code Rotation

If the code is compromised:

```
Admin generates new code
  ↓
PATCH /api/v1/dashboard/stores/:id { dashboardCode: "GC-BBSR-NEW" }
  ↓
All existing dashboard sessions for this store are invalidated
  (DashboardSession records + Redis keys cleared)
  ↓
Staff must log in again with the new code
```

---

## Current Implementation Status

| Feature | Backend | Frontend |
|---|---|---|
| Login | ✅ | ✅ |
| Outlet overview | ✅ | 📋 |
| Coin redemption | ✅ | 📋 |
| Store profile edit | ✅ | 📋 |
| Voucher management | ✅ | 📋 |
| Redemption history | ✅ | 📋 |
| Session management | ✅ | 📋 |
| Analytics | ✅ | 📋 |
