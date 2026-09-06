# 17. Games System

## Overview

The Games platform lets customers play interactive games to earn coins. The system is designed to be extensible: new games are registered as `Game` records with configuration, and the game engine (frontend) renders different game UIs while calling the same session lifecycle API.

## Data Model

### Game (Configuration)
```
Game
├── id (UUID), name, slug (unique)
├── description
├── isActive
├── dailyLimit (int)       ← Max plays per day per user (0 = unlimited)
├── cooldown (int)         ← Seconds between plays (0 = no cooldown)
├── minLevel (int)         ← Minimum loyalty level required
├── maxRewards (Decimal)   ← Maximum reward per session
├── rewardType (string)    ← e.g., "COINS"
├── rewardConfig (JSONB)   ← Flexible reward configuration
├── storeEligibility UUID[] ← Which stores can play (empty = all)
├── campaignEligibility UUID[] ← Linked reward campaigns
└── metadata (JSONB)
```

### GameSession (Per-Play Record)
```
GameSession
├── id (UUID)
├── userId, gameId
├── status: CREATED | STARTED | PLAYING | COMPLETED | FAILED |
│           EXPIRED | ABANDONED | REWARDED
├── startedAt, endedAt
├── device, browser, ipAddress
├── score (int)            ← Server records final score
├── rewardDecision (JSONB) ← What reward was granted and why
└── metadata (JSONB)
```

## Session Lifecycle API

**Controller:** `server/src/modules/game/game.controller.ts`

```
# Customer endpoints (authenticated)
POST /api/v1/games/sessions/start    → Start a game session
POST /api/v1/games/sessions/end      → End session and claim reward
GET  /api/v1/games/sessions/me       → My session history
GET  /api/v1/games/sessions/:id      → Single session detail

GET  /api/v1/games                   → List all active games
GET  /api/v1/games/:idOrSlug         → Game config by ID or slug
GET  /api/v1/games/:id/leaderboard   → Leaderboard for a game

# Admin endpoints (permissions required)
POST   /api/v1/games                 → Create game config (GAME_CREATE)
PATCH  /api/v1/games/:id             → Update game config (GAME_UPDATE)
DELETE /api/v1/games/:id             → Delete game (GAME_DELETE)
GET    /api/v1/games/:id/stats       → Analytics (GAME_ANALYTICS)
```

## Session Validation

The `endSession` call runs server-side validation to prevent cheating:

1. **Session ownership**: Verifies `gameSession.userId === requestingUser.sub`
2. **Status check**: Session must be in `STARTED` or `PLAYING` state
3. **Score bounds**: Score validated against game's `rewardConfig` range
4. **Timing**: Session duration validated against expected play time
5. **Anti-replay**: Session ID cannot be ended twice

## Game Registry

The `GameRegistry` (referenced in the graph) is a server-side registry mapping game slugs to game-specific validation logic. This allows the system to have game-specific rules without hardcoding them in the session service.

## Reward Evaluation

After a valid `endSession`, the `RewardEngineService` evaluates:

```
1. Query active RewardCampaigns with eventType: GAME_COMPLETED
2. Filter by: campaign.storeIds (customer's assignedStore), campaign.brandIds, 
              campaign.status: ACTIVE, now between startsAt and endsAt
3. For each matching campaign, apply RewardRules (multipliers)
4. Compute: finalCoins = baseCoins × multiplier + bonusCoins
5. Check: campaign.dailyLimit, campaign.maxClaims, campaign.totalBudget
6. If all checks pass: credit WalletTransaction (GAME_REWARD)
7. Record RewardHistory (rewardGranted: true/false)
8. Update GameSession.status = REWARDED
```

## Games Frontend

**Location:** `client/components/games/GamesSection.tsx` (homepage teaser)  
**Full games page:** `client/app/games/page.tsx`

The frontend games section shows:
- Available games (fetched from `GET /api/v1/games`)
- Game cards with play CTAs
- Coin reward preview

The actual game UI (spin wheel, scratch card, etc.) is rendered within the games section or games page. The frontend:
1. Calls `POST /sessions/start` → receives `sessionId`
2. Runs the game UI (local state, animation)
3. Calls `POST /sessions/end` with `sessionId + score`
4. Shows reward result from response

> **Status:** The backend session API is fully implemented. Specific game UIs (spin-the-wheel, scratch card, etc.) are referenced in the knowledge graph but their frontend implementation completeness requires verification.

## Anti-Abuse Summary

| Protection | Mechanism |
|---|---|
| Daily play limit | `Game.dailyLimit` checked against Redis daily count |
| Cooldown between plays | `Game.cooldown` seconds checked per user per game |
| Score manipulation | Server-side score validation in `endSession` |
| Session replay | Session status state machine prevents double-end |
| Budget exhaustion | Campaign `totalBudget` and `maxClaims` caps |
| Store eligibility | `Game.storeEligibility` filters eligible users |
