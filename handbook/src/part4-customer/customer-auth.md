# 14. Customer Authentication

## Authentication Methods

| Method | Route | Status |
|---|---|---|
| Email + Password registration | `POST /api/v1/auth/register` | ✅ |
| Email + Password login | `POST /api/v1/auth/login` | ✅ |
| Google OAuth (via Supabase) | `POST /api/v1/auth/google` | ✅ |
| OTP request | `POST /api/v1/auth/request-otp` | ✅ |
| OTP verify | `POST /api/v1/auth/verify-otp` | ✅ |
| Token refresh | `POST /api/v1/auth/refresh` | ✅ |
| Logout | `POST /api/v1/auth/logout` | ✅ |
| Logout all sessions | `POST /api/v1/auth/logout-all` | ✅ |

## Token Architecture

Authentication uses **HttpOnly cookies** — JWT tokens are never accessible via JavaScript:

| Cookie | Name | Expiry | Contains |
|---|---|---|---|
| Access token | `gc_access_token` | 15 minutes | JWT with user sub, sessionId, roles |
| Refresh token | `gc_refresh_token` | 30 days | Opaque refresh token |

The access token contains a `JwtPayload`:
```typescript
interface JwtPayload {
  sub: string;        // userId
  email: string;
  sessionId: string;
  iat: number;
  exp: number;
}
```

## Registration Flow

```
POST /api/v1/auth/register
Body: { fullName, username, email, password }
Headers: x-device-fingerprint (optional)

1. AuthService.register()
   a. Hash password with argon2
   b. Create User record (PostgreSQL)
   c. Create CustomerProfile (assigned store from bootstrap logic)
   d. Create Wallet (CustomerBootstrapModule)
   e. Create device record (UserDevice)
   f. Issue JWT access + refresh token pair
   g. Store refresh token hash in RefreshToken table

2. Set HttpOnly cookies: gc_access_token, gc_refresh_token

3. Return: { user: { id, email, fullName }, message: 'Registration successful' }
```

## Google OAuth Flow

Google OAuth is handled via **Supabase**. The frontend triggers Supabase's Google OAuth flow, receives a Supabase access token, then exchanges it with the GreenChillyz backend:

```
POST /api/v1/auth/google
Body: { accessToken: "<supabase_google_access_token>" }

1. AuthService.authenticateWithGoogle()
   a. Verify Supabase access token against SUPABASE_JWT_SECRET
   b. Extract Google user info (email, name, avatar)
   c. Find or create User (supabaseUid field links to Supabase identity)
   d. If new user: bootstrap wallet + customer profile
   e. Issue GreenChillyz JWT pair

2. Return: { user, isNewUser: boolean }
```

## Token Rotation & Refresh

Refresh tokens use **token family rotation** to detect token theft:

1. Each refresh token has a `familyId` (UUID)
2. When refresh is called, the presented token is revoked and a new token issued in the same family
3. If an **already-revoked token** in a family is presented → the entire family is burned (all sessions from that device are invalidated)
4. This detects scenarios where a refresh token was stolen and used by an attacker while the legitimate user already rotated it

## Device Tracking

Every login creates or updates a `UserDevice` record:
- Device type, browser, OS, IP address, device fingerprint
- `pushToken` for future push notification delivery
- `lastActiveAt` timestamp
- `isTrusted` flag (admin-settable)

Customers can view devices (`GET /api/v1/auth/devices`) and remove them (`DELETE /api/v1/auth/devices/:id`), which revokes all tokens associated with that device.

## OTP System

OTPs are used for phone/email verification:
- `OtpPurpose`: PHONE_VERIFY, EMAIL_VERIFY, LOGIN
- OTP code is hashed (stored as `codeHash`) — never stored in plaintext
- Max 3 attempts per OTP; auto-expires
- One OTP per identifier+purpose combination at a time

## Password Security

Passwords are hashed with **argon2** (the `argon2` npm package). `bcrypt` is also listed as a dependency — it may be used in specific sub-flows. The primary password hash field is `User.passwordHash`.

## Session Tracking

The `LoginHistory` table records every login attempt (successful or failed) with:
- Device info, IP address, browser/OS
- `authProvider` (email, google)
- `wasSuccessful`, `failureReason`

This provides a full audit trail of authentication events.

## Frontend Auth State

On the client:
- Auth cookies are sent automatically with every API request (`credentials: 'include'`)
- `GET /api/v1/auth/me` is called on app load to check session validity
- If 401 returned → redirect to `/auth`
- Protected pages (like `/wallet`) check auth state before rendering

## Profile Update

```
PATCH /api/v1/auth/profile
Authorization: Bearer (via cookie)
Body: UpdateProfileDto (fullName, avatarUrl, phone, dateOfBirth, gender, etc.)
```
