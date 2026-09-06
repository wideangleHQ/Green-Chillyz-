# 41. How to Add a New Game

Games are configured via the `Game` model. No code deployment is needed to add a new game type — only a database record and optionally a frontend component.

---

## Step 1 — Create the Game Config

```
POST /api/v1/games
Auth: SUPER_ADMIN or game:create permission
Body: {
  name: "Chilli Catcher",
  slug: "chilli-catcher",
  description: "Catch falling chillies to earn coins!",
  type: "MINI_GAME",
  isActive: true,
  maxScore: 1000,
  minScore: 0,
  dailyLimit: 3,
  cooldownMinutes: 60,
  config: {
    difficulty: "medium",
    speedMultiplier: 1.5,
    lives: 3
  }
}
```

Key fields:
- `maxScore` — scores above this are rejected as cheating
- `dailyLimit` — how many sessions per day per user (null = unlimited)
- `cooldownMinutes` — wait time between sessions (null = no cooldown)
- `config` — arbitrary JSON for game-specific settings (frontend uses this)

---

## Step 2 — Create Reward Campaigns for the Game

Games earn coins via `RewardCampaign`. A campaign defines the scoring thresholds and coin amounts.

```
POST /api/v1/dashboard/rewards/campaigns
Auth: SUPER_ADMIN
Body: {
  name: "Chilli Catcher Rewards",
  gameId: "<game-uuid>",
  rules: [
    { minScore: 800, maxScore: 1000, coinReward: 100 },
    { minScore: 500, maxScore: 799, coinReward: 50 },
    { minScore: 0,   maxScore: 499, coinReward: 10 }
  ],
  isActive: true,
  startDate: "2026-01-01",
  endDate: null  // no end date = runs indefinitely
}
```

The `RewardEngineService` evaluates these rules when `POST /games/sessions/end` is called.

---

## Step 3 — Register in GameRegistry (if needed)

The `GameRegistry` in `server/src/modules/game/game.registry.ts` maps game slugs to server-side validators. If the game has custom score validation logic (beyond the `maxScore` field), register a validator:

```typescript
@Injectable()
export class GameRegistry {
  private validators: Record<string, GameValidator> = {
    'spin-wheel': new SpinWheelValidator(),
    'chilli-catcher': new ChilliCatcherValidator(),  // add this
  };
}
```

For simple games (score is just a number), the default `maxScore` check is sufficient — no registry entry needed.

---

## Step 4 — Frontend Game Component

Create the game UI in `client/components/games/ChilliCatcher.tsx`.

The component receives game config from the API:
```typescript
// Game config from GET /api/v1/games/chilli-catcher
const { config, maxScore, dailyLimit } = game;

// Start session
await api.post('/games/sessions/start', { gameId: game.id });

// When game ends — send actual score
await api.post('/games/sessions/end', {
  sessionId: session.id,
  score: finalScore,  // must be <= maxScore
});
```

The server validates the score server-side (`score <= game.maxScore`). Never trust client-submitted scores beyond this — the `minScore`/`maxScore` window is the server-enforced anti-cheat boundary.

---

## Step 5 — Display in Games Section

The `GamesSection` on the homepage (`client/components/sections/GamesSection.tsx`) fetches active games from `GET /api/v1/games`. Adding the game config in Step 1 with `isActive: true` automatically includes it.

For a featured game: update the section component to add a "featured" display for games with a `featured: true` flag in `Game.config`.

---

## Verify

```bash
# Game appears in listing
GET /api/v1/games

# Game accessible by slug
GET /api/v1/games/chilli-catcher

# Session lifecycle
POST /api/v1/games/sessions/start { gameId: "..." }
POST /api/v1/games/sessions/end { sessionId: "...", score: 750 }

# Verify coins credited
GET /api/v1/wallet/me/transactions
# Should show GAME_REWARD transaction
```

---

## Anti-Cheat Summary

| Control | Mechanism |
|---|---|
| Score ceiling | `maxScore` in Game config — server rejects higher scores |
| Daily limit | `dailyLimit` — server rejects sessions over limit |
| Cooldown | `cooldownMinutes` — server rejects early sessions |
| Idempotency | Session ID is idempotent — cannot double-claim same session |
| Custom validation | `GameRegistry` validator per game slug (optional) |
