# 25. Third-Party Integrations

## Integration Overview

| Service | Purpose | Status | Required |
|---|---|---|:---:|
| Supabase | PostgreSQL hosting + Google OAuth | ✅ Active | Yes |
| Cloudflare R2 | Object storage (images, media) | ✅ Active | Optional |
| Redis (ioredis) | Cache + session store + BullMQ | ✅ Active | Yes |
| BullMQ | Background job queue | ✅ Active | Yes |
| Nodemailer / SMTP | Transactional email | 🔶 Partial | Optional |
| SMS provider | OTP + notifications | 🔶 Partial | Optional |
| Push notifications | FCM or similar | 🔶 Partial | Optional |
| Mapbox | Interactive map (LocationsSection) | 📋 Planned | No |

---

## Supabase

**Role:** Managed PostgreSQL database + Google OAuth provider

### Database Connection
```
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```
Prisma connects via the `DATABASE_URL` env var. Connection pooling is via Supabase's built-in PgBouncer (use `?pgbouncer=true&connection_limit=1` for serverless — not required for NestJS server which holds a connection pool).

### Google OAuth
```
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_JWT_SECRET=[jwt-secret-from-supabase-dashboard]
```

**Flow:**
1. Client app calls Supabase Auth JS SDK to get a Google access token
2. Token sent to `POST /api/v1/auth/google`
3. Server verifies token with `SUPABASE_JWT_SECRET` (not Google directly)
4. Server creates/fetches the `User` record and issues its own `gc_access_token`

Supabase is NOT used for session management in the server — only as an identity verifier for the Google OAuth flow.

---

## Cloudflare R2

**Role:** S3-compatible object storage for images and media

```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=https://[bucket].[account].r2.cloudflarestorage.com
```

> ⚠️ **DIFFERS FROM PLAN:** Original design doc mentioned Cloudinary. The implemented system uses Cloudflare R2 (S3-compatible). All storage SDK calls use `@aws-sdk/client-s3` with R2 endpoint.

All env vars are optional — if not set, media upload features are disabled but the server starts normally.

The `R2_PUBLIC_URL` is the base URL used to construct public asset URLs returned in API responses. Images are stored in R2 and served from Cloudflare's CDN.

---

## Redis

**Role:** Multi-purpose in-memory store

```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

Redis is used for:

| Use Case | Key Pattern | TTL |
|---|---|---|
| Dashboard session cache | `dashboard:session:{sessionId}` | 15 min |
| Customer auth session | `session:{userId}:{tokenId}` | Varies |
| Store data cache | `store:cache:{storeId}` | 30 min |
| Wallet balance cache | `wallet:balance:{userId}` | 5 min |
| Homepage cache | `homepage:outlet:{id}` | 30 min (planned) |
| BullMQ job queue | `bull:{queueName}:*` | By job config |

Connection is managed by `ioredis` via the `RedisModule` (wraps ioredis). Both the caching layer and BullMQ share the same Redis instance by default.

---

## BullMQ

**Role:** Background job queue for async processing

BullMQ runs on Redis and handles:
- Coin expiry jobs (scheduled via cron queue)
- Email sending (via `MailQueue`)
- SMS sending
- Push notification dispatch
- Any async reward processing

Queues are defined per module (e.g., `WalletQueue`, `NotificationQueue`). Workers run in the same NestJS process.

---

## Email (SMTP/Nodemailer)

```
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=
MAIL_PASS=
MAIL_FROM=noreply@greenchillyz.com
```

If `MAIL_HOST` is not set, email sending is a no-op (logged but not sent). Email is sent via BullMQ jobs — the HTTP request returns immediately and email delivery is async.

**Email triggers (designed, not all fully implemented):**
- Welcome email on registration
- OTP delivery
- Password reset
- Reward expiry reminder

---

## SMS

```
SMS_PROVIDER=
SMS_API_KEY=
SMS_FROM=
```

SMS integration is provider-agnostic — the SMS service accepts any provider configured via env vars. Used for OTP delivery as a fallback to email.

---

## Push Notifications

```
PUSH_FCM_SERVER_KEY=
```

FCM (Firebase Cloud Messaging) is the designed push provider. The `NotificationModule` handles fan-out. Customers can register device tokens via the notification preferences endpoints.
