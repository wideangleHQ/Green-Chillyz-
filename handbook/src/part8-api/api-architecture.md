# 23. API Architecture

## Base Structure

```
Base URL:   https://api.greenchillyz.com
Prefix:     /api
Version:    /v1 (URI versioning)
Full base:  https://api.greenchillyz.com/api/v1
```

All routes are versioned via URI. The default version is `1`, so every controller decorated with `@Controller({ path: 'auth', version: '1' })` maps to `/api/v1/auth`.

## Authentication

| Route Type | Auth Mechanism |
|---|---|
| Public routes (`@Public()`) | No authentication |
| Customer routes | `gc_access_token` HttpOnly cookie (JWT) |
| Dashboard routes | `gc_dashboard_access_token` HttpOnly cookie (JWT) |

Tokens are **never** sent as `Authorization: Bearer` headers — only via `HttpOnly` cookies. CORS is configured with `credentials: true` to allow cross-origin cookie sending.

## Request Format

- `Content-Type: application/json` for all POST/PUT/PATCH requests
- URL parameters for resource IDs (UUIDs)
- Query parameters for filtering/pagination
- `x-device-fingerprint` header (optional) for device tracking
- `x-request-id` header (injected by middleware, also accepted from client)
- `x-correlation-id` header (injected by middleware)

## Response Format

All successful responses are wrapped by `ResponseInterceptor`:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-09-06T12:00:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

List responses follow this shape in `data`:

```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```

## Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "email must be a valid email address" }
    ]
  },
  "timestamp": "2026-09-06T12:00:00.000Z",
  "path": "/api/v1/auth/register",
  "requestId": "..."
}
```

Common error codes:
- `VALIDATION_ERROR` — class-validator failure
- `UNAUTHORIZED` — missing or invalid JWT
- `FORBIDDEN` — insufficient permissions
- `NOT_FOUND` — resource not found
- `CONFLICT` — unique constraint violation
- `RATE_LIMITED` — throttle limit exceeded
- `INTERNAL_ERROR` — unhandled exception

## Validation

`GlobalValidationPipe` is applied globally with:
- `whitelist: true` — strips unknown properties from DTOs
- `forbidNonWhitelisted: true` — rejects requests with unknown properties
- `transform: true` — transforms payload to DTO class instances

All DTOs use `class-validator` decorators (`@IsString()`, `@IsEmail()`, `@IsUUID()`, etc.).

## Pagination

List endpoints accept standard query params:

```
GET /api/v1/wallet/me/transactions?page=1&limit=20&type=CREDIT&source=GAME_REWARD
```

The `PaginationDto` class provides these. Cursor-based pagination is used for audit logs (via `createdAt DESC, id`).

## Rate Limiting

`ThrottlerModule` applies global rate limiting:
- **Default**: 60 requests per 60 seconds per IP
- Configurable via `THROTTLE_TTL` and `THROTTLE_LIMIT` env vars
- Dashboard login has its own rate limiting: `DASHBOARD_LOGIN_RATE_LIMIT_MAX_ATTEMPTS` per `DASHBOARD_LOGIN_RATE_LIMIT_WINDOW_SECONDS`

## Swagger Documentation

Swagger UI is available at `/api/docs` in non-production environments. All controllers use `@ApiTags()`, `@ApiOperation()`, `@ApiOkResponse()`, etc. from `@nestjs/swagger`.

To access in development:
```
http://localhost:4000/api/docs
```

## CORS Configuration

```typescript
app.enableCors({
  origin: (origin, callback) => {
    if (!origin || !isProduction) callback(null, true); // Dev: all origins
    else if (corsOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 
                   'x-correlation-id', 'x-device-fingerprint'],
  credentials: true,
  maxAge: 3600,
});
```

`APP_CORS_ORIGINS` is a comma-separated list of allowed origins in production.
