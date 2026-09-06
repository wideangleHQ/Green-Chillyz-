# 7. Request Lifecycle

## Standard Authenticated Request

```
Browser / Frontend
        │
        │  HTTPS POST /api/v1/games/sessions/start
        │  Headers: Cookie: gc_access_token=<jwt>; gc_refresh_token=<jwt>
        │           x-device-fingerprint: <fingerprint>
        │
        ▼
  Cloudflare CDN/WAF
        │
        ▼
  Railway (NestJS / Bun, port 4000)
        │
        ▼
  RequestIdMiddleware
  CorrelationIdMiddleware
        │  Attaches x-request-id, x-correlation-id to request
        ▼
  ThrottlerGuard (global)
        │  Rate limit check: 60 req / 60s by default
        ▼
  JwtAuthGuard (global)
        │  Reads gc_access_token cookie
        │  Verifies signature + expiry against JWT_SECRET
        │  Attaches JwtPayload to request.user
        ▼
  GameController.startSession()
        │  Extracts @CurrentUser() from request.user
        │  Extracts @Body() StartGameSessionDto
        │  Calls GameSessionService.startSession()
        ▼
  GlobalValidationPipe
        │  class-validator validates StartGameSessionDto
        │  Strips unknown properties (whitelist: true)
        ▼
  GameSessionService.startSession()
        │  Checks daily play limits (Redis cache)
        │  Checks cooldown period (Redis cache)
        │  Creates GameSession record (Prisma → PostgreSQL)
        │  Returns session token/ID
        ▼
  ResponseInterceptor
        │  Wraps result in { success: true, data: ... }
        ▼
  LoggingInterceptor
        │  Logs request duration, method, path, status
        ▼
  Response → Browser
```

## Authentication Refresh Flow

When an access token expires, the frontend calls `POST /api/v1/auth/refresh`:

```
Browser (access token expired)
        │
        ▼
  POST /api/v1/auth/refresh
  Cookie: gc_refresh_token=<refresh_jwt>
        │
        ▼
  @Public() — JwtAuthGuard skipped
        │
        ▼
  AuthController.refresh()
        │  Reads gc_refresh_token from cookies
        │  Calls AuthService.refreshTokens()
        │
        ▼
  AuthService.refreshTokens()
        │  Verifies refresh token hash against RefreshToken table
        │  Checks token family (detects reuse attacks)
        │  If family reuse detected → burns all tokens in family
        │  Issues new access + refresh token pair
        │  Stores new refresh token hash (rotation)
        │
        ▼
  Sets new HttpOnly cookies:
    gc_access_token (15m expiry)
    gc_refresh_token (30d expiry)
        │
        ▼
  Returns { message: 'Tokens refreshed successfully' }
```

## Dashboard Authentication Flow

Dashboard auth uses a store access code rather than a user account:

```
Franchise User enters store access code on dashboard login page
        │
        ▼
  POST /api/v1/dashboard/auth/login
  Body: { storeCode: "GC-STORE-XXXX" }
        │
        ▼
  @DashboardPublic() — DashboardAuthGuard skipped for this route
        │
        ▼
  DashboardAuthController.login()
        │
        ▼
  DashboardAuthService.login()
        │  Computes keyed blind index from storeCode (HMAC with DASHBOARD_CODE_PEPPER)
        │  Single indexed lookup against stores.dashboard_code_lookup
        │  Verifies argon2 hash of code against stores.dashboard_code_hash
        │  Checks store lockout (failed attempts + lock duration)
        │  Creates DashboardSession in PostgreSQL
        │  Stores session in Redis (hot copy)
        │  Issues dashboard JWT pair
        │
        ▼
  Sets HttpOnly cookies:
    gc_dashboard_access_token (15m)
    gc_dashboard_refresh_token (7d)
        │
        ▼
  Returns { store: { id, name, slug, brand }, session: {...} }
```

## Public Endpoints (No Auth)

Routes decorated with `@Public()` bypass `JwtAuthGuard` entirely:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/google`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/request-otp`
- `POST /api/v1/auth/verify-otp`
- `POST /api/v1/dashboard/auth/login`
- `GET /api/v1/health`
- Any store route explicitly decorated `@Public()`

## Real-World Example: Earning Coins from a Game

```
1. Customer plays spin-the-wheel game on greenchillyz.com/games
2. Frontend calls POST /api/v1/games/sessions/start { gameId: "spin-wheel" }
3. JwtAuthGuard validates customer JWT
4. GameSessionService:
   a. Checks Redis for daily play count (dailyLimit: 3)
   b. Checks cooldown period (cooldown: 3600s)
   c. Creates GameSession { status: STARTED } in PostgreSQL
   d. Returns { sessionId, token }
5. Customer spins on frontend (visual only, no server call)
6. Frontend calls POST /api/v1/games/sessions/end { sessionId, score, outcome }
7. GameSessionService:
   a. Validates session belongs to user
   b. Server-side validates outcome (not trusting client score)
   c. Evaluates RewardCampaign for GAME_COMPLETED event
   d. If reward granted: calls WalletService.credit(coinsAmount, GAME_REWARD)
   e. WalletService creates WalletTransaction with idempotencyKey
   f. Updates GameSession { status: REWARDED, rewardDecision: {...} }
   g. Triggers notification via NotificationService
8. Response: { reward: { coins: 50, message: "You won 50 coins!" } }
9. Frontend shows reward animation and updates wallet balance display
```
