# 6. Backend Architecture

## Framework & Runtime

| Property | Value |
|---|---|
| Framework | **NestJS 11** |
| Runtime | **Bun** (not Node.js) |
| Language | TypeScript (strict) |
| ORM | **Prisma 6** |
| Port | 4000 |
| API Base | `/api/v1/` |

The backend is started with `bun run src/main.ts` (or `nest start`). Bun is used for its faster startup and native TypeScript support.

## Bootstrap (`main.ts`)

`server/src/main.ts` configures the application in this order:

1. **Global prefix**: `/api`
2. **URI versioning**: default version `1` → all routes are `/api/v1/...`
3. **Security middleware**: Helmet (security headers), compression, cookie-parser
4. **CORS**: In development, all origins allowed. In production, restricted to `APP_CORS_ORIGINS` env var. `credentials: true` required for HttpOnly cookies.
5. **Global pipes**: `GlobalValidationPipe` (class-validator, whitelist: true, forbidNonWhitelisted: true)
6. **Global filters**: `GlobalExceptionFilter`, `PrismaExceptionFilter`
7. **Global interceptors**: `LoggingInterceptor`, `ResponseInterceptor` (standard response envelope), `TimeoutInterceptor` (30s)
8. **Swagger**: Enabled only in non-production at `/api/docs`
9. **Graceful shutdown**: `app.enableShutdownHooks()`

## Module Architecture

Every module follows NestJS conventions:

```
modules/<name>/
├── <name>.module.ts       ← Module definition (imports, providers, exports)
├── <name>.controller.ts   ← HTTP boundary (routing, param extraction)
├── dto/                   ← Data Transfer Objects (class-validator decorators)
├── services/
│   ├── <name>.service.ts  ← Business logic orchestration
│   └── <sub>.service.ts   ← Sub-services for complex domains
├── interfaces/            ← TypeScript interfaces and types
├── guards/                ← Module-specific guards
├── decorators/            ← Module-specific decorators
└── constants/             ← Permissions, enums, config keys
```

## Registered Modules

| Module | Path | Responsibility |
|---|---|---|
| `AuthModule` | `modules/auth` | Customer registration, login, Google OAuth, OTP, JWT, device tracking |
| `DashboardAuthModule` | `modules/dashboard-auth` | Store access-code auth, dashboard JWT, rotating refresh tokens |
| `DashboardModule` | `modules/dashboard` | Admin dashboard APIs (stores, customers, rewards, menu, wallet, vouchers, notifications, analytics) |
| `StoreModule` | `modules/store` | Store CRUD, gallery, timings, holidays, facilities, managers, announcements |
| `WalletModule` | `modules/wallet` | Coin wallet: balance, credit, debit, expire, transaction history |
| `GameModule` | `modules/game` | Game configuration, session lifecycle, analytics, leaderboard |
| `RewardModule` | `modules/reward` | Reward catalog, redemption, voucher issuance |
| `RewardsModule` | `modules/rewards` | Customer-facing reward discovery and listing |
| `RewardProfileModule` | `modules/reward-profile` | Configurable reward profiles (global/standard/premium/custom) |
| `RewardRulesModule` | `modules/reward-rules` | Milestone/visit/game reward rules within a profile |
| `RewardAssignmentModule` | `modules/reward-assignment` | Assign profiles to stores |
| `RewardOverridesModule` | `modules/reward-overrides` | Per-store rule overrides |
| `RewardResolutionModule` | `modules/reward-resolution` | Resolve which reward rule applies for an event |
| `CoinEconomyModule` | `modules/coin-economy` | Coin economy analytics and reporting |
| `DashboardRewardsModule` | `modules/dashboard-rewards` | Dashboard reward management endpoints |
| `CustomerBootstrapModule` | `modules/customer-bootstrap` | Post-registration setup (creates wallet, customer profile) |
| `CustomerJourneyModule` | `modules/customer-journey` | Customer journey event tracking |
| `MenuModule` | `modules/menu` | Menu categories, items, tags, images |
| `NotificationModule` | `modules/notification` | Notification dispatch, templates, preferences |
| `AuditModule` | `modules/audit` | Audit log recording and querying |
| `ChallengesModule` | `modules/challenges` | Customer challenge system |

## Shared Infrastructure

### Global Guards & Decorators

| Name | Type | Behaviour |
|---|---|---|
| `JwtAuthGuard` | Guard | Applied globally. Verifies `gc_access_token` cookie. Skip with `@Public()` decorator. |
| `PermissionsGuard` | Guard | Applied per-route. Checks user roles/permissions via `@Permissions(...)` decorator. |
| `DashboardAuthGuard` | Guard | Applied to all dashboard routes. Verifies `gc_dashboard_access_token` cookie. |
| `@Public()` | Decorator | Marks a route as unauthenticated (skips JwtAuthGuard). |
| `@CurrentUser()` | Decorator | Injects the decoded `JwtPayload` from the request. |
| `@Permissions(...)` | Decorator | Declares required permissions for a route. |

### Request Context Headers

Every request gets two headers injected by middleware:
- `x-request-id`: Unique per-request ID (UUID)
- `x-correlation-id`: Correlation ID for distributed tracing

### Response Envelope

`ResponseInterceptor` wraps every successful response:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-09-06T12:00:00.000Z",
  "requestId": "..."
}
```

### Error Format

`GlobalExceptionFilter` produces:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "...",
    "details": [...]
  },
  "timestamp": "...",
  "path": "/api/v1/auth/register"
}
```

## Config System

All configuration is typed via `@nestjs/config` + Joi validation in `src/config/env.validation.ts`. The app fails at startup if required env vars are missing.

Config keys are namespaced:
- `app.*` — Application settings
- `auth.*` — JWT secrets and expiry
- `dashboardAuth.*` — Dashboard-specific auth config
- `redis.*` — Redis connection
- `queue.*` — BullMQ settings
- `storage.*` — Cloudflare R2 config
- `mail.*` — Mail settings

## Queue System (BullMQ)

`QueueModule` provides `QueueService` which wraps BullMQ. Jobs are dispatched for:
- Notification delivery (email, push, SMS)
- Reward processing
- Audit log writes
- Coin expiration

Backed by the same Redis instance as the session/cache layer.

## Health Check

`HealthModule` exposes `GET /api/v1/health` using `@nestjs/terminus`. Checks database connectivity and Redis availability. Used by Railway for deployment health monitoring.
