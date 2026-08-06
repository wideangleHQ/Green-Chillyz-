import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChallengeCacheService } from '../cache/challenge-cache.service';

describe('ChallengeCacheService', () => {
  let service: ChallengeCacheService;
  let redis: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    redis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
      delPattern: vi.fn().mockResolvedValue(undefined),
    };
    service = new ChallengeCacheService(redis as any);
  });

  // ─── List cache ─────────────────────────────────

  it('getList returns cached data', async () => {
    const data = [{ id: '1' }];
    redis.get.mockResolvedValueOnce(data);
    expect(await service.getList()).toEqual(data);
  });

  it('setList writes to redis with TTL', async () => {
    await service.setList([{ id: '1' }]);
    expect(redis.set).toHaveBeenCalledWith('challenges:list', [{ id: '1' }], 300);
  });

  // ─── Active cache ───────────────────────────────

  it('getActive returns cached data', async () => {
    redis.get.mockResolvedValueOnce([{ id: 'a' }]);
    expect(await service.getActive()).toEqual([{ id: 'a' }]);
  });

  it('setActive writes with TTL', async () => {
    await service.setActive({ test: true });
    expect(redis.set).toHaveBeenCalledWith('challenges:active', { test: true }, 300);
  });

  // ─── Single challenge ──────────────────────────

  it('getChallenge returns cached item', async () => {
    redis.get.mockResolvedValueOnce({ id: 'c1' });
    expect(await service.getChallenge('c1')).toEqual({ id: 'c1' });
  });

  it('setChallenge writes with correct key', async () => {
    await service.setChallenge('c1', { id: 'c1' });
    expect(redis.set).toHaveBeenCalledWith('challenges:item:c1', { id: 'c1' }, 300);
  });

  // ─── Customer challenges ───────────────────────

  it('getCustomerChallenges returns cached data', async () => {
    redis.get.mockResolvedValueOnce([{ challengeId: 'c1' }]);
    expect(await service.getCustomerChallenges('u1')).toEqual([{ challengeId: 'c1' }]);
  });

  it('setCustomerChallenges writes with user key', async () => {
    await service.setCustomerChallenges('u1', []);
    expect(redis.set).toHaveBeenCalledWith('challenges:customer:u1', [], 120);
  });

  // ─── Progress ──────────────────────────────────

  it('getProgress returns cached progress', async () => {
    redis.get.mockResolvedValueOnce({ currentProgress: 3 });
    expect(await service.getProgress('u1', 'c1')).toEqual({ currentProgress: 3 });
  });

  it('setProgress writes with composite key', async () => {
    await service.setProgress('u1', 'c1', { currentProgress: 3 });
    expect(redis.set).toHaveBeenCalledWith(
      'challenges:progress:u1:c1',
      { currentProgress: 3 },
      120,
    );
  });

  // ─── Invalidation ─────────────────────────────

  it('invalidateChallenge deletes item, list, and active', async () => {
    await service.invalidateChallenge('c1');
    expect(redis.del).toHaveBeenCalledWith('challenges:item:c1');
    expect(redis.del).toHaveBeenCalledWith('challenges:list');
    expect(redis.del).toHaveBeenCalledWith('challenges:active');
  });

  it('invalidateCustomer deletes customer and progress keys', async () => {
    await service.invalidateCustomer('u1');
    expect(redis.del).toHaveBeenCalledWith('challenges:customer:u1');
    expect(redis.delPattern).toHaveBeenCalledWith('challenges:progress:u1:*');
  });

  it('invalidateAll deletes all challenge keys', async () => {
    await service.invalidateAll();
    expect(redis.delPattern).toHaveBeenCalledWith('challenges:*');
  });

  // ─── Fault tolerance ──────────────────────────

  it('safeGet swallows redis errors and returns null', async () => {
    redis.get.mockRejectedValueOnce(new Error('Redis down'));
    expect(await service.getList()).toBeNull();
  });

  it('safeWrite swallows redis errors silently', async () => {
    redis.set.mockRejectedValueOnce(new Error('Redis down'));
    await expect(service.setList([])).resolves.toBeUndefined();
  });

  it('invalidateChallenge swallows redis errors', async () => {
    redis.del.mockRejectedValueOnce(new Error('Redis down'));
    await expect(service.invalidateChallenge('c1')).resolves.toBeUndefined();
  });
});
