# 28. Local Development Setup

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Bun | >= 1.0 | `npm install -g bun` or https://bun.sh |
| Node.js | >= 20 LTS | https://nodejs.org |
| PostgreSQL | via Supabase | Remote — no local install needed |
| Redis | >= 7 | Local or Docker |
| Rust + mdBook | mdBook 0.5.x | `cargo install mdbook` |

> **Runtime:** The server uses Bun as its runtime, not Node.js directly. All `server/` commands should be run with `bun` or `bun run`.

---

## Step 1 — Clone and Install

```bash
git clone <repo-url>
cd "Green Chillyz"

# Install all workspaces
bun install          # server
cd client && npm install
cd ../dashboard && npm install
```

---

## Step 2 — Environment Variables

Copy environment templates and fill in values:

```bash
# Server
cp server/.env.example server/.env

# Client
cp client/.env.local.example client/.env.local

# Dashboard
cp dashboard/.env.local.example dashboard/.env.local
```

> If `.env.example` files don't exist, see [Section 29 — Environment Variables](environment-variables.md) for the full list of required variables.

---

## Step 3 — Database Setup

The project uses Supabase (remote PostgreSQL). Connect via the `DATABASE_URL` from your Supabase project settings.

```bash
cd server

# Push schema to database (NEVER use migrate dev)
bunx prisma db push

# Generate Prisma client
bunx prisma generate
```

> ⚠️ **Do NOT run `prisma migrate dev` or `prisma migrate reset`.** The migration history is stale. Use `db push` only. See [Section 29](environment-variables.md) for details.

To inspect the database:
```bash
bunx prisma studio
# Opens Prisma Studio at http://localhost:5555
```

---

## Step 4 — Start Redis

```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or local Redis (if installed)
redis-server
```

---

## Step 5 — Start Services

Open three terminal windows:

**Terminal 1 — Backend Server (port 4000)**
```bash
cd server
bun run start:dev
```

**Terminal 2 — Customer Frontend (port 5000)**
```bash
cd client
npm run dev
```

**Terminal 3 — Franchise Dashboard (port 5100)**
```bash
cd dashboard
npm run dev
```

---

## Verify Setup

| Service | URL | Expected |
|---|---|---|
| Backend API | http://localhost:4000/api/v1/health | `{ status: "ok" }` |
| Backend Swagger | http://localhost:4000/api/docs | Interactive API docs |
| Customer site | http://localhost:5000 | Homepage with animations |
| Dashboard | http://localhost:5100 | Redirects to `/login` |
| Prisma Studio | http://localhost:5555 | DB browser (run separately) |

---

## Handbook (mdBook)

```bash
cd handbook
mdbook serve --open
# Opens at http://localhost:3000
```

---

## Common First-Run Issues

**Prisma client not generated:**
```bash
cd server && bunx prisma generate
```

**Redis connection refused:**
```bash
# Check Redis is running
redis-cli ping
# Should respond: PONG
```

**PORT already in use:**
```bash
# Client is port 5000 — check for conflicts
netstat -ano | findstr :5000
```

**Missing env var crash at startup:**
The server validates all required env vars on boot via Joi. The error message will name the missing variable. Check [Section 29](environment-variables.md).
