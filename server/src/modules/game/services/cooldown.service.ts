import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { GameCacheService } from './game-cache.service';

@Injectable()
export class CooldownService {
  private readonly logger = new Logger(CooldownService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: GameCacheService,
  ) {}

  async checkCooldown(userId: string, gameId: string): Promise<{ inCooldown: boolean; remainingMs: number }> {
    const now = Date.now();
    const cachedExpiry = await this.cache.getCooldownExpiry(userId, gameId);

    if (cachedExpiry) {
      if (cachedExpiry > now) {
        return { inCooldown: true, remainingMs: cachedExpiry - now };
      }
    }

    // Fallback to checking the database
    const lastSession = await this.prisma.gameSession.findFirst({
      where: {
        userId,
        gameId,
        status: { in: ['COMPLETED', 'REWARDED', 'FAILED'] },
      },
      orderBy: { endedAt: 'desc' },
    });

    if (!lastSession || !lastSession.endedAt) {
      return { inCooldown: false, remainingMs: 0 };
    }

    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      select: { cooldown: true },
    });

    if (!game || !game.cooldown) {
      return { inCooldown: false, remainingMs: 0 };
    }

    const cooldownMs = game.cooldown * 1000;
    const expiryTime = lastSession.endedAt.getTime() + cooldownMs;

    if (expiryTime > now) {
      const remainingMs = expiryTime - now;
      await this.cache.setCooldownExpiry(
        userId,
        gameId,
        expiryTime,
        Math.ceil(remainingMs / 1000),
      );
      return { inCooldown: true, remainingMs };
    }

    return { inCooldown: false, remainingMs: 0 };
  }

  async startCooldown(userId: string, gameId: string, cooldownSeconds: number): Promise<void> {
    if (cooldownSeconds <= 0) return;
    const expiryTimestamp = Date.now() + cooldownSeconds * 1000;
    await this.cache.setCooldownExpiry(userId, gameId, expiryTimestamp, cooldownSeconds);
  }
}
