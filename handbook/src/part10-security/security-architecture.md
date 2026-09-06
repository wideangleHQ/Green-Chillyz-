# 26. Security Architecture

## Security Layers

```
Internet
  │
  ├─ Cloudflare (DDoS, WAF, CDN) [external, not in repo]
  │
  ├─ NestJS: Helmet (HTTP security headers)
  ├─ NestJS: ThrottlerModule (rate limiting)
  ├─ NestJS: CORS (origin whitelist)
  ├─ NestJS: GlobalValidationPipe (input validation)
  │
  ├─ Auth Guards:
  │    JwtAuthGuard → customer endpoints
  │    DashboardAuthGuard → franchise endpoints
  │    @Public() → unauthenticated routes
  │
  ├─ Authorization:
  │    PermissionsGuard + @Permissions() → admin/staff endpoints
  │    DashboardStoreScopeGuard → outlet isolation
  │
  └─ Data layer: Prisma (parameterized queries, no raw SQL injection risk)
```

---

## Authentication Security

### Customer Auth

| Control | Implementation |
|---|---|
| Password hashing | argon2 (argon2id variant) |
| Token transport | HttpOnly cookies (XSS-proof) |
| CSRF mitigation | SameSite=Strict + double-submit pattern |
| Token refresh | Rotating family — entire family burned on reuse detection |
| Session revocation | `RefreshToken.revokedAt`, Redis session invalidation |
| Device tracking | `LoginHistory` table, `x-device-fingerprint` header |
| Google OAuth | Token verified server-side via `SUPABASE_JWT_SECRET` |

### Dashboard Auth

| Control | Implementation |
|---|---|
| Store code storage | argon2 hash (`dashboardCodeHash`) |
| Lookup optimization | HMAC blind index (`dashboardCodeLookup`) |
| Code recovery | AES-256-GCM encrypted copy (`dashboardCodeEncrypted`) |
| Brute force | Lockout after N failed attempts (`DASHBOARD_MAX_FAILED_ATTEMPTS`) |
| Session isolation | Entirely separate cookies, JWT secrets, session tables |

---

## HTTP Security Headers (Helmet)

```typescript
// Applied via: app.use(helmet())
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## Input Validation

All DTOs use `class-validator`. The `GlobalValidationPipe` is configured with:
- `whitelist: true` — unknown properties are stripped (defense against mass assignment)
- `forbidNonWhitelisted: true` — requests with extra fields are rejected 400
- `transform: true` — coerces types (string `"123"` → number `123`)

Prisma uses parameterized queries everywhere — no string concatenation, no raw SQL injection risk in normal usage.

> ⚠️ If `$queryRaw` or `$executeRaw` are used anywhere in the codebase, inspect them carefully for interpolation.

---

## Rate Limiting

```typescript
ThrottlerModule.forRoot([{
  ttl: configService.get('THROTTLE_TTL', 60) * 1000,
  limit: configService.get('THROTTLE_LIMIT', 60),
}])
```

- Default: 60 requests per 60 seconds per IP
- Dashboard login: separate stricter limit (see `DASHBOARD_LOGIN_RATE_LIMIT_*` env vars)
- Sensitive routes (OTP request) should have tighter limits (verify in implementation)

---

## Data Isolation

### Customer Data
- Every query is scoped to `userId` extracted from the verified JWT
- No route allows a customer to pass a `userId` parameter for cross-account access
- Profile assignment (`CustomerProfile.assignedStoreId`) links customers to their outlet

### Franchise Data
- `storeId` comes from the JWT payload, never from the request body/params
- `DashboardStoreScopeGuard` validates that any resource accessed belongs to the authenticated store
- Audit logs are filtered to the authenticated store's data

### Admin Data
- `SUPER_ADMIN` and `CORPORATE_ADMIN` roles have cross-store access
- Permission checks happen at the controller level via `PermissionsGuard`

---

## Secrets Management

All secrets are validated at startup via Joi schema (`env.validation.ts`). Missing required secrets cause a startup failure (fail-fast).

Required secrets:
```
DATABASE_URL
JWT_SECRET
JWT_REFRESH_SECRET
DASHBOARD_JWT_SECRET
DASHBOARD_JWT_REFRESH_SECRET
DASHBOARD_CODE_PEPPER    (HMAC key for blind index)
SUPABASE_URL
SUPABASE_JWT_SECRET
```

Optional secrets (features degrade gracefully if absent):
```
R2_*              (storage disabled)
MAIL_*            (email disabled)
SMS_*             (SMS disabled)
PUSH_FCM_*        (push disabled)
```

---

## Audit Trail

`AuditLog` table captures all significant actions:
- Actor identity (userId or storeId)
- Action type
- Affected resource (entityType + entityId)
- Old/new values (JSONB)
- IP address + user agent
- Timestamp

Audit logs are write-only for regular users — only admins can read them.

---

## Known Security Gaps / Future Work

| Gap | Risk | Priority |
|---|---|---|
| No refresh token rotation for admin sessions | Medium | Medium |
| OTP rate limiting (verify tightness) | Medium | High |
| Menu endpoints (if migrated) need authz review | Low | Low |
| Geo endpoints (when implemented) need input validation for lat/lng bounds | Low | Low |
