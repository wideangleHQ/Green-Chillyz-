import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { RewardStatus, RewardType, RewardAvailability } from '@prisma/client';
import { RewardCatalogService } from './reward-catalog.service';
import { PrismaService } from '../../../database/prisma.service';
import { RewardsCacheService } from './rewards-cache.service';
import { REWARDS_ERRORS } from '../constants';

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'reward-1',
  title: 'Free Coffee',
  slug: 'free-coffee',
  shortDescription: 'A hot one',
  description: 'Full description',
  image: null,
  bannerImage: null,
  coinCost: 100,
  cashAmount: null,
  rewardType: RewardType.FREE_ITEM,
  availability: RewardAvailability.GLOBAL,
  status: RewardStatus.PUBLISHED,
  isFeatured: true,
  priority: 5,
  stock: 20,
  dailyLimit: null,
  userLimit: null,
  minimumLoyaltyTier: null,
  validFrom: null,
  validUntil: null,
  voucherValidDays: 30,
  totalRedemptions: 3,
  terms: 'Terms apply',
  metadata: null,
  category: { id: 'cat-1', name: 'Beverages', slug: 'beverages' },
  brand: null,
  storeLinks: [],
  ...overrides,
});

const query = (extra: Record<string, unknown> = {}) => ({
  page: 1,
  pageSize: 20,
  get skip() { return 0; },
  get take() { return 20; },
  ...extra,
}) as never;

describe('RewardCatalogService', () => {
  let service: RewardCatalogService;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    prisma = {
      reward: {
        findMany: vi.fn().mockResolvedValue([makeRow()]),
        findUnique: vi.fn().mockResolvedValue(makeRow()),
        count: vi.fn().mockResolvedValue(1),
        create: vi.fn().mockResolvedValue({ id: 'reward-1', slug: 'free-coffee' }),
        update: vi.fn().mockResolvedValue(makeRow()),
        delete: vi.fn(),
      },
      rewardCategory: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
        update: vi.fn(),
      },
      rewardRedemption: { count: vi.fn().mockResolvedValue(0) },
    };

    cache = {
      buildCatalogKey: vi.fn().mockReturnValue('rewards:catalog:abc'),
      getCatalog: vi.fn().mockResolvedValue(null),
      setCatalog: vi.fn(),
      getDetail: vi.fn().mockResolvedValue(null),
      setDetail: vi.fn(),
      getCategories: vi.fn().mockResolvedValue(null),
      setCategories: vi.fn(),
      getFeatured: vi.fn().mockResolvedValue(null),
      setFeatured: vi.fn(),
      getPopular: vi.fn().mockResolvedValue(null),
      setPopular: vi.fn(),
      invalidateReward: vi.fn(),
      invalidateListings: vi.fn(),
      invalidateCategories: vi.fn(),
    };

    const eventEmitter = { emit: vi.fn(), emitAsync: vi.fn() };

    service = new RewardCatalogService(
      prisma as unknown as PrismaService,
      cache as unknown as RewardsCacheService,
      eventEmitter as unknown as EventEmitter2,
    );
  });

  describe('listCatalog', () => {
    it('should return paginated published rewards', async () => {
      const result = await service.listCatalog(query());

      expect(result.items).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
      expect(cache.setCatalog).toHaveBeenCalled();
    });

    it('should serve from cache without hitting the database', async () => {
      cache.getCatalog.mockResolvedValue({ items: [], meta: { totalItems: 0 } });

      const result = await service.listCatalog(query());

      expect(result.items).toEqual([]);
      expect(prisma.reward.findMany).not.toHaveBeenCalled();
    });

    it('should only ever query published rewards', async () => {
      await service.listCatalog(query());

      const where = prisma.reward.findMany.mock.calls[0][0].where;
      expect(where.status).toBe(RewardStatus.PUBLISHED);
    });

    it('should apply a search filter', async () => {
      await service.listCatalog(query({ search: 'coffee' }));

      const where = prisma.reward.findMany.mock.calls[0][0].where;
      expect(where.OR).toBeDefined();
    });

    it('should apply a category filter by slug', async () => {
      await service.listCatalog(query({ category: 'beverages' }));

      const where = prisma.reward.findMany.mock.calls[0][0].where;
      expect(where.category).toEqual({ slug: 'beverages' });
    });

    it('should apply a coin ceiling', async () => {
      await service.listCatalog(query({ maxCoinCost: 200 }));

      const where = prisma.reward.findMany.mock.calls[0][0].where;
      expect(where.coinCost).toEqual({ lte: 200 });
    });

    it('should sort by coin cost ascending on request', async () => {
      await service.listCatalog(query({ sort: 'coinCostAsc' }));

      const orderBy = prisma.reward.findMany.mock.calls[0][0].orderBy;
      expect(orderBy[0]).toEqual({ coinCost: 'asc' });
    });
  });

  describe('getDetail', () => {
    it('should resolve by slug', async () => {
      const result = await service.getDetail('free-coffee');

      expect(result.title).toBe('Free Coffee');
      expect(prisma.reward.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug: 'free-coffee' } }),
      );
    });

    it('should resolve by uuid', async () => {
      await service.getDetail('11111111-1111-4111-8111-111111111111');

      expect(prisma.reward.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '11111111-1111-4111-8111-111111111111' },
        }),
      );
    });

    it('should throw when missing', async () => {
      prisma.reward.findUnique.mockResolvedValue(null);

      await expect(service.getDetail('nope')).rejects.toThrow(NotFoundException);
    });

    it('should serve a cached detail', async () => {
      cache.getDetail.mockResolvedValue({ id: 'cached' });

      const result = await service.getDetail('free-coffee');

      expect(result.id).toBe('cached');
      expect(prisma.reward.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const dto = {
      title: 'New Reward',
      slug: 'new-reward',
      coinCost: 50,
    };

    it('should create and invalidate listings', async () => {
      prisma.reward.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValue(makeRow());

      await service.create(dto as never, 'admin-1');

      expect(prisma.reward.create).toHaveBeenCalled();
      expect(cache.invalidateListings).toHaveBeenCalled();
    });

    it('should reject a duplicate slug', async () => {
      prisma.reward.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.create(dto as never, 'admin-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should reject an inverted validity window', async () => {
      prisma.reward.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          { ...dto, validFrom: '2026-12-01', validUntil: '2026-01-01' } as never,
          'admin-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should link stores when provided', async () => {
      prisma.reward.findUnique.mockResolvedValueOnce(null).mockResolvedValue(makeRow());

      await service.create({ ...dto, storeIds: ['store-1', 'store-2'] } as never, 'admin-1');

      const data = prisma.reward.create.mock.calls[0][0].data;
      expect(data.storeLinks.create).toHaveLength(2);
    });
  });

  describe('updateStatus', () => {
    it('should publish a reward and invalidate cache', async () => {
      await service.updateStatus('reward-1', RewardStatus.PUBLISHED);

      expect(prisma.reward.update).toHaveBeenCalledWith({
        where: { id: 'reward-1' },
        data: { status: RewardStatus.PUBLISHED },
      });
      expect(cache.invalidateReward).toHaveBeenCalled();
    });

    it('should throw when the reward is missing', async () => {
      prisma.reward.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('missing', RewardStatus.PUBLISHED),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('adjustStock', () => {
    it('should set stock and invalidate cache', async () => {
      await service.adjustStock('reward-1', 42);

      expect(prisma.reward.update).toHaveBeenCalledWith({
        where: { id: 'reward-1' },
        data: { stock: 42 },
      });
      expect(cache.invalidateReward).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should hard-delete a reward with no redemptions', async () => {
      await service.delete('reward-1');

      expect(prisma.reward.delete).toHaveBeenCalledWith({ where: { id: 'reward-1' } });
    });

    it('should archive a reward that has redemption history', async () => {
      prisma.rewardRedemption.count.mockResolvedValue(5);

      await service.delete('reward-1');

      expect(prisma.reward.delete).not.toHaveBeenCalled();
      expect(prisma.reward.update).toHaveBeenCalledWith({
        where: { id: 'reward-1' },
        data: { status: RewardStatus.ARCHIVED },
      });
    });

    it('should throw when missing', async () => {
      prisma.reward.findUnique.mockResolvedValue(null);

      await expect(service.delete('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCategory', () => {
    it('should reject a duplicate slug', async () => {
      prisma.rewardCategory.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createCategory({ name: 'Food', slug: 'food' } as never),
      ).rejects.toThrow(ConflictException);
    });

    it('should create and invalidate category cache', async () => {
      prisma.rewardCategory.create.mockResolvedValue({
        id: 'cat-1', name: 'Food', slug: 'food',
        description: null, icon: null, sortOrder: 0,
      });

      const result = await service.createCategory({ name: 'Food', slug: 'food' } as never);

      expect(result.slug).toBe('food');
      expect(cache.invalidateCategories).toHaveBeenCalled();
    });
  });

  describe('listCategories', () => {
    it('should include published reward counts', async () => {
      prisma.rewardCategory.findMany.mockResolvedValue([
        {
          id: 'cat-1', name: 'Food', slug: 'food',
          description: null, icon: null, sortOrder: 0,
          _count: { rewards: 7 },
        },
      ]);

      const result = await service.listCategories();

      expect(result[0].rewardCount).toBe(7);
      expect(cache.setCategories).toHaveBeenCalled();
    });
  });
});
