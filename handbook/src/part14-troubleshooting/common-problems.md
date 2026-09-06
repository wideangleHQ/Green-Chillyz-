# 33. Common Problems

## Server Won't Start

### Missing env var
```
Error: Config validation error: "DATABASE_URL" is required
```
**Fix:** Add the missing variable to `server/.env`. See [Section 29](../part12-deployment/environment-variables.md).

### Prisma client not generated
```
Error: Cannot find module '@prisma/client'
```
**Fix:**
```bash
cd server && bunx prisma generate
```

### Redis connection refused
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Fix:** Start Redis before the server.
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### Port already in use
```
Error: listen EADDRINUSE: address already in use :::4000
```
**Fix:**
```bash
# Find and kill the process
netstat -ano | findstr :4000
taskkill /PID <pid> /F
```

---

## Database Issues

### Schema out of sync
```
Error: The column `User.newField` does not exist in the current database
```
**Fix:**
```bash
cd server && bunx prisma db push
```

### "Table does not exist" for menu tables
This is expected — menu models are defined in the schema but marked "NOT YET MIGRATED." The `MenuCategory` and `MenuItem` tables may not exist in the database. Do not `db push` blindly if this causes issues on a shared database — check with the team first.

### Prisma migration conflict
If you accidentally ran `migrate dev`, the migrations table may be in a bad state.
**Fix:** Do not attempt `migrate resolve` without understanding what happened. Check with the team. The safest recovery is `db push --force-reset` on a **dev-only** database (destroys all data).

---

## Authentication Issues

### "Unauthorized" on all requests
- Check that the `gc_access_token` cookie is being sent (browser DevTools → Application → Cookies)
- Cookies require `credentials: 'include'` in fetch requests
- Verify CORS config allows the origin sending the request

### Refresh token rejected (token burn triggered)
If a user suddenly gets logged out everywhere, a token family was burned (reuse detection). The user must log in again. This is expected security behavior.

### Dashboard cookie not working for customer endpoints
This is intentional — the auth stacks are completely isolated. Use the customer login endpoint to get a customer token.

---

## Frontend Issues

### Next.js 16 build error
```
Error: The "appDir" option has been removed...
```
Next.js 16 requires configuration changes from earlier versions. See [Section 12 — Frontend Architecture](../part2-architecture/frontend-architecture.md) for breaking change details.

### Animation stutter / layout shift
- Verify `lenis` is initialized only once (in `SmoothScroll` component)
- GSAP ScrollTrigger must be registered after DOM is ready — check for SSR/client boundary issues
- Wrap GSAP code in `useEffect` or use `useLayoutEffect` with proper cleanup

### Font not loading (Space Grotesk)
- Requires internet connection (served from Google Fonts)
- If offline development, use a fallback font in CSS: `font-family: 'Space Grotesk', sans-serif`

---

## Game / Wallet Issues

### Game session rejected: "daily limit reached"
Expected behavior — the customer has already played this game today. Check `GameSession` records for that user and `gameId`.

### Wallet balance mismatch
If `Wallet.balance` doesn't match `SUM(WalletTransaction.amount)`, there is a denormalization bug. This requires investigation — do not manually update the balance. Check recent transactions for the wallet.

### Idempotency key rejected
If the server returns a conflict on a credit/debit request, the idempotency key was already used. Generate a new unique key per operation.

---

## BullMQ / Queue Issues

### Jobs stuck in queue
```bash
# Check Redis for queue state
redis-cli keys "bull:*"
```

Jobs stuck in `waiting` state usually mean:
1. The worker process died — restart the server
2. Redis disconnected mid-job — jobs auto-retry based on queue config

### Email not sending
If `MAIL_HOST` is not configured, email is a no-op. Check:
1. `MAIL_HOST` is set in `.env`
2. SMTP credentials are correct
3. BullMQ `MailQueue` worker is running (part of the main server process)
