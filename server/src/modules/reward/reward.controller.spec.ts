import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RewardEventType, RewardSourceType, CampaignStatus, TransactionType } from '@prisma/client';
import { RewardController } from './reward.controller';
import { RewardEngineService, CampaignService } from './services';

const mockUser = {
  sub: 'admin-uuid',
  email: 'admin@test.com',
  roles: [{ role: 'ADMIN', storeId: null }],
  permissions: [
    'REWARD_GRANT',
    'REWARD_CAMPAIGN_CREATE',
    'REWARD_CAMPAIGN_UPDATE',
    'REWARD_CAMPAIGN_VIEW',
    'REWARD_HISTORY_VIEW',
  ],
  tokenVersion: 1,
  permissionsVersion: 1,
  sessionId: 'session-1',
};

const mockReq = {
  ip: '127.0.0.1',
  headers: { 'user-agent': 'TestAgent/1.0' },
} as any;

describe('RewardController', () => {
  let controller: RewardController;
  let engine: Record<string, ReturnType<typeof vi.fn>>;
  let campaignSvc: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    engine = {
      evaluateReward: vi.fn(),
    };
    campaignSvc = {
      create: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      addRule: vi.fn(),
      removeRule: vi.fn(),
      getRules: vi.fn(),
      getHistory: vi.fn(),
    };
    controller = new RewardController(
      engine as unknown as RewardEngineService,
      campaignSvc as unknown as CampaignService,
    );
  });

  describe('evaluate', () => {
    it('should call engine and return decision', async () => {
      const decision = {
        rewardGranted: true,
        totalCoins: 60,
        walletTransactionType: TransactionType.CREDIT,
      };
      engine.evaluateReward.mockResolvedValue(decision);

      const dto = {
        eventType: RewardEventType.GAME_COMPLETED,
        userId: 'user-1',
        source: RewardSourceType.GAME,
      };

      const result = await controller.evaluate(dto as any, mockUser as any, mockReq);

      expect(result.rewardGranted).toBe(true);
      expect(engine.evaluateReward).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: RewardEventType.GAME_COMPLETED,
          userId: 'user-1',
          ip: '127.0.0.1',
          initiatorId: 'admin-uuid',
        }),
      );
    });
  });

  describe('createCampaign', () => {
    it('should create campaign', async () => {
      const campaign = { id: 'c1', name: 'Test' };
      campaignSvc.create.mockResolvedValue(campaign);

      const result = await controller.createCampaign({} as any, mockUser as any);

      expect(campaignSvc.create).toHaveBeenCalledWith({}, 'admin-uuid');
      expect(result.name).toBe('Test');
    });
  });

  describe('listCampaigns', () => {
    it('should delegate to service', async () => {
      campaignSvc.findAll.mockResolvedValue({ items: [], meta: {} });

      const result = await controller.listCampaigns({} as any);

      expect(result.items).toEqual([]);
    });
  });

  describe('getCampaign', () => {
    it('should return campaign by ID', async () => {
      campaignSvc.findById.mockResolvedValue({ id: 'c1' });

      const result = await controller.getCampaign('c1');

      expect(result.id).toBe('c1');
    });
  });

  describe('updateCampaignStatus', () => {
    it('should update status', async () => {
      campaignSvc.updateStatus.mockResolvedValue({ status: CampaignStatus.PAUSED });

      const result = await controller.updateCampaignStatus('c1', CampaignStatus.PAUSED);

      expect(result.status).toBe(CampaignStatus.PAUSED);
    });
  });

  describe('addRule', () => {
    it('should add rule', async () => {
      campaignSvc.addRule.mockResolvedValue({ id: 'r1', ruleType: 'DAILY_LIMIT' });

      const result = await controller.addRule({ campaignId: 'c1', ruleType: 'DAILY_LIMIT' } as any);

      expect(result.ruleType).toBe('DAILY_LIMIT');
    });
  });

  describe('removeRule', () => {
    it('should return success message', async () => {
      campaignSvc.removeRule.mockResolvedValue(undefined);

      const result = await controller.removeRule('r1');

      expect(result.message).toBe('Rule removed successfully');
    });
  });

  describe('getMyHistory', () => {
    it('should pass user sub to service', async () => {
      campaignSvc.getHistory.mockResolvedValue({ items: [], meta: {} });

      await controller.getMyHistory(mockUser as any, {} as any);

      expect(campaignSvc.getHistory).toHaveBeenCalledWith('admin-uuid', {});
    });
  });

  describe('getUserHistory', () => {
    it('should pass specific userId', async () => {
      campaignSvc.getHistory.mockResolvedValue({ items: [], meta: {} });

      await controller.getUserHistory('other-user', {} as any);

      expect(campaignSvc.getHistory).toHaveBeenCalledWith('other-user', {});
    });
  });
});
