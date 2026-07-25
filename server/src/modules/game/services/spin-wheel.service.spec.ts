import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpinWheelService } from './spin-wheel.service';
import { GameRegistry } from '../registry/game.registry';
import { PrismaService } from '../../../database/prisma.service';

describe('SpinWheelService', () => {
  let service: SpinWheelService;
  let registry: any;
  let prisma: any;

  beforeEach(() => {
    registry = {
      register: vi.fn(),
    };
    prisma = {
      rewardCampaign: { findUnique: vi.fn() },
      user: { findFirst: vi.fn() },
    };

    service = new SpinWheelService(
      registry as unknown as GameRegistry,
      prisma as unknown as PrismaService,
    );
  });

  describe('validateStart', () => {
    it('should throw if config has no slices', async () => {
      const game = { rewardConfig: {} } as any;
      await expect(service.validateStart('u1', game, {})).rejects.toThrow();
    });

    it('should choose slice based on weight and populate clientData', async () => {
      const game = {
        rewardConfig: {
          slices: [
            { id: 's1', campaignSlug: 'c1', weight: 100, label: '10 Coins' },
          ],
        },
      } as any;
      const clientData: any = {};
      await service.validateStart('u1', game, clientData);

      expect(clientData.outcomeSliceId).toBe('s1');
      expect(clientData.outcomeCampaignSlug).toBe('c1');
    });
  });

  describe('validateEnd', () => {
    it('should return invalid if expected outcome metadata is missing', async () => {
      const session = { metadata: {} } as any;
      const result = await service.validateEnd('u1', session, { sliceId: 's1' });

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('no pre-determined outcome');
    });

    it('should return invalid if claimed slice does not match expected slice', async () => {
      const session = { metadata: { outcomeSliceId: 's1' } } as any;
      const result = await service.validateEnd('u1', session, { sliceId: 's2' });

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('manipulation detected');
    });

    it('should return valid with no reward event if campaignSlug is empty', async () => {
      const session = { metadata: { outcomeSliceId: 's1', outcomeCampaignSlug: null } } as any;
      const result = await service.validateEnd('u1', session, { sliceId: 's1' });

      expect(result.isValid).toBe(true);
      expect(result.rewardEvent).toBeUndefined();
    });

    it('should return valid with reward event if campaignSlug exists', async () => {
      const session = { id: 'sess-123', metadata: { outcomeSliceId: 's1', outcomeCampaignSlug: 'camp-1' } } as any;
      prisma.rewardCampaign.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.user.findFirst.mockResolvedValue({ customerProfile: { assignedStoreId: 'store-123' } });

      const result = await service.validateEnd('u1', session, { sliceId: 's1' });

      expect(result.isValid).toBe(true);
      expect(result.rewardEvent).toBeDefined();
      expect(result.rewardEvent?.metadata?.campaignSlug).toBe('camp-1');
    });
  });
});
