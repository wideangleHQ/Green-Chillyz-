# 29. Environment Variables

All server variables are validated at startup via Joi (`server/src/config/env.validation.ts`). Missing required variables abort boot with a clear error.

---

## Server (`server/.env`)

### Required — will crash on missing

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string | `postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres` |
| `JWT_SECRET` | Customer access token signing key | 64+ char random string |
| `JWT_REFRESH_SECRET` | Customer refresh token signing key | 64+ char random string (different from JWT_SECRET) |
| `DASHBOARD_JWT_SECRET` | Dashboard access token signing key | 64+ char random string |
| `DASHBOARD_JWT_REFRESH_SECRET` | Dashboard refresh token signing key | 64+ char random string |
| `DASHBOARD_CODE_PEPPER` | HMAC key for store code blind index | 32+ char random string |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret (from dashboard) | Found in Supabase > Settings > API |

### Optional — features degrade gracefully if absent

**Storage (Cloudflare R2)**
| Variable | Description |
|---|---|
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API key ID |
| `R2_SECRET_ACCESS_KEY` | R2 API secret |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | Public URL base for assets |

**Email (SMTP)**
| Variable | Description |
|---|---|
| `MAIL_HOST` | SMTP host |
| `MAIL_PORT` | SMTP port (default: 587) |
| `MAIL_USER` | SMTP username |
| `MAIL_PASS` | SMTP password |
| `MAIL_FROM` | Sender address |

**SMS**
| Variable | Description |
|---|---|
| `SMS_PROVIDER` | Provider identifier |
| `SMS_API_KEY` | Provider API key |
| `SMS_FROM` | Sender number/name |

**Push Notifications**
| Variable | Description |
|---|---|
| `PUSH_FCM_SERVER_KEY` | Firebase Cloud Messaging server key |

**Redis**
| Variable | Default | Description |
|---|---|---|
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | — | Redis auth password |

**Rate Limiting**
| Variable | Default | Description |
|---|---|---|
| `THROTTLE_TTL` | `60` | Window in seconds |
| `THROTTLE_LIMIT` | `60` | Max requests per window |

**Dashboard Security**
| Variable | Default | Description |
|---|---|---|
| `DASHBOARD_MAX_FAILED_ATTEMPTS` | `5` | Login attempts before lockout |
| `DASHBOARD_LOCK_DURATION_MINUTES` | `15` | Lockout duration |
| `DASHBOARD_LOGIN_RATE_LIMIT_MAX_ATTEMPTS` | — | Rate limit for login endpoint |
| `DASHBOARD_LOGIN_RATE_LIMIT_WINDOW_SECONDS` | — | Rate limit window |

**CORS**
| Variable | Description |
|---|---|
| `APP_CORS_ORIGINS` | Comma-separated allowed origins in production |

**App**
| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Server port |
| `NODE_ENV` | `development` | Enables Swagger when not `production` |

---

## Client (`client/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (`http://localhost:4000/api/v1`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (for Google OAuth) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe to expose) |

---

## Dashboard (`dashboard/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (`http://localhost:4000/api/v1`) |

The dashboard has no Supabase dependency (no Google OAuth on the franchise side).

---

## Secret Generation

```bash
# Generate a secure random 64-char hex string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or with openssl
openssl rand -hex 32
```

Each of `JWT_SECRET`, `JWT_REFRESH_SECRET`, `DASHBOARD_JWT_SECRET`, `DASHBOARD_JWT_REFRESH_SECRET`, and `DASHBOARD_CODE_PEPPER` must be **unique** — never share the same value across different keys.
