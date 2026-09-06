# 24. API Reference

All endpoints are under `/api/v1/`. Auth status: 🔓 Public, 🔒 Customer JWT, 🏪 Dashboard JWT.

---

## Authentication (`/auth`)

| Method | Route | Auth | Purpose |
|---|---|:---:|---|
| POST | `/auth/register` | 🔓 | Register with email + password |
| POST | `/auth/login` | 🔓 | Login with email/username + password |
| POST | `/auth/google` | 🔓 | Authenticate via Google (Supabase token) |
| POST | `/auth/refresh` | 🔓 | Refresh access token |
| POST | `/auth/logout` | 🔒 | Logout current session |
| POST | `/auth/logout-all` | 🔒 | Logout all sessions |
| GET  | `/auth/me` | 🔒 | Get current user profile |
| PATCH | `/auth/profile` | 🔒 | Update profile |
| GET  | `/auth/devices` | 🔒 | List authenticated devices |
| DELETE | `/auth/devices/:id` | 🔒 | Remove device + revoke tokens |
| POST | `/auth/request-otp` | 🔓 | Request OTP code |
| POST | `/auth/verify-otp` | 🔓 | Verify OTP code |

### Register
```
POST /api/v1/auth/register
Body: {
  fullName: string,       // required
  username: string,       // optional, unique
  email: string,          // required, unique
  password: string        // required
}
Response: { user: { id, email, fullName }, message: 'Registration successful' }
Sets: gc_access_token, gc_refresh_token cookies
```

### Login
```
POST /api/v1/auth/login
Body: {
  identifier: string,     // email or username
  password: string
}
Response: { user: { id, email, fullName } }
Sets: gc_access_token, gc_refresh_token cookies
```

---

## Wallet (`/wallet`)

| Method | Route | Auth | Purpose |
|---|---|:---:|---|
| GET | `/wallet/me` | 🔒 | My wallet summary |
| GET | `/wallet/me/balance` | 🔒 | My current balance |
| GET | `/wallet/me/transactions` | 🔒 | My transaction history |
| GET | `/wallet/user/:userId` | 🔒 Admin | Any user's wallet |
| GET | `/wallet/user/:userId/transactions` | 🔒 Admin | Any user's transactions |
| POST | `/wallet/credit` | 🔒 Admin | Credit coins |
| POST | `/wallet/debit` | 🔒 Admin | Debit coins |
| POST | `/wallet/expire` | 🔒 Admin | Run coin expiry |

### Get Balance
```
GET /api/v1/wallet/me/balance
Response: { balance: "150.00", currency: "coins" }
```

### Get Transaction History
```
GET /api/v1/wallet/me/transactions?page=1&limit=20&type=CREDIT
Query: page, limit, type (CREDIT|DEBIT|EXPIRE|...), source
Response: { items: [...WalletTransaction], total, page, limit }
```

---

## Games (`/games`)

| Method | Route | Auth | Purpose |
|---|---|:---:|---|
| GET | `/games` | 🔒 | List active games |
| GET | `/games/:idOrSlug` | 🔒 | Game detail |
| GET | `/games/:id/leaderboard` | 🔒 | Game leaderboard |
| POST | `/games/sessions/start` | 🔒 | Start game session |
| POST | `/games/sessions/end` | 🔒 | End session + claim reward |
| GET | `/games/sessions/me` | 🔒 | My session history |
| GET | `/games/sessions/:id` | 🔒 | Session detail |
| POST | `/games` | 🔒 Admin | Create game config |
| PATCH | `/games/:id` | 🔒 Admin | Update game config |
| DELETE | `/games/:id` | 🔒 Admin | Delete game |
| GET | `/games/:id/stats` | 🔒 Admin | Game analytics |

### Start Game Session
```
POST /api/v1/games/sessions/start
Body: { gameId: "uuid" }
Response: { sessionId: "uuid", status: "STARTED", game: { name, dailyLimit, cooldown } }
```

### End Game Session
```
POST /api/v1/games/sessions/end
Body: { sessionId: "uuid", score: 850 }
Response: { 
  session: { status: "REWARDED" },
  reward: { granted: true, coins: 50, message: "You won 50 coins!" }
}
```

---

## Stores (`/stores`)

| Method | Route | Auth | Purpose |
|---|---|:---:|---|
| GET | `/stores` | 🔓 | List active stores |
| GET | `/stores/nearby` | 🔓 | Geo-sorted nearby stores |
| GET | `/stores/:idOrSlug` | 🔓 | Store detail |
| POST | `/stores` | 🔒 Admin | Create store |
| PATCH | `/stores/:id` | 🔒 Admin | Update store |
| DELETE | `/stores/:id` | 🔒 Admin | Soft-delete store |
| GET | `/stores/:id/gallery` | 🔓 | Gallery images |
| PUT | `/stores/:id/timings` | 🔒 | Update timings |
| GET | `/stores/:id/holidays` | 🔓 | Holiday closures |

### Nearby Stores
```
GET /api/v1/stores/nearby?latitude=20.296&longitude=85.824&radius=10
Response: { items: [...Store with distance], sorted by distance }
```

---

## Rewards (`/rewards`)

| Method | Route | Auth | Purpose |
|---|---|:---:|---|
| GET | `/rewards` | 🔓 | List published rewards |
| GET | `/rewards/:idOrSlug` | 🔓 | Reward detail |
| POST | `/rewards/:id/redeem` | 🔒 | Redeem reward |
| GET | `/rewards/redemptions/me` | 🔒 | My redemption history |
| GET | `/rewards/vouchers/me` | 🔒 | My active vouchers |

---

## Dashboard Auth (`/dashboard/auth`)

| Method | Route | Auth | Purpose |
|---|---|:---:|---|
| POST | `/dashboard/auth/login` | 🔓 | Store login with access code |
| POST | `/dashboard/auth/refresh` | 🏪 | Refresh dashboard tokens |
| POST | `/dashboard/auth/logout` | 🏪 | Logout current session |
| GET | `/dashboard/auth/me` | 🏪 | Current store context |
| GET | `/dashboard/auth/sessions` | 🏪 | List active sessions |
| DELETE | `/dashboard/auth/sessions/:id` | 🏪 | Revoke a session |

### Dashboard Login
```
POST /api/v1/dashboard/auth/login
Body: { storeCode: "GC-XXXX0000" }
Response: {
  store: { id, name, slug, brand: { name, slug } },
  session: { id, expiresAt }
}
Sets: gc_dashboard_access_token, gc_dashboard_refresh_token cookies
```

---

## Health

```
GET /api/v1/health
Response: { status: "ok", database: "up", redis: "up" }
```
