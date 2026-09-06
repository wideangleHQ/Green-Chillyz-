# 51. Frequently Asked Questions

## Development Questions

**Q: Why can't I run `prisma migrate dev`?**  
The migration history in `server/prisma/migrations/` is stale and does not reflect the actual database schema. Running `migrate dev` would fail or corrupt the migration state. Always use `bunx prisma db push` to sync schema changes.

**Q: The server crashes on startup with "is required" — what's wrong?**  
A required environment variable is missing from `server/.env`. The Joi validation schema in `env.validation.ts` enforces all required vars at boot. Check [Section 29](../part12-deployment/environment-variables.md) for the full list.

**Q: Why are there two completely separate auth systems?**  
Customer auth (`gc_access_token`) and franchise dashboard auth (`gc_dashboard_access_token`) are deliberately isolated. A franchise operator should never be able to access customer data, and a customer should never be able to access franchise operations. Two separate JWT secret pairs, two separate cookie names, two separate session tables.

**Q: Where is the Swagger UI?**  
`http://localhost:4000/api/docs` — only available when `NODE_ENV` is not `production`.

**Q: How do I test wallet operations without real coins?**  
Use the admin credit endpoint: `POST /api/v1/wallet/credit`. You need an admin-role JWT. In development, assign a user the SUPER_ADMIN role via Prisma Studio (add a `UserRole` record), then log in as that user to get an admin-capable JWT.

---

## Architecture Questions

**Q: Why does the frontend use Cloudflare R2 instead of Cloudinary?**  
The original design doc specified Cloudinary, but the actual implementation uses Cloudflare R2 (S3-compatible). R2 has no egress fees, which is cost-effective at scale. This is a documented difference. See [Section 48 — Known Gaps](../part19-status/known-gaps.md).

**Q: What fonts does the site actually use?**  
Anton, Manrope, and Space Grotesk. The design spec says Poppins, but the code loads different fonts. See `client/app/layout.tsx`.

**Q: Why is `WalletCacheService` a separate class from `WalletService`?**  
Separation of concerns — the cache layer is isolated so it can be tested, replaced, or bypassed independently. This pattern appears across the codebase (e.g., `StoreCacheService`).

**Q: Why does `Wallet.balance` exist if all transactions are recorded?**  
Denormalization for performance. Reading balance = a single row read from `Wallet` rather than `SUM()` across potentially thousands of `WalletTransaction` rows. The denormalized balance is updated atomically with every credit/debit using Prisma transactions.

**Q: What happens if the same game session is submitted twice?**  
The `GameSession.status` is set to `REWARDED` on the first successful submission. A second submission for the same `sessionId` is rejected because the session is no longer in `STARTED` status.

---

## Operations Questions

**Q: A franchise operator forgot their access code. How do we recover it?**  
The plaintext code is encrypted in `Store.dashboardCodeEncrypted` (AES-256-GCM). An admin decrypts it using `DASHBOARD_CODE_SECRET`. Alternatively, generate a new code via `PATCH /api/v1/dashboard/stores/:id { dashboardCode: "GC-NEW0001" }`.

**Q: How do I add a new outlet?**  
See [Section 39 — New Outlet](../part16-howto/new-outlet.md) for the full step-by-step process.

**Q: Why is the menu not showing on the website?**  
The `MenuCategory` and `MenuItem` tables are defined in the schema but are marked "NOT YET MIGRATED." They may not exist in the production database. Run `bunx prisma db push` on a dev database first to verify, then coordinate a production migration.

**Q: How do I trigger coin expiry?**  
`POST /api/v1/wallet/expire` with admin credentials. This should be set up as a scheduled cron job (daily) in production. The endpoint triggers a BullMQ job that processes expired transactions.

---

## Game Questions

**Q: What prevents players from cheating by submitting high scores?**  
`Game.maxScore` — the server rejects any score above this value. Additionally, `dailyLimit` and `cooldownMinutes` limit frequency, and session status ensures a session can only be ended once.

**Q: How do I change how many coins a game awards?**  
Via `RewardCampaign` configuration. Create or update a campaign linked to the `gameId` with the desired `coinReward` rules per score bracket.

**Q: Can a game be paused/disabled?**  
Yes: `PATCH /api/v1/games/:id { isActive: false }`. The game will no longer appear in `GET /api/v1/games` and new sessions cannot be started.

---

## Customer Questions

**Q: A customer's balance looks wrong. How do I audit it?**  
1. Get the customer's `userId` from the admin customer endpoint
2. `GET /api/v1/wallet/user/:userId/transactions` (admin)
3. Check all transactions and verify `Wallet.balance` matches the sum
4. If inconsistent: check for concurrent transaction bugs (should not happen with idempotency keys)

**Q: How do we reset a customer's password if they're locked out?**  
Via the OTP flow: `POST /api/v1/auth/request-otp` (sends code to email), then `POST /api/v1/auth/verify-otp`. This does not require the current password.
