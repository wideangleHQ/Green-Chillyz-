import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoinCalculationService } from '../services/coin-calculation.service';
import { CoinMultiplierService } from '../services/coin-multiplier.service';
import { CoinRuleResponse } from '../interfaces';

const rule = (overrides: Partial<CoinRuleResponse> = {}): CoinRuleResponse =>
  ({
    id: 'rule-1',
    name: 'Spin Wheel',
    description: null,
    ruleType: 'SPIN_WHEEL',
    coinAmount: 10,
    minCoins: null,
    maxCoins: null,
    dailyLimit: null,
    weeklyLimit: null,
    monthlyLimit: null,
    lifetimeLimit: null,
    cooldownSeconds: 0,
    enabled: true,
    priority: 0,
    status: 'ACTIVE',
    effectiveFrom: null,
    effectiveUntil: null,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    archivedAt: null,
    ...overrides,
  }) as CoinRuleResponse;

const multiplierRow = (
  id: string,
  value: number,
  stackable = false,
  priority = 0,
) => ({ id, name: `x${value}`, type: 'FLAT' as const, multiplier: value, stackable, priority });

describe('CoinCalculationService', () => {
  let service: CoinCalculationService;
  let multipliers: { resolve: ReturnType<typeof vi.fn> };
  const now = new Date('2026-08-05T10:00:00Z');

  beforeEach(() => {
    multipliers = { resolve: vi.fn().mockResolvedValue([]) };
    service = new CoinCalculationService(
      multipliers as unknown as CoinMultiplierService,
    );
  });

  // ─── Base coins ───────────────────────────────────

  describe('resolveBaseCoins', () => {
    it('uses the rule amount when nothing is requested', () => {
      expect(service.resolveBaseCoins(rule(), null)).toBe(10);
    });

    it('prefers a pre-rolled outcome', () => {
      expect(service.resolveBaseCoins(rule(), 22)).toBe(22);
    });

    it('clamps a pre-rolled outcome up to the minimum', () => {
      expect(service.resolveBaseCoins(rule({ minCoins: 15 }), 3)).toBe(15);
    });

    it('clamps a pre-rolled outcome down to the maximum', () => {
      expect(service.resolveBaseCoins(rule({ maxCoins: 25 }), 900)).toBe(25);
    });

    it('never resolves below zero', () => {
      expect(service.resolveBaseCoins(rule({ coinAmount: 0 }), -50)).toBe(0);
    });
  });

  // ─── Multiplier combination ───────────────────────

  describe('combineMultipliers', () => {
    it('returns the neutral factor when none apply', () => {
      const result = service.combineMultipliers([]);
      expect(result.multiplier).toBe(1);
      expect(result.applied).toEqual([]);
    });

    it('takes only the strongest of the non-stackable set', () => {
      const result = service.combineMultipliers([
        multiplierRow('a', 1.5),
        multiplierRow('b', 2),
      ]);
      expect(result.multiplier).toBe(2);
      expect(result.applied).toHaveLength(1);
    });

    it('compounds stackable multipliers', () => {
      const result = service.combineMultipliers([
        multiplierRow('a', 2, true),
        multiplierRow('b', 1.5, true),
      ]);
      expect(result.multiplier).toBe(3);
      expect(result.applied).toHaveLength(2);
    });

    it('compounds the strongest exclusive with the stackable ones', () => {
      const result = service.combineMultipliers([
        multiplierRow('a', 2),
        multiplierRow('b', 3),
        multiplierRow('c', 1.5, true),
      ]);
      expect(result.multiplier).toBe(4.5);
    });

    it('caps a runaway product at the ceiling', () => {
      const result = service.combineMultipliers([
        multiplierRow('a', 50, true),
        multiplierRow('b', 50, true),
      ]);
      expect(result.multiplier).toBe(100);
    });
  });

  // ─── Full calculation ─────────────────────────────

  describe('calculate', () => {
    it('multiplies the base coins', async () => {
      multipliers.resolve.mockResolvedValue([multiplierRow('a', 2)]);
      const result = await service.calculate(rule(), { userId: 'u1' }, now, null);
      expect(result.baseCoins).toBe(10);
      expect(result.multiplier).toBe(2);
      expect(result.finalCoins).toBe(20);
    });

    it('rounds a fractional product', async () => {
      multipliers.resolve.mockResolvedValue([multiplierRow('a', 1.5)]);
      const result = await service.calculate(
        rule({ coinAmount: 7 }),
        { userId: 'u1' },
        now,
        null,
      );
      expect(result.finalCoins).toBe(11);
    });

    it('clamps the multiplied total to maxCoins', async () => {
      multipliers.resolve.mockResolvedValue([multiplierRow('a', 10)]);
      const result = await service.calculate(
        rule({ maxCoins: 25 }),
        { userId: 'u1' },
        now,
        null,
      );
      expect(result.finalCoins).toBe(25);
      expect(result.clampedByMaxCoins).toBe(true);
    });

    it('clamps to the remaining limit headroom', async () => {
      const result = await service.calculate(rule(), { userId: 'u1' }, now, 4);
      expect(result.finalCoins).toBe(4);
      expect(result.clampedByLimit).toBe(true);
    });

    it('resolves to zero when there is no headroom left', async () => {
      const result = await service.calculate(rule(), { userId: 'u1' }, now, 0);
      expect(result.finalCoins).toBe(0);
    });

    it('applies the max clamp before the limit clamp', async () => {
      multipliers.resolve.mockResolvedValue([multiplierRow('a', 10)]);
      const result = await service.calculate(
        rule({ maxCoins: 25 }),
        { userId: 'u1' },
        now,
        40,
      );
      expect(result.finalCoins).toBe(25);
      expect(result.clampedByMaxCoins).toBe(true);
      expect(result.clampedByLimit).toBe(false);
    });

    it('reports the multipliers it applied', async () => {
      multipliers.resolve.mockResolvedValue([multiplierRow('a', 2)]);
      const result = await service.calculate(rule(), { userId: 'u1' }, now, null);
      expect(result.multipliersApplied).toEqual([
        { id: 'a', name: 'x2', type: 'FLAT', multiplier: 2 },
      ]);
    });

    it('passes the store scope through to multiplier resolution', async () => {
      await service.calculate(rule(), { userId: 'u1', storeId: 'store-1' }, now, null);
      expect(multipliers.resolve).toHaveBeenCalledWith(
        'rule-1',
        'SPIN_WHEEL',
        'store-1',
        now,
      );
    });
  });
});
