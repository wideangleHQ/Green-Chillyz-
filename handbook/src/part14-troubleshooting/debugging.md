# 34. Debugging Workflow

## Backend Debugging

### Step 1 — Check logs

The server runs with `LoggingInterceptor` which logs every request. In dev mode:
```bash
cd server && bun run start:dev
# Watch output for:
# [Nest] LOG [Request] GET /api/v1/auth/me - 200 - 12ms
# [Nest] ERROR [ExceptionFilter] { code: "...", message: "..." }
```

### Step 2 — Isolate with Swagger

Swagger UI at `http://localhost:4000/api/docs` lets you test endpoints without a frontend. Use it to:
- Check exact request/response shapes
- Verify auth (add cookie manually in Swagger UI)
- Rule out frontend vs backend bugs

### Step 3 — Prisma Studio

```bash
cd server && bunx prisma studio
# http://localhost:5555
```

Use Prisma Studio to:
- Inspect database records directly
- Verify that writes are persisting
- Check relationships (e.g., WalletTransaction ↔ Wallet)

### Step 4 — Redis inspection

```bash
redis-cli

# List all keys
keys *

# Check a specific wallet balance cache
get wallet:balance:<userId>

# Check a dashboard session
get dashboard:session:<sessionId>

# Monitor all commands in real-time
monitor
```

### Step 5 — Add temporary debug logging

```typescript
// In a NestJS service
import { Logger } from '@nestjs/common';
private readonly logger = new Logger(MyService.name);

this.logger.debug('wallet credit attempt', { userId, amount, idempotencyKey });
```

Remove debug logs before committing.

---

## Frontend Debugging

### Network tab first
Open DevTools → Network and reproduce the issue. Look for:
- **401/403** → auth problem (cookie not sent, token expired)
- **400** → request body validation failed (check `error.details` in response)
- **500** → server error (check server logs)
- **CORS error** → check `APP_CORS_ORIGINS` on server, `credentials: 'include'` on client

### React Query DevTools
If `@tanstack/react-query` DevTools are installed (dev only), open them to inspect:
- Which queries are stale/loading/error
- Cached data vs fresh data
- Query invalidation

### Animation debugging
```javascript
// In browser console — check if GSAP ScrollTrigger is initialized
ScrollTrigger.getAll().forEach(t => console.log(t.trigger, t.start, t.end));

// Check Lenis scroll state
window.lenis?.scroll  // current scroll position
```

---

## Diagnosing Auth Issues

### Cookie flow check
1. Open DevTools → Application → Cookies → `localhost`
2. Look for `gc_access_token` and `gc_refresh_token`
3. If missing: login endpoint is not setting cookies (check CORS + `credentials: true`)
4. If present but expired: refresh flow is not running

### JWT debugging
```bash
# Decode JWT (without verification) to inspect payload
node -e "
const token = 'your.jwt.token';
const [, payload] = token.split('.');
console.log(JSON.parse(Buffer.from(payload, 'base64url').toString()));
"
```

A valid customer JWT payload looks like:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "roles": ["CUSTOMER"],
  "iat": 1234567890,
  "exp": 1234568790
}
```

---

## Diagnosing Wallet / Transaction Issues

### Transaction trace
```sql
-- In Prisma Studio or Supabase SQL editor
SELECT * FROM "WalletTransaction"
WHERE "walletId" = '<wallet-id>'
ORDER BY "createdAt" DESC
LIMIT 20;
```

Verify `balance` on `Wallet` matches the sum:
```sql
SELECT SUM(amount) FROM "WalletTransaction"
WHERE "walletId" = '<wallet-id>'
AND "type" = 'CREDIT'
MINUS
SELECT SUM(amount) FROM "WalletTransaction"
WHERE "walletId" = '<wallet-id>'
AND "type" IN ('DEBIT', 'EXPIRE');
```

---

## Tracing a Request End-to-End

Every request gets a `x-request-id` header (injected by middleware). Use it to correlate logs:

```
Client request → [x-request-id: abc-123]
Server log: [abc-123] POST /api/v1/games/sessions/end → 200 (45ms)
```

In production, ship logs to a log aggregator (Datadog, Logtail, etc.) and query by `requestId`.
