import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { CoinMultiplierService } from '../services/coin-multiplier.service';
import { CoinMultiplierRepository } from '../repositories/coin-multiplier.repository';
import { CoinEconomyCacheService } from '../cache/coin-economy-cache.service';
import { COIN_ECONOMY_EVENTS } from '../constants';

const mockMultiplier = {
  id: 'mult-1',
  name: 'Weekend Bonus',
  description: null,
  type: 'FLAT',
  multiplier: new Prisma.Decimal(2),
  ruleId: null,
  ruleType: null,
  storeId: null,
  campaignReference: null,
  daysOfWeek: [],
  stackable: false,
  priority: 0,
  enabled: true,
  status: 'ACTIVE',
  effectiveFrom: null,
  effectiveUntil: null,
  createdBy: 'admin-1',
  updatedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
} as any;

describe('CoinMultiplierService', () => {
  let service: CoinMultiplierService;
  let repo: Record<string, ReturnType<typeof vi.fn>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;
  let events: { emit: ReturnType<typeof vi.fn> };
  const now = new Date('2026-08-05T10:00:00Z');

  beforeEach(() => {
    repo = {
      findMany: vi.fn().mockResolvedValue([[mockMultiplier], 1]),
      findById: vi.fn().mockResolvedValue(mockMultiplier),
      findCandidates: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(mockMultiplier),
      update: vi.fn().mockResolvedValue(mockMultiplier),
      softDelete: vi.fn().mockResolvedValue(undefined),
      restore: vi.fn().mockResolvedValue(mockMultiplier),
    };

    cache = {
      getMultipliers: vi.fn().mockResolvedValue(null),
      setMultipliers: vi.fn().mockResolvedValue(undefined),
      invalidateMultipliers: vi.fn().mockResolvedValue(undefined),
    };

    events = { emit: vi.fn() };

    service = new CoinMultiplierService(
      repo as unknown as CoinMultiplierRepository,
      cache as unknown as CoinEconomyCacheService,
      events as unknown as EventEmitter2,
    );
  });

  // ─── Resolve engine ───────────────────────────────

  describe('resolve', () => {
    it('returns an empty list when no candidates exist', async () => {
      const result = await service.resolve('rule-1', 'SPIN_WHEEL' as any, null, now);
      expect(result).toEqual([]);
    });

    it('filters out candidates with a campaign reference', async () => {
      repo.findCandidates.mockResolvedValue([
        { ...mockMultiplier, campaignReference: 'campaign-1' },
      ]);
      const result = await service.resolve('rule-1', 'SPIN_WHEEL' as any, null, now);
      expect(result).toEqual([]);
    });

    it('filters by effective date range', async () => {
      repo.findCandidates.mockResolvedValue([
        {
          ...mockMultiplier,
          effectiveFrom: new Date('2027-01-01'),
          effectiveUntil: null,
        },
      ]);
      const result = await service.resolve('rule-1', 'SPIN_WHEEL' as any, null, now);
      expect(result).toEqual([]);
    });

    it('filters by day of week', async () => {
      const wednesday = new Date('2026-08-05T10:00:00Z'); // Wednesday = 3
      repo.findCandidates.mockResolvedValue([
        { ...mockMultiplier, daysOfWeek: [0, 6] }, // Sunday and Saturday only
      ]);
      const result = await service.resolve(
        'rule-1',
        'SPIN_WHEEL' as any,
        null,
        wednesday,
      );
      expect(result).toEqual([]);
    });

    it('includes candidates matching the current day', async () => {
      const wednesday = new Date('2026-08-05T10:00:00Z');
      repo.findCandidates.mockResolvedValue([
        { ...mockMultiplier, daysOfWeek: [3] },
      ]);
      const result = await service.resolve(
        'rule-1',
        'SPIN_WHEEL' as any,
        null,
        wednesday,
      );
      expect(result).toHaveLength(1);
    });

    it('includes candidates with empty daysOfWeek (all days)', async () => {
      repo.findCandidates.mockResolvedValue([mockMultiplier]);
      const result = await service.resolve('rule-1', 'SPIN_WHEEL' as any, null, now);
      expect(result).toHaveLength(1);
    });

    it('sorts by priority descending, then multiplier descending', async () => {
      repo.findCandidates.mockResolvedValue([
        { ...mockMultiplier, id: 'a', priority: 1, multiplier: new Prisma.Decimal(1.5) },
        { ...mockMultiplier, id: 'b', priority: 2, multiplier: new Prisma.Decimal(1.2) },
        { ...mockMultiplier, id: 'c', priority: 1, multiplier: new Prisma.Decimal(3) },
      ]);
      const result = await service.resolve('rule-1', 'SPIN_WHEEL' as any, null, now);
      expect(result.map((r) => r.id)).toEqual(['b', 'c', 'a']);
    });

    it('uses cache when available', async () => {
      cache.getMultipliers.mockResolvedValue([mockMultiplier]);
      await service.resolve('rule-1', 'SPIN_WHEEL' as any, null, now);
      expect(repo.findCandidates).not.toHaveBeenCalled();
    });
  });

  // ─── CRUD ─────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated results', async () => {
      const result = await service.findAll({});
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findById', () => {
    it('throws when not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const base = {
      name: 'Weekend 2x',
      multiplier: 2,
    };

    it('creates and emits MULTIPLIER_CHANGED', async () => {
      await service.create(base as any, 'admin-1');
      expect(repo.create).toHaveBeenCalled();
      expect(events.emit).toHaveBeenCalledWith(
        COIN_ECONOMY_EVENTS.MULTIPLIER_CHANGED,
        expect.any(Object),
      );
    });

    it('invalidates cache after creation', async () => {
      await service.create(base as any);
      expect(cache.invalidateMultipliers).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates and emits with old/new values', async () => {
      const updated = { ...mockMultiplier, multiplier: new Prisma.Decimal(3) };
      repo.update.mockResolvedValue(updated);
      await service.update('mult-1', { multiplier: 3 } as any, 'admin-1');
      expect(events.emit).toHaveBeenCalledWith(
        COIN_ECONOMY_EVENTS.MULTIPLIER_CHANGED,
        expect.objectContaining({
          oldMultiplier: 2,
          newMultiplier: 3,
        }),
      );
    });

    it('throws when not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.update('nope', { multiplier: 2 } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('archive / restore', () => {
    it('archives and emits', async () => {
      await service.archive('mult-1', 'admin-1');
      expect(repo.softDelete).toHaveBeenCalled();
      expect(events.emit).toHaveBeenCalledWith(
        COIN_ECONOMY_EVENTS.MULTIPLIER_CHANGED,
        expect.any(Object),
      );
    });

    it('throws when archiving a missing multiplier', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.archive('nope')).rejects.toThrow(NotFoundException);
    });

    it('restores and emits', async () => {
      await service.restore('mult-1', 'admin-1');
      expect(repo.restore).toHaveBeenCalled();
      expect(events.emit).toHaveBeenCalledWith(
        COIN_ECONOMY_EVENTS.MULTIPLIER_CHANGED,
        expect.any(Object),
      );
    });

    it('invalidates cache on archive and restore', async () => {
      await service.archive('mult-1');
      await service.restore('mult-1');
      expect(cache.invalidateMultipliers).toHaveBeenCalledTimes(2);
    });
  });
});
