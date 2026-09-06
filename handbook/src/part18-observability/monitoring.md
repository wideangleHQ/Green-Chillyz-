# 45. Monitoring

## Health Check

The primary monitoring endpoint:

```
GET /api/v1/health
Response:
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  },
  "error": {},
  "details": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

Uses `@nestjs/terminus` (HealthModule). Configure your load balancer or uptime monitor to hit this every 30 seconds.

---

## Key Metrics to Monitor

### Server

| Metric | Alert Threshold | Tool |
|---|---|---|
| HTTP response time (p95) | > 500ms | APM |
| HTTP error rate (5xx) | > 1% | APM |
| Health check failure | Any failure | Uptime monitor |
| Memory usage | > 80% | System monitor |
| Event loop lag | > 100ms | Node.js APM |

### Database (Supabase)

| Metric | Alert Threshold |
|---|---|
| Connection pool exhaustion | Pool > 80% full |
| Slow queries (> 1s) | Any |
| Row count approaching limits | > 80% of Supabase plan limit |

### Redis

| Metric | Alert Threshold |
|---|---|
| Memory usage | > 80% |
| Connection errors | Any |
| Cache hit rate | < 70% (investigate if sustained) |

### BullMQ Queues

| Metric | Alert Threshold |
|---|---|
| Failed jobs | > 10 in 5 minutes |
| Queue depth | > 1000 jobs waiting |
| Job processing time | > 60s for any job |

---

## Logging

The server uses `LoggingInterceptor` which logs every request:

```
[2026-09-06T12:00:00Z] [INFO] [LoggingInterceptor] 
  POST /api/v1/games/sessions/end 200 45ms | userId=xxx | x-request-id=abc-123
```

### Log to external service (production)

Recommended: ship stdout logs to a log aggregator.

**Options:**
- **Datadog** — full APM + logs + metrics
- **Logtail (Better Stack)** — affordable, searchable logs
- **Grafana Loki** — self-hosted, free

Configure via environment:
```bash
# If using Datadog APM
DD_API_KEY=...
DD_SERVICE=greenchillyz-api
DD_ENV=production
```

---

## Tracing

Every request has a `x-request-id` header (UUID, injected by middleware). Use it to:
1. Correlate logs for a single request across multiple log lines
2. Debug issues reported by users ("my request ID was abc-123")
3. Link frontend errors to backend logs

---

## Uptime Monitoring

Set up external uptime monitoring for:

| URL | Check Interval |
|---|---|
| `https://api.greenchillyz.com/api/v1/health` | 30s |
| `https://greenchillyz.com` | 60s |
| `https://dashboard.greenchillyz.com` | 60s |

**Tools:** BetterStack, Uptime Robot, Pingdom, or Grafana Cloud.

---

## Error Tracking

The `GlobalExceptionFilter` catches all unhandled exceptions. In production, integrate error tracking:

```typescript
// Install Sentry
import * as Sentry from '@sentry/node';

// In main.ts
Sentry.init({ dsn: process.env.SENTRY_DSN });

// In GlobalExceptionFilter
Sentry.captureException(exception);
```

Sentry provides:
- Error grouping by stack trace
- User context (userId from JWT)
- Request context (URL, method, body)
- Release tracking

---

## Coin Economy Monitoring

Critical business metrics:

| Metric | How to Check | Alert If |
|---|---|---|
| Coins issued today | `SELECT SUM(amount) FROM WalletTransaction WHERE type='CREDIT' AND date=today` | Unusually high (possible exploit) |
| Coins redeemed today | Same for DEBIT | 0 for days (redemption broken?) |
| Expired coins today | WalletTransaction.type = EXPIRE | Expiry cron not running |
| Balance consistency | `Wallet.balance` vs `SUM(transactions)` | Any mismatch |

Run balance consistency check weekly:
```sql
SELECT w.id, w.balance, SUM(CASE WHEN wt.type = 'CREDIT' THEN wt.amount ELSE -wt.amount END) as calculated
FROM "Wallet" w
LEFT JOIN "WalletTransaction" wt ON wt."walletId" = w.id
GROUP BY w.id, w.balance
HAVING w.balance != SUM(CASE WHEN wt.type = 'CREDIT' THEN wt.amount ELSE -wt.amount END);
```
