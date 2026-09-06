# 46. Backup & Recovery

## Database Backups (Supabase)

### Automatic Backups
Supabase provides automatic daily backups on Pro and above plans:
- **Free tier:** 7-day point-in-time recovery (limited)
- **Pro tier:** Point-in-time recovery (PITR) up to 30 days
- Backups are stored in Supabase's infrastructure (separate from your data)

### Manual Backup Before Risky Operations
Before any schema change (`db push`) or bulk data operation:

```bash
# Export via pg_dump (use Supabase connection string)
pg_dump "postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres" \
  --format=custom \
  --no-acl \
  --no-owner \
  -f backup-$(date +%Y%m%d-%H%M).dump
```

Or use Supabase Dashboard → Database → Backups → "Create backup" button.

### Restoring from Backup

```bash
# Restore from custom format dump
pg_restore \
  --no-owner \
  --no-acl \
  -d "postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres" \
  backup-20260906-1200.dump
```

> ⚠️ Restoring will OVERWRITE current data. Only restore to a dev/staging database unless recovering from a production incident.

---

## Redis Backup

Redis is used for ephemeral state (cache, sessions, queues). Data loss here is acceptable — the impact is:
- Active dashboard sessions invalidated (users must re-login)
- Wallet balance cache cleared (next request hits DB)
- BullMQ jobs in `waiting` state lost (pending emails/SMS not sent)

For production, use a managed Redis with persistence (AOF or RDB snapshots):
- **Upstash:** Automatic persistence, no config needed
- **Redis Cloud:** Persistence enabled in cluster config
- **Self-hosted:** Enable `appendonly yes` in `redis.conf`

---

## Code Backups

All code is in git. Regular pushes to the remote origin provide versioned history.

```bash
# Verify remote is set
git remote -v

# Tag before a major release
git tag -a v1.0.0 -m "Production release 1.0.0"
git push origin v1.0.0
```

---

## Recovery Scenarios

### Scenario: Server crashes

```
1. Check health endpoint from another machine
2. SSH into server
3. pm2 restart greenchillyz-api
4. Verify: GET /api/v1/health → { status: "ok" }
```

### Scenario: Bad schema change breaks queries

```
1. Identify what changed (git diff server/prisma/schema.prisma)
2. Revert the schema change in git
3. bunx prisma db push  ← re-apply the reverted schema
4. If data was lost: restore from Supabase backup
```

### Scenario: Redis connection lost

```
1. Application continues — falls back to database for cache misses
2. Active dashboard sessions are lost — users must re-login
3. Restart Redis or fix connection
4. Sessions rebuild on next login
```

### Scenario: BullMQ jobs lost

```
1. Any jobs in "waiting" or "active" state at time of crash are lost
2. Identify which operations were queued (check audit logs for initiated-but-not-completed actions)
3. Manually trigger missed operations if critical (e.g., re-run coin expiry)
```

### Scenario: Accidental data deletion

```
1. Identify affected records and approximate time
2. Use Supabase PITR to restore to a point before deletion
3. If restoring entire database is not feasible:
   a. Export specific table from backup
   b. Import only affected rows with INSERT ... ON CONFLICT DO NOTHING
```

---

## Disaster Recovery Priorities

| Priority | Data | Recovery Target |
|---|---|---|
| 1 | Wallet balances + transactions | < 1 hour |
| 2 | User accounts | < 1 hour |
| 3 | Reward redemptions | < 2 hours |
| 4 | Store data | < 4 hours |
| 5 | Audit logs | < 24 hours |
| 6 | Dashboard sessions | Best effort (users re-login) |
| 7 | Redis cache | Self-healing (auto-rebuilds) |

---

## Environment Recovery

Keep a secure copy of all production env vars in a password manager or secrets vault (1Password, HashiCorp Vault, AWS Secrets Manager). If the server is lost and re-provisioned, the env vars are needed to reconnect to Supabase, Redis, and all integrations.

Never store env vars in the git repository.
