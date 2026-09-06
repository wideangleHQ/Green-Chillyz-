# 30. Production Deployment

## Architecture Target

```
Customer: greenchillyz.com          → Vercel (client/)
Dashboard: dashboard.greenchillyz.com → Vercel (dashboard/)
API: api.greenchillyz.com           → VPS / Railway / Fly.io (server/)
Database: db.xxx.supabase.co        → Supabase
Cache: Redis                        → Upstash or managed Redis
Storage: r2.cloudflarestorage.com   → Cloudflare R2
```

---

## Backend Deployment

### Option A — VPS (PM2)

```bash
# On server
git pull origin main
cd server
bun install --frozen-lockfile
bunx prisma generate
bunx prisma db push    # NEVER migrate dev
bun run build
pm2 restart greenchillyz-api
```

PM2 ecosystem file (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'greenchillyz-api',
    script: 'bun',
    args: 'run start:prod',
    cwd: '/app/server',
    env: { NODE_ENV: 'production' },
    instances: 'max',
    exec_mode: 'cluster',
  }]
};
```

### Option B — Docker

```dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app
COPY server/package.json server/bun.lockb ./
RUN bun install --frozen-lockfile
COPY server/ .
RUN bunx prisma generate && bun run build

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
CMD ["bun", "run", "dist/main.js"]
```

### Option C — Railway / Fly.io

Both platforms support Bun natively. Deploy via git push or CLI.

---

## Frontend Deployment (Vercel)

### Customer Site

```bash
cd client
vercel --prod
# Set environment variables in Vercel dashboard
```

Required env vars in Vercel:
- `NEXT_PUBLIC_API_URL=https://api.greenchillyz.com/api/v1`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Dashboard

```bash
cd dashboard
vercel --prod
```

Required:
- `NEXT_PUBLIC_API_URL=https://api.greenchillyz.com/api/v1`

---

## Database Migration Safety

> ⚠️ **Critical rule — never use `migrate dev` or `migrate reset` in production.**

The migration history in `server/prisma/migrations/` is stale and does not reflect the actual database state.

**Safe deployment procedure:**
```bash
# 1. Review what will change
bunx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script

# 2. Apply changes
bunx prisma db push

# 3. Regenerate client
bunx prisma generate
```

For destructive changes (dropping columns, changing types): take a Supabase backup first.

---

## Health Check

Production health endpoint:
```
GET https://api.greenchillyz.com/api/v1/health
```

Expected response:
```json
{ "status": "ok", "database": "up", "redis": "up" }
```

Use this endpoint for load balancer health checks and uptime monitoring.

---

## Environment Variables Checklist

All required vars must be set before deployment. Missing vars cause startup failure (fail-fast by design — better than silent failures in production).

See [Section 29 — Environment Variables](environment-variables.md) for the full list.

---

## CORS in Production

Set `APP_CORS_ORIGINS` to your exact production origins:
```
APP_CORS_ORIGINS=https://greenchillyz.com,https://dashboard.greenchillyz.com
```

Do not include trailing slashes. Do not use wildcards (`*`) with `credentials: true` — browsers will reject the response.

---

## Redis in Production

Use a managed Redis service (Upstash is Redis-compatible, has a generous free tier):

```
REDIS_HOST=us1-xxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=<upstash-token>
```

Upstash uses TLS — if connection requires TLS, set `REDIS_TLS=true` (verify in `RedisModule` config).

---

## Deployment Checklist

- [ ] All required env vars set
- [ ] `prisma db push` run after schema changes
- [ ] `prisma generate` run after push
- [ ] `NODE_ENV=production` (disables Swagger)
- [ ] CORS origins match actual frontend domains
- [ ] Redis connection verified
- [ ] Health check endpoint returns `ok`
- [ ] Supabase backup taken before destructive schema changes
