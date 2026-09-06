# 4. Repository Structure

## Root Layout

```
C:\WideAngle\Green Chillyz\          ← Monorepo root
├── client/                           ← Public website (Next.js)
├── dashboard/                        ← Franchise/Admin dashboard (Next.js)
├── server/                           ← Backend API (NestJS)
├── docs/                             ← Design & architecture documentation (21 docs)
├── assets/                           ← Brand assets (logo, chilli animation frames)
├── apps/                             ← Placeholder app stubs (admin, api, cms, franchise, web READMEs)
├── packages/                         ← Shared packages (currently empty/placeholder)
├── scripts/                          ← Utility scripts
├── graphify-out/                     ← Auto-generated knowledge graph
├── CLAUDE.md                         ← AI assistant project instructions
├── AGENTS.md                         ← Agent/tool configuration
└── structure.txt                     ← Folder tree snapshot
```

## `client/` — Public Website

```
client/
├── app/                              ← Next.js App Router pages
│   ├── layout.tsx                    ← Root layout (fonts, providers, metadata)
│   ├── page.tsx                      ← Homepage (HeroSection + 9 dynamic sections)
│   ├── globals.css                   ← Tailwind v4 design tokens & global styles
│   ├── robots.ts                     ← Dynamic robots.txt
│   ├── sitemap.ts                    ← Dynamic sitemap
│   ├── about/page.tsx                ← About page
│   ├── auth/                         ← Login / Register pages
│   ├── franchise/page.tsx            ← Franchise enquiry page
│   ├── games/page.tsx                ← Games page
│   ├── join/page.tsx                 ← Customer onboarding/join page
│   ├── menu/page.tsx                 ← Menu browse page
│   ├── privacy/page.tsx              ← Privacy policy
│   ├── rewards/page.tsx              ← Rewards/loyalty page
│   └── wallet/page.tsx               ← Customer wallet (authenticated)
├── components/                       ← All React components
│   ├── hero/                         ← Hero section (HeroSection, HeroMedia, etc.)
│   ├── brand-snapshot/               ← Brand quick-facts section
│   ├── brand-story/                  ← Brand storytelling section
│   ├── signature-creations/          ← Featured menu items section
│   ├── offers/                       ← Offers section
│   ├── games/                        ← Games teaser section
│   ├── business-verticals/           ← Three brands showcase
│   ├── locations/                    ← Store locator section
│   ├── why-greenchillyz/             ← Value proposition section
│   ├── reviews/                      ← Customer reviews section
│   ├── navbar/                       ← Navigation
│   ├── footer/                       ← Footer
│   ├── preloader/                    ← Page preloader animation
│   ├── onboarding/                   ← Customer onboarding flow
│   ├── auth/                         ← Auth forms (login, register)
│   ├── wallet/                       ← Wallet UI components
│   ├── rewards/                      ← Rewards UI components
│   ├── notifications/                ← Notification UI
│   ├── providers/                    ← AppProviders (React context/query setup)
│   ├── SmoothScroll.tsx              ← Lenis smooth scroll wrapper
│   └── ui/                           ← Shared UI primitives (Button, Card, Input…)
├── hooks/                            ← Custom React hooks
├── lib/                              ← Utilities, API clients, structured data builders
├── types/                            ← TypeScript type definitions
└── public/                           ← Static assets
    ├── sequences/chilli/             ← Frame-by-frame chilli animation (JPGs)
    ├── sequences/burger/             ← Burger animation frames
    ├── sequences/drinks/             ← Drinks animation frames
    ├── images/                       ← Static images
    ├── fonts/                        ← Local font files (Anton, Manrope)
    ├── audio/                        ← Audio files
    ├── lottie/                       ← Lottie animation files
    └── videos/                       ← Video files
```

**Key file:** `client/app/page.tsx` — the homepage composition. All 9+ sections are `dynamic()` imports for code-splitting, except `HeroSection` which loads immediately.

## `dashboard/` — Franchise & Admin Dashboard

```
dashboard/
├── app/
│   ├── layout.tsx                    ← Root layout
│   ├── globals.css                   ← Dashboard design tokens
│   ├── login/page.tsx                ← Store access-code login page
│   └── (dashboard)/                  ← Protected dashboard shell (layout guard)
│       └── [routes TBD]             ← Dashboard modules (pending implementation)
├── components/                       ← Dashboard UI components
├── hooks/                            ← Dashboard hooks
├── lib/                              ← API client, auth utilities
└── types/                            ← TypeScript types
```

> **Important:** As of the current commit, only the `login/` page is implemented in the dashboard frontend. All other dashboard routes are pending.

## `server/` — Backend API

```
server/
├── src/
│   ├── main.ts                       ← Bootstrap (port, CORS, middleware, Swagger)
│   ├── app.module.ts                 ← Root NestJS module (imports all modules)
│   ├── config/                       ← Typed config + Joi env validation schema
│   ├── database/                     ← DatabaseModule (PrismaService)
│   ├── health/                       ← Health check endpoint (@nestjs/terminus)
│   ├── common/                       ← Shared infrastructure
│   │   ├── decorators/               ← @Public, @CurrentUser, @Permissions
│   │   ├── filters/                  ← GlobalExceptionFilter, PrismaExceptionFilter
│   │   ├── guards/                   ← JwtAuthGuard
│   │   ├── interceptors/             ← LoggingInterceptor, ResponseInterceptor, TimeoutInterceptor
│   │   ├── middleware/               ← RequestIdMiddleware, CorrelationIdMiddleware
│   │   ├── pipes/                    ← GlobalValidationPipe (class-validator)
│   │   └── swagger/                  ← Swagger setup (disabled in production)
│   ├── providers/
│   │   ├── redis/                    ← RedisModule (ioredis)
│   │   └── queue/                    ← QueueModule (BullMQ)
│   ├── modules/
│   │   ├── auth/                     ← Customer auth (JWT, Google, OTP, devices)
│   │   ├── dashboard-auth/           ← Dashboard store-code auth
│   │   ├── dashboard/                ← Admin dashboard APIs
│   │   ├── store/                    ← Store CRUD, gallery, timings, holidays
│   │   ├── wallet/                   ← Coin wallet and transactions
│   │   ├── game/                     ← Games configuration and sessions
│   │   ├── reward/                   ← Reward catalog and redemption
│   │   ├── rewards/                  ← Rewards listing/discovery for customers
│   │   ├── reward-profile/           ← Configurable reward profiles
│   │   ├── reward-rules/             ← Profile reward rules
│   │   ├── reward-assignment/        ← Assign profiles to stores
│   │   ├── reward-overrides/         ← Per-store rule overrides
│   │   ├── reward-resolution/        ← Resolve applicable reward for an event
│   │   ├── coin-economy/             ← Coin economy analytics
│   │   ├── dashboard-rewards/        ← Dashboard reward management
│   │   ├── customer-bootstrap/       ← Post-registration setup (wallet, profile)
│   │   ├── customer-journey/         ← Customer journey tracking
│   │   ├── menu/                     ← Menu catalog (categories, items, tags)
│   │   ├── notification/             ← Notification dispatch and preferences
│   │   ├── audit/                    ← Audit log recording and querying
│   │   └── challenges/               ← Customer challenges
│   ├── shared/                       ← Cross-module shared types and utilities
│   ├── types/                        ← Global TypeScript types
│   └── utils/                        ← Utility functions (hash, location, etc.)
├── prisma/
│   ├── schema.prisma                 ← Complete Prisma schema (~2500 lines)
│   ├── migrations/                   ← SQL migration history
│   ├── seeds/                        ← Seed data scripts
│   └── factories/                    ← Test data factories
└── vitest.config.ts                  ← Test configuration
```

## `docs/` — Project Documentation

The `docs/` directory contains 21 design and architecture documents written before/during development:

| File | Topic |
|---|---|
| `00_Project_Vision.md` | Platform vision and goals |
| `01_Homepage_Experience.md` | Storytelling map for homepage |
| `02_UI_Design_System.md` | Visual tokens and usage rules |
| `03_Animation_Guidelines.md` | Animation principles |
| `04_Component_Library.md` | Component build decisions |
| `05_Visual_Direction.md` | Photography and visual direction |
| `06_Content_and_Copy.md` | Brand copy guidelines |
| `07_Tech_Stack.md` | Frontend + backend technology choices |
| `08_Performance_Guidelines.md` | Performance budgets (LCP/CLS/INP) |
| `09_Asset_Pipeline.md` | Asset sourcing and optimization |
| `10_Development_Rules.md` | Development conventions |
| `11_Accessibility.md` | WCAG 2.1 AA requirements |
| `12_Homepage_Sections.md` | Section-by-section homepage spec |
| `13_Animation_Timeline.md` | Scroll animation sequence |
| `14_SEO_and_Metadata.md` | SEO implementation rules |
| `15_AI_Generation_Guide.md` | AI/image generation prompts |
| `16_Project_TODO.md` | Milestone tracker |
| `17_Interaction_Principles.md` | UX interaction patterns |
| `18_Responsive_Design_System.md` | Responsive breakpoints |
| `19_Design_Tokens.md` | Canonical design token values |
| `20_Homepage_QA_Checklist.md` | QA checklist |
| `21_Server_Architecture.md` | Geo-personalization engine design |
