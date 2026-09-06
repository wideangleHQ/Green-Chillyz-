# 1. Executive Overview

## What Is the GreenChillyz Digital Experience Platform?

The GreenChillyz Digital Experience Platform is a full-stack restaurant loyalty and engagement system built for the **GreenChillyz Group** — a multi-brand food & beverage operator. It combines a premium public website, a customer loyalty programme (Coins), interactive games, outlet management tools, and two operational dashboards (admin and franchise) into a single integrated product.

The platform is designed for scale: it operates identically for 12 outlets today and is architected to grow to 500+ without frontend or API contract changes.

## Business Problems Solved

| Problem | Platform Solution |
|---|---|
| No digital presence for multiple restaurant brands | Unified premium website covering all three brands |
| No customer retention mechanism | Coins loyalty system with earn/redeem economics |
| No digital engagement between visits | Games platform that rewards loyalty coins |
| Franchise outlets cannot manage their own content | Franchise Dashboard — store-scoped, isolated access |
| Admin has no unified oversight | Admin Dashboard — group-level control |
| No personalised customer experience | Geo-personalization engine (designed, partially implemented) |
| No structured offers / promotions workflow | StoreVoucher and RewardCampaign system |

## The Three Brands

The platform currently supports three brand identities under one group:

| Brand | Identity | Notes |
|---|---|---|
| **GreenChillyz** | Core brand; the platform's primary identity | Primary brand; slug `greenchillyz` |
| **YellowChillyz** | Secondary brand variant | Shares backend infrastructure |
| **GoldenChillyz** | Premium / signature brand variant | Uses gold accent palette |

All three brands are modelled in the database (`Brand` table) and can have separate outlets, menus, rewards, and configurations. The frontend domain is `greenchillyz.com`.

## Who Uses the Platform?

### Customers (Public)
- Visit the public website at `greenchillyz.com`
- Register/login with email+password or Google (via Supabase OAuth)
- Earn coins by playing games and through reward events
- Redeem coins for store vouchers and discounts at physical outlets
- Discover outlets via the store locator

### Franchise Users (Outlet Operators)
- Login to the Franchise Dashboard at `dashboard.greenchillyz.com`
- Authenticate with a **store access code** (no personal user account)
- Manage their outlet's profile, timings, gallery, vouchers, and coin redemptions
- View customer redemptions and announcements scoped to their outlet only

### Admin (Group Management)
- Login to the Admin section of the dashboard
- Full platform oversight: outlets, customers, rewards, campaigns, analytics
- Approve/reject franchise-submitted offers
- Manage coin economy, games configuration, user roles, and audit logs

## Platform Components at a Glance

```
greenchillyz.com          ← Public Website (Next.js, Vercel)
dashboard.greenchillyz.com ← Franchise + Admin Dashboard (Next.js, Vercel)
api.greenchillyz.com       ← Backend API (NestJS + Bun, Railway)
db.supabase.co             ← PostgreSQL (Supabase)
redis.upstash.io           ← Redis Cache (Upstash / Redis Cloud)
r2.cloudflare.com          ← File Storage (Cloudflare R2)
```

## Current State Summary

The platform is **in active development**. The backend is feature-complete for core flows (auth, wallet, games, rewards, store management). The public website homepage is fully built. The franchise dashboard is minimal — only the login screen is implemented. The admin dashboard is partially implemented at the backend level with frontend pending.

See [§47 Implementation Status](../part19-status/implementation-status.md) for the complete feature matrix.
