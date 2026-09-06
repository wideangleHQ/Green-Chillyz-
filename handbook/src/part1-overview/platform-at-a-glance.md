# 2. Platform at a Glance

## System Map

| System | Purpose | Primary Users | Status |
|---|---|---|---|
| **Public Website** | Customer-facing brand & discovery experience | Visitors, Customers | ✅ Implemented |
| **Customer Authentication** | Email/password + Google OAuth registration & login | Customers | ✅ Implemented |
| **Wallet / Coins** | Coin balance, transaction ledger, earn/debit | Customers, Admin | ✅ Implemented |
| **Games Platform** | Earn coins by playing games | Customers | ✅ Backend; 🔶 Frontend |
| **Rewards Catalog** | Coin-redeemable rewards & vouchers | Customers | ✅ Implemented |
| **Store Vouchers** | Outlet-specific promotional vouchers | Customers, Franchise | ✅ Implemented |
| **Reward Campaigns** | Event-based coin-earning campaigns | Customers, Admin | ✅ Backend; 📋 Frontend |
| **Reward Profiles & Rules** | Configurable milestone reward profiles | Admin | ✅ Backend |
| **Challenges** | Structured customer challenges | Customers | 🔶 Partial |
| **Store / Outlet System** | Outlet CRUD, timings, gallery, facilities | Admin, Franchise | ✅ Implemented |
| **Store Locator** | Geo-based outlet discovery | Customers | 🔶 Partial (frontend placeholder) |
| **Menu Catalog** | Brand-level menu items and categories | Admin | 🔶 Backend defined; tables not yet migrated |
| **Franchise Dashboard** | Outlet-scoped management portal | Franchise Users | 🔶 Login only |
| **Admin Dashboard** | Group-level platform management | Admin Users | 🔶 Backend APIs ready; frontend partial |
| **Notification System** | In-app, push, email, SMS notifications | All | ✅ Backend; 📋 Frontend delivery |
| **Audit Log** | Immutable business event trail | Admin | ✅ Implemented |
| **OTP System** | One-time password for phone/email verify | Customers | ✅ Implemented |
| **Birthday / Anniversary Offers** | Personalised time-based rewards | Customers | 📋 Planned (source enum exists) |
| **Reviews** | Customer feedback on outlets/experience | Customers, Admin | 📋 Planned (frontend placeholder) |
| **Geo-Personalization Engine** | Location-based homepage content adaptation | Customers | 📋 Designed, not yet built in server |

## Technology Stack Summary

| Layer | Technology | Version | Deployment |
|---|---|---|---|
| Public Frontend | Next.js (App Router) | 16.2.10 | Vercel |
| Dashboard Frontend | Next.js (App Router) | 16.2.10 | Vercel |
| Backend API | NestJS + Bun runtime | NestJS 11, Bun | Railway |
| Database | PostgreSQL via Prisma | Prisma 6, PG 16+ | Supabase |
| Cache | Redis (ioredis) | Redis 7+ | Upstash / Redis Cloud |
| Queue | BullMQ | v5 | Same Redis |
| Auth (Customer) | JWT + HttpOnly Cookies | — | Self-hosted |
| Auth (Google) | Supabase OAuth | — | Supabase |
| Auth (Dashboard) | Store-code + JWT + HttpOnly Cookies | — | Self-hosted |
| File Storage | Cloudflare R2 (S3-compatible) | — | Cloudflare |
| UI Framework | Tailwind CSS v4 + custom design tokens | v4 | — |
| Animation | GSAP, Framer Motion, Lenis | — | — |
| Form Handling | React Hook Form + Zod | — | — |
| HTTP Client | Axios + TanStack Query | — | — |

> **Note:** The original project document references **Cloudinary** for media. The actual codebase uses **Cloudflare R2** (AWS S3-compatible). This is a confirmed difference.

## Domain Architecture

```
greenchillyz.com
├── /                    Homepage
├── /about               About page
├── /menu                Menu page
├── /rewards             Rewards/coins page
├── /games               Games page
├── /wallet              Customer wallet (authenticated)
├── /auth                Login / Register
├── /franchise           Franchise enquiry
├── /join                Join / onboarding
└── /privacy             Privacy policy

dashboard.greenchillyz.com
├── /login               Store login (access code)
└── /(dashboard)/*       Dashboard modules (pending implementation)

api.greenchillyz.com
└── /api/v1/*            All REST API endpoints
```
