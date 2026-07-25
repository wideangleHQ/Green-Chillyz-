import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Game, GameSessionStatus } from '@prisma/client';
import { GAME_ERRORS } from '../constants/game.constants';
import { GameCacheService } from './game-cache.service';
import { CooldownService } from './cooldown.service';

@Injectable()
export class EligibilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: GameCacheService,
    private readonly cooldownService: CooldownService,
  ) {}

  async checkEligibility(userId: string, game: Game): Promise<{ eligible: boolean; reason?: string }> {
    // 1. Game Active
    if (!game.isActive) {
      return { eligible: false, reason: GAME_ERRORS.GAME_INACTIVE };
    }

    // 2. User & Wallet Active
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        customerProfile: true,
        staffProfile: true,
        wallet: true,
      },
    });

    if (!user || !user.isActive) {
      return { eligible: false, reason: 'User account is inactive or not found' };
    }

    if (!user.wallet || !user.wallet.isActive) {
      return { eligible: false, reason: GAME_ERRORS.WALLET_INACTIVE };
    }

    // 3. User Level / Customer Tier check if configured
    if (game.minLevel > 0) {
      // Assuming user level is stored in metadata or loyalty system
      // If we don't have level info, we default to 1, or check metadata
      const userLevel = (user.customerProfile?.createdAt ? 1 : 1); // Simple level fallback
      if (userLevel < game.minLevel) {
        return { eligible: false, reason: GAME_ERRORS.INSUFFICIENT_LEVEL };
      }
    }

    // 4. Store Eligibility
    if (game.storeEligibility && game.storeEligibility.length > 0) {
      const userStoreId = user.customerProfile?.assignedStoreId || user.staffProfile?.storeId;
      if (!userStoreId || !game.storeEligibility.includes(userStoreId)) {
        return { eligible: false, reason: GAME_ERRORS.STORE_INELIGIBLE };
      }
    }

    // 5. Cooldown check
    const cooldownStatus = await this.cooldownService.checkCooldown(userId, game.id);
    if (cooldownStatus.inCooldown) {
      return { eligible: false, reason: `${GAME_ERRORS.COOLDOWN_ACTIVE} (Remaining: ${Math.ceil(cooldownStatus.remainingMs / 1000)}s)` };
    }

    // 6. Daily Limit check
    if (game.dailyLimit > 0) {
      const playCount = await this.cache.getDailyCount(userId, game.id);
      if (playCount >= game.dailyLimit) {
        return { eligible: false, reason: GAME_ERRORS.DAILY_LIMIT_EXCEEDED };
      }
    }

    // 7. Duplicate Session (active session for THIS game)
    const activeSession = await this.prisma.gameSession.findFirst({
      where: {
        userId,
        gameId: game.id,
        status: { in: [GameSessionStatus.CREATED, GameSessionStatus.STARTED, GameSessionStatus.PLAYING] },
      },
      select: { id: true },
    });

    if (activeSession) {
      return { eligible: false, reason: GAME_ERRORS.DUPLICATE_SESSION };
    }

    // 8. Concurrent Session (active session for ANY game)
    const anyActiveSession = await this.prisma.gameSession.findFirst({
      where: {
        userId,
        status: { in: [GameSessionStatus.CREATED, GameSessionStatus.STARTED, GameSessionStatus.PLAYING] },
      },
      select: { id: true, game: { select: { name: true } } },
    });

    if (anyActiveSession) {
      return { eligible: false, reason: `${GAME_ERRORS.CONCURRENT_SESSION} (Active session in: ${anyActiveSession.game.name})` };
    }

    return { eligible: true };
  }
}
