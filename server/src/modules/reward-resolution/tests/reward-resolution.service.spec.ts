import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RewardResolutionService } from '../services/reward-resolution.service';
import { RESOLUTION_SOURCE, REWARD_RESOLUTION_EVENTS, REWARD_RESOLUTION_AUDIT } from '../constants';

describe('RewardResolutionService', () => {
  let service: RewardResolutionService;
  let campaignEngine: Record<string, ReturnType<typeof vi.fn>>;
  let overridesService: Record<string, ReturnType<typeof vi.fn>>;
  let assignmentService: Record<string, ReturnType<typeof vi.fn>>;
  let profileService: Record<string, ReturnType<typeof vi.fn>>;
  let rulesService: Record<string, ReturnType<typeof vi.fn>>;
  let coinEconomy: Record<string, ReturnType<typeof vi.fn>>;
  let wallet: Record<string, ReturnType<typeof vi.fn>>;
  let audit: Record<string, ReturnType<typeof vi.fn>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;
  let events: { emit: ReturnType<typeof vi.fn> };

  const mockResolvedRules = [
    {
      ruleId: 'rule-1',
      ruleName: '500 Coins Dessert',
      ruleType: 'COIN_MILESTONE',
      coinRequirement: 500,
      rewardType: 'MENU_ITEM',
      rewardReference: 'dessert-1',
      displayOrder: 1,
      priority: 0,
      source: 'PROFILE' as const,
      overrideId: null,
      validFrom: null,
      expiryDate: null,
    },
    {
      ruleId: 'rule-2',
      ruleName: '1000 Coins Fries',
      ruleType: 'COIN_MILESTONE',
      coinRequirement: 1000,
      rewardType: 'MENU_ITEM',
      rewardReference: 'fries-1',
      displayOrder: 2,
      priority: 0,
      source: 'OVERRIDE' as const,
      overrideId: 'override-1',
      validFrom: null,
      expiryDate: null,
    },
  ];

  const mockCampaignDecision = {
    rewardGranted: true,
    coins: 100,
    multiplier: 1.5,
    bonusCoins: 10,
    totalCoins: 160,
    reason: 'Reward from campaign: Summer Special',
    campaignId: 'campaign-1',
    campaignName: 'Summer Special',
    expiresAt: new Date('2026-12-31'),
    walletSource: 'CAMPAIGN_REWARD',
    walletTransactionType: 'CREDIT',
    ruleApplied: 'MIN_PURCHASE',
    metadata: { campaignSlug: 'summer-special', eventType: 'PURCHASE_COMPLETED' },
  };

  const mockCoinDecision = {
    granted: true,
    reason: 'Coins earned via GAME_COMPLETED',
    ruleId: 'coin-rule-1',
    ruleType: 'GAME_COMPLETED',
    coins: 50,
    calculation: { baseCoins: 50, multiplier: 1, finalCoins: 50 },
    cooldownSecondsRemaining: 0,
    walletSource: 'GAME_REWARD',
    transactionId: 'tx-1',
    newBalance: 550,
    limits: [],
  };

  beforeEach(() => {
    campaignEngine = {
      evaluateReward: vi.fn().mockResolvedValue({ rewardGranted: false, reason: 'No campaign' }),
    };
    overridesService = {
      previewEffectiveRewards: vi.fn().mockResolvedValue(mockResolvedRules),
      findByStore: vi.fn().mockResolvedValue([]),
    };
    assignmentService = {
      resolveStoreProfile: vi.fn().mockResolvedValue({ id: 'profile-1', name: 'Standard' }),
    };
    profileService = {
      findDefault: vi.fn().mockResolvedValue({ id: 'default-1', name: 'Global Default' }),
    };
    rulesService = {
      findByProfile: vi.fn().mockResolvedValue(mockResolvedRules),
      findMilestones: vi.fn().mockResolvedValue([]),
    };
    coinEconomy = {
      earn: vi.fn().mockResolvedValue(mockCoinDecision),
      preview: vi.fn().mockResolvedValue(mockCoinDecision),
    };
    wallet = {
      getBalance: vi.fn().mockResolvedValue({ balance: 750, pendingBalance: 0 }),
      credit: vi.fn().mockResolvedValue({ transaction: {}, newBalance: 800 }),
    };
    audit = {
      record: vi.fn().mockResolvedValue(null),
    };
    cache = {
      getResolution: vi.fn().mockResolvedValue(null),
      setResolution: vi.fn().mockResolvedValue(undefined),
      getPreview: vi.fn().mockResolvedValue(null),
      setPreview: vi.fn().mockResolvedValue(undefined),
      getStoreContext: vi.fn().mockResolvedValue(null),
      setStoreContext: vi.fn().mockResolvedValue(undefined),
      getCustomerSummary: vi.fn().mockResolvedValue(null),
      setCustomerSummary: vi.fn().mockResolvedValue(undefined),
      invalidateCustomer: vi.fn().mockResolvedValue(undefined),
      invalidateStore: vi.fn().mockResolvedValue(undefined),
    };
    events = { emit: vi.fn() };

    service = new RewardResolutionService(
      campaignEngine as any,
      overridesService as any,
      assignmentService as any,
      profileService as any,
      rulesService as any,
      coinEconomy as any,
      wallet as any,
      audit as any,
      cache as any,
      events as any,
    );
  });

  describe('Campaign Priority', () => {
    it('resolves via campaign when campaign context is provided and campaign grants reward', async () => {
      campaignEngine.evaluateReward.mockResolvedValue(mockCampaignDecision);

      const result = await service.resolveReward({
        customerId: 'cust-1',
        storeId: 'store-1',
        campaignContext: { eventType: 'PURCHASE_COMPLETED', purchaseAmount: 500 },
      });

      expect(result.resolved).toBe(true);
      expect(result.source).toBe(RESOLUTION_SOURCE.CAMPAIGN);
      expect(result.campaignApplied).toBeDefined();
      expect(result.campaignApplied!.campaignId).toBe('campaign-1');
      expect(result.coinAmount).toBe(160);
    });

    it('falls through to profile when campaign does not grant reward', async () => {
      campaignEngine.evaluateReward.mockResolvedValue({
        rewardGranted: false,
        reason: 'Budget exhausted',
      });

      const result = await service.resolveReward({
        customerId: 'cust-1',
        storeId: 'store-1',
        campaignContext: { eventType: 'PURCHASE_COMPLETED' },
        coinBalance: 600,
      });

      expect(result.resolved).toBe(true);
      expect(result.source).not.toBe(RESOLUTION_SOURCE.CAMPAIGN);
    });
  });

  describe('Store Override Priority', () => {
    it('applies store override when it exists', async () => {
      const result = await service.resolveReward({
        customerId: 'cust-1',
        storeId: 'store-1',
        coinBalance: 1500,
      });

      expect(result.resolved).toBe(true);
      const overriddenReward = mockResolvedRules.find((r) => r.source === 'OVERRIDE');
      if (result.source === RESOLUTION_SOURCE.STORE_OVERRIDE) {
        expect(result.storeOverrideApplied).toBeDefined();
        expect(result.storeOverrideApplied!.overrideId).toBe('override-1');
      }
    });
  });

  describe('Profile Resolution', () => {
    it('resolves via assigned profile when no campaign context', async () => {
      const result = await service.resolveReward({
        customerId: 'cust-1',
        storeId: 'store-1',
        coinBalance: 600,
      });

      expect(result.resolved).toBe(true);
      expect(result.reward).toBeDefined();
      expect(result.ruleUsed).toBeDefined();
    });

    it('filters by reward type when specified', async () => {
      wallet.getBalance.mockResolvedValue({ balance: 0, pendingBalance: 0 });

      const result = await service.resolveReward({
        customerId: 'cust-1',
        storeId: 'store-1',
        rewardType: 'VOUCHER' as any,
        coinBalance: 600,
      });

      expect(result.resolved).toBe(false);
    });

    it('filters out rules with insufficient coin balance', async () => {
      wallet.getBalance.mockResolvedValue({ balance: 0, pendingBalance: 0 });

      const result = await service.resolveReward({
        customerId: 'cust-1',
        storeId: 'store-1',
        coinBalance: 100,
      });

      expect(result.resolved).toBe(false);
    });

    it('falls back to global default when no store assignment', async () => {
      overridesService.previewEffectiveRewards.mockRejectedValue(new Error('No overrides'));
      assignmentService.resolveStoreProfile.mockRejectedValue(new Error('No assignment'));
      rulesService.findByProfile.mockResolvedValue([
        { id: 'rule-g1', name: 'Global Rule', ruleType: 'COIN_MILESTONE', coinRequirement: 500,
          rewardType: 'MENU_ITEM', rewardReference: 'item-1', displayOrder: 1, priority: 0,
          status: 'ACTIVE', validFrom: null, expiryDate: null },
      ]);

      const result = await service.resolveReward({
        customerId: 'cust-1',
        storeId: 'store-1',
        coinBalance: 600,
      });

      expect(profileService.findDefault).toHaveBeenCalled();
    });
  });

  describe('Coin Resolution', () => {
    it('resolves coins via CoinEconomyService', async () => {
      const result = await service.resolveCoins('cust-1', 'store-1', 'GAME_COMPLETED');

      expect(result.granted).toBe(true);
      expect(result.coins).toBe(50);
      expect(result.source).toBe(RESOLUTION_SOURCE.COIN_ECONOMY);
      expect(result.ruleId).toBe('coin-rule-1');
      expect(coinEconomy.earn).toHaveBeenCalled();
    });

    it('uses preview mode when specified', async () => {
      await service.resolveCoins('cust-1', 'store-1', 'GAME_COMPLETED', { preview: true });

      expect(coinEconomy.preview).toHaveBeenCalled();
      expect(coinEconomy.earn).not.toHaveBeenCalled();
    });

    it('records audit on successful coin earn (not preview)', async () => {
      await service.resolveCoins('cust-1', 'store-1', 'GAME_COMPLETED');
      expect(audit.record).toHaveBeenCalled();
    });

    it('does not record audit in preview mode', async () => {
      await service.resolveCoins('cust-1', 'store-1', 'GAME_COMPLETED', { preview: true });
      expect(audit.record).not.toHaveBeenCalled();
    });
  });

  describe('Voucher Resolution', () => {
    it('resolves voucher when rule exists and balance sufficient', async () => {
      overridesService.previewEffectiveRewards.mockResolvedValue([
        { ...mockResolvedRules[0], rewardType: 'VOUCHER', ruleId: 'voucher-rule-1' },
      ]);

      const result = await service.resolveVoucher('cust-1', 'store-1', 'voucher-rule-1');

      expect(result.resolved).toBe(true);
      expect(result.reward!.rewardType).toBe('VOUCHER');
    });

    it('rejects when insufficient coins', async () => {
      wallet.getBalance.mockResolvedValue({ balance: 10, pendingBalance: 0 });
      overridesService.previewEffectiveRewards.mockResolvedValue([
        { ...mockResolvedRules[0], rewardType: 'VOUCHER', ruleId: 'voucher-rule-1', coinRequirement: 500 },
      ]);

      const result = await service.resolveVoucher('cust-1', 'store-1', 'voucher-rule-1');
      expect(result.resolved).toBe(false);
      expect(result.reason).toContain('Insufficient');
    });

    it('rejects when no matching voucher rule', async () => {
      overridesService.previewEffectiveRewards.mockResolvedValue([]);
      const result = await service.resolveVoucher('cust-1', 'store-1', 'nonexistent');
      expect(result.resolved).toBe(false);
    });
  });

  describe('Preview Mode', () => {
    it('does not trigger audit or events in preview mode', async () => {
      const result = await service.previewReward({
        customerId: 'cust-1',
        storeId: 'store-1',
        coinBalance: 600,
      });

      expect(result.preview).toBe(true);
      expect(result.auditRequired).toBe(false);
      expect(events.emit).not.toHaveBeenCalledWith(
        REWARD_RESOLUTION_EVENTS.REWARD_RESOLVED,
        expect.anything(),
      );
    });

    it('caches preview separately from resolve', async () => {
      await service.previewReward({
        customerId: 'cust-1',
        storeId: 'store-1',
        coinBalance: 600,
      });

      expect(cache.setPreview).toHaveBeenCalled();
      expect(cache.setResolution).not.toHaveBeenCalled();
    });
  });

  describe('Milestone Resolution', () => {
    it('resolves highest milestone the customer has reached', async () => {
      const result = await service.resolveMilestone('cust-1', 'store-1');

      expect(result.reached).toBe(true);
      expect(result.milestone).toBeDefined();
      expect(result.milestone!.coinRequirement).toBeLessThanOrEqual(750);
    });

    it('uses provided coinBalance over wallet query', async () => {
      const result = await service.resolveMilestone('cust-1', 'store-1', 600);

      expect(wallet.getBalance).not.toHaveBeenCalled();
      expect(result.reached).toBe(true);
      expect(result.milestone!.coinRequirement).toBe(500);
    });

    it('returns next milestone when no milestone reached', async () => {
      overridesService.previewEffectiveRewards.mockResolvedValue([
        { ...mockResolvedRules[0], coinRequirement: 2000 },
      ]);

      const result = await service.resolveMilestone('cust-1', 'store-1', 100);

      expect(result.reached).toBe(false);
      expect(result.nextMilestone).toBeDefined();
    });

    it('indicates override source when override provides the milestone', async () => {
      overridesService.previewEffectiveRewards.mockResolvedValue([
        { ...mockResolvedRules[1], coinRequirement: 500 },
      ]);

      const result = await service.resolveMilestone('cust-1', 'store-1', 600);

      expect(result.reached).toBe(true);
      expect(result.source).toBe(RESOLUTION_SOURCE.STORE_OVERRIDE);
      expect(result.overrideApplied).toBeDefined();
    });
  });

  describe('Audit', () => {
    it('records audit on successful resolution', async () => {
      const result = await service.resolveReward({
        customerId: 'cust-1',
        storeId: 'store-1',
        coinBalance: 600,
      });

      expect(result.resolved).toBe(true);
      expect(audit.record).toHaveBeenCalled();
    });

    it('records override audit when override is applied', async () => {
      overridesService.previewEffectiveRewards.mockResolvedValue([
        { ...mockResolvedRules[1], coinRequirement: 100 },
      ]);

      await service.resolveReward({
        customerId: 'cust-1',
        storeId: 'store-1',
        coinBalance: 200,
      });

      const overrideAuditCalls = audit.record.mock.calls.filter(
        (c: any[]) => c[0]?.action === REWARD_RESOLUTION_AUDIT.ACTIONS.OVERRIDE_USED,
      );
      expect(overrideAuditCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Notifications', () => {
    it('emits REWARD_RESOLVED event on successful resolution', async () => {
      await service.resolveReward({
        customerId: 'cust-1',
        storeId: 'store-1',
        coinBalance: 600,
      });

      expect(events.emit).toHaveBeenCalledWith(
        REWARD_RESOLUTION_EVENTS.REWARD_RESOLVED,
        expect.anything(),
      );
    });

    it('emits CAMPAIGN_APPLIED event when campaign resolves', async () => {
      campaignEngine.evaluateReward.mockResolvedValue(mockCampaignDecision);

      await service.resolveReward({
        customerId: 'cust-1',
        storeId: 'store-1',
        campaignContext: { eventType: 'PURCHASE_COMPLETED' },
      });

      expect(events.emit).toHaveBeenCalledWith(
        REWARD_RESOLUTION_EVENTS.CAMPAIGN_APPLIED,
        expect.anything(),
      );
    });

    it('emits MILESTONE_REACHED when a coin milestone reward is resolved', async () => {
      overridesService.previewEffectiveRewards.mockResolvedValue([
        { ...mockResolvedRules[0], ruleType: 'COIN_MILESTONE', coinRequirement: 100 },
      ]);

      await service.resolveReward({
        customerId: 'cust-1',
        storeId: 'store-1',
        coinBalance: 200,
      });

      expect(events.emit).toHaveBeenCalledWith(
        REWARD_RESOLUTION_EVENTS.MILESTONE_REACHED,
        expect.anything(),
      );
    });
  });

  describe('Redis Cache', () => {
    it('returns cached resolution if available', async () => {
      const cachedResult = {
        resolved: true,
        source: RESOLUTION_SOURCE.ASSIGNED_PROFILE,
        reason: 'cached',
      };
      cache.getResolution.mockResolvedValue(cachedResult);

      const result = await service.resolveReward({
        customerId: 'cust-1',
        storeId: 'store-1',
      });

      expect(result).toEqual(cachedResult);
      expect(overridesService.previewEffectiveRewards).not.toHaveBeenCalled();
    });

    it('caches store context for reuse', async () => {
      await service.resolveReward({
        customerId: 'cust-1',
        storeId: 'store-1',
        coinBalance: 600,
      });

      expect(cache.setStoreContext).toHaveBeenCalledWith('store-1', expect.any(Array));
    });

    it('returns cached customer summary', async () => {
      const cachedSummary = { customerId: 'cust-1', walletBalance: 500 };
      cache.getCustomerSummary.mockResolvedValue(cachedSummary);

      const result = await service.getCustomerSummary('cust-1', 'store-1');
      expect(result).toEqual(cachedSummary);
      expect(wallet.getBalance).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('returns no-reward for expired rules', async () => {
      wallet.getBalance.mockResolvedValue({ balance: 0, pendingBalance: 0 });
      overridesService.previewEffectiveRewards.mockResolvedValue([
        {
          ...mockResolvedRules[0],
          expiryDate: new Date('2020-01-01'),
          coinRequirement: 100,
        },
      ]);

      const result = await service.resolveReward({
        customerId: 'cust-1',
        storeId: 'store-1',
        coinBalance: 600,
      });

      expect(result.resolved).toBe(false);
    });

    it('returns no-reward for future rules', async () => {
      wallet.getBalance.mockResolvedValue({ balance: 0, pendingBalance: 0 });
      overridesService.previewEffectiveRewards.mockResolvedValue([
        {
          ...mockResolvedRules[0],
          validFrom: new Date('2030-01-01'),
          coinRequirement: 100,
        },
      ]);

      const result = await service.resolveReward({
        customerId: 'cust-1',
        storeId: 'store-1',
        coinBalance: 600,
      });

      expect(result.resolved).toBe(false);
    });
  });

  describe('Concurrency', () => {
    it('handles concurrent resolution calls without interference', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        service.resolveReward({
          customerId: `cust-${i}`,
          storeId: 'store-1',
          coinBalance: 600,
        }),
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach((r) => expect(r.resolved).toBe(true));
    });
  });

  describe('Customer Summary', () => {
    it('returns full summary with available milestones', async () => {
      const summary = await service.getCustomerSummary('cust-1', 'store-1');

      expect(summary.customerId).toBe('cust-1');
      expect(summary.storeId).toBe('store-1');
      expect(summary.walletBalance).toBe(750);
      expect(summary.availableMilestones.length).toBeGreaterThanOrEqual(1);
      expect(summary.profileName).toBe('Standard');
    });

    it('falls back to global default profile name', async () => {
      assignmentService.resolveStoreProfile.mockRejectedValue(new Error('Not found'));

      const summary = await service.getCustomerSummary('cust-1', 'store-1');

      expect(summary.profileName).toBe('Global Default');
    });
  });

  describe('Campaign Resolution (direct)', () => {
    it('resolves campaign reward directly', async () => {
      campaignEngine.evaluateReward.mockResolvedValue(mockCampaignDecision);

      const result = await service.resolveCampaignReward(
        'cust-1',
        'store-1',
        { eventType: 'PURCHASE_COMPLETED', purchaseAmount: 500 },
      );

      expect(result.resolved).toBe(true);
      expect(result.source).toBe(RESOLUTION_SOURCE.CAMPAIGN);
      expect(result.campaignApplied!.totalCoins).toBe(160);
    });

    it('returns no-reward when no event type', async () => {
      const result = await service.resolveCampaignReward(
        'cust-1',
        'store-1',
        {},
      );

      expect(result.resolved).toBe(false);
    });
  });

  describe('Store Reward Resolution', () => {
    it('resolves store reward through profile/override chain', async () => {
      const result = await service.resolveStoreReward('cust-1', 'store-1', undefined, 600);

      expect(result.resolved).toBe(true);
      expect(result.ruleUsed).toBeDefined();
    });
  });
});
