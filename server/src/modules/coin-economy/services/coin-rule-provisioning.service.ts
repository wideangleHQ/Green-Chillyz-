import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CoinRuleStatus } from '@prisma/client';
import { CoinRuleRepository } from '../repositories';
import { CoinEconomyCacheService } from '../cache';
import { COIN_RULE_SEEDS, COIN_RULE_HISTORY_ACTIONS } from '../constants';

/**
 * Provisions a rule row for each rule type that has none, so a fresh install
 * starts with a usable — and immediately editable — economy.
 *
 * This is the only place the seed values are read. Once a rule exists the
 * seeds are never consulted again, which is what keeps the engine free of
 * hardcoded coin amounts at runtime.
 */
@Injectable()
export class CoinRuleProvisioningService implements OnModuleInit {
  private readonly logger = new Logger(CoinRuleProvisioningService.name);

  constructor(
    private readonly repo: CoinRuleRepository,
    private readonly cache: CoinEconomyCacheService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.provisionMissing();
    } catch (error) {
      // Never block boot on provisioning; a missing rule simply means the
      // engine reports "no rule configured" until an operator creates one.
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Coin rule provisioning skipped: ${message}`);
    }
  }

  async provisionMissing(): Promise<number> {
    const counts = await this.repo.countByType();
    const existing = new Set(counts.filter((c) => c.count > 0).map((c) => c.ruleType));

    const missing = COIN_RULE_SEEDS.filter((seed) => !existing.has(seed.ruleType));
    if (missing.length === 0) return 0;

    for (const seed of missing) {
      const rule = await this.repo.create({
        name: seed.name,
        description: seed.description,
        ruleType: seed.ruleType,
        coinAmount: seed.coinAmount,
        minCoins: seed.minCoins,
        maxCoins: seed.maxCoins,
        dailyLimit: seed.dailyLimit,
        cooldownSeconds: seed.cooldownSeconds,
        enabled: true,
        status: CoinRuleStatus.ACTIVE,
      });

      await this.repo.recordHistory({
        ruleId: rule.id,
        action: COIN_RULE_HISTORY_ACTIONS.CREATED,
        status: rule.status,
        reason: 'Provisioned from defaults',
        snapshot: { seeded: true, ruleType: seed.ruleType },
      });
    }

    await this.cache.invalidateAll();
    this.logger.log(`Provisioned ${missing.length} default coin rules`);
    return missing.length;
  }
}
