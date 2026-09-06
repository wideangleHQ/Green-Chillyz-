# 3. High-Level Architecture

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE CDN / WAF                     │
└──────────────────┬──────────────────────────┬───────────────────┘
                   │                          │
          ┌────────▼────────┐       ┌─────────▼─────────┐
          │  Public Website │       │ Franchise Dashboard│
          │  Next.js 16     │       │  Next.js 16        │
          │  greenchillyz.com│      │  dashboard.*       │
          │  [Vercel]       │       │  [Vercel]          │
          └────────┬────────┘       └─────────┬──────────┘
                   │                          │
                   │   HTTPS + HttpOnly Cookie│
                   └──────────┬───────────────┘
                              │
                   ┌──────────▼───────────────┐
                   │     NestJS Backend API    │
                   │     Bun runtime           │
                   │     api.greenchillyz.com  │
                   │     Port 4000 [Railway]   │
                   │                           │
                   │  ┌─────────────────────┐  │
                   │  │  Auth Module        │  │
                   │  │  Store Module       │  │
                   │  │  Wallet Module      │  │
                   │  │  Game Module        │  │
                   │  │  Reward Module(s)   │  │
                   │  │  Dashboard Auth     │  │
                   │  │  Notification       │  │
                   │  │  Audit              │  │
                   │  │  Menu               │  │
                   │  │  + 10 more modules  │  │
                   │  └─────────────────────┘  │
                   └──┬──────────────┬─────────┘
                      │              │
             ┌────────▼──────┐  ┌───▼────────────────┐
             │  PostgreSQL   │  │  Redis              │
             │  (Supabase)   │  │  (Upstash/Cloud)   │
             │  Primary DB   │  │  Cache + Queue      │
             └───────────────┘  └────────────────────┘
                      │
             ┌────────▼──────┐
             │ Cloudflare R2 │
             │  File Storage │
             │  (S3-compat.) │
             └───────────────┘
```

## Architecture Principles

### 1. Single Backend, Multiple Frontends
One NestJS API serves both `greenchillyz.com` (public) and `dashboard.greenchillyz.com` (franchise/admin). Route namespacing separates concerns:
- `/api/v1/auth/*` — customer authentication
- `/api/v1/dashboard/*` — dashboard-scoped endpoints
- `/api/v1/games/*`, `/api/v1/wallet/*`, etc. — customer features

### 2. Frontend Never Decides Business Logic
All personalization, coin calculations, reward eligibility, and game outcomes are computed server-side. The frontend only renders what the API returns. This keeps business rules auditable, testable, and centralised.

### 3. Redis as the Read Layer
PostgreSQL (Supabase) is write-optimised storage. Redis is the read-path for hot data: outlet caches, session tokens, wallet caches, and queue backing. Dashboard sessions live in Redis with a PostgreSQL durable backup.

### 4. Stateless API with Cookie-Based Auth
JWTs are stored in `HttpOnly` cookies (not `localStorage`), making them invisible to JavaScript and XSS-resistant. Both customer and dashboard auth follow this pattern with separate cookie names and secrets.

### 5. Queue-Backed Async Work
BullMQ (backed by Redis) handles asynchronous tasks: notification delivery, reward processing, coin expiry, and audit events. Heavy operations are never blocking in the request cycle.

## Network Boundaries

| Boundary | Method | Notes |
|---|---|---|
| Browser → Frontend | HTTPS | Vercel edge |
| Frontend → API | HTTPS + credentials: true | HttpOnly cookies cross-origin |
| API → Database | TCP/TLS | Supabase connection pooling |
| API → Redis | TCP/TLS | ioredis client |
| API → R2 Storage | HTTPS (AWS SDK) | Presigned URLs for client uploads |
| API → Mail | SMTP | Configurable MAIL_* env vars |
| API → SMS | HTTP | SMS_PROVIDER env var |
