import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerBootstrapService } from './customer-bootstrap.service';
import { UserRegisteredEvent } from '../events';
import {
  CustomerBootstrapInitializer,
  BootstrapInitializerOutcome,
} from '../interfaces';

const makeEvent = (userId = 'user-1'): UserRegisteredEvent =>
  new UserRegisteredEvent(
    userId,
    'user@test.com',
    'credentials',
    new Date('2026-07-25T10:00:00Z'),
    '127.0.0.1',
  );

const makeInitializer = (
  name: string,
  priority: number,
  outcome: Partial<BootstrapInitializerOutcome> = {},
  impl?: () => Promise<BootstrapInitializerOutcome>,
): CustomerBootstrapInitializer => ({
  name,
  priority,
  initialize: vi.fn(
    impl ??
      (async () => ({
        created: true,
        alreadyExisted: false,
        ...outcome,
      })),
  ),
});

describe('CustomerBootstrapService', () => {
  describe('bootstrap', () => {
    it('should run all initializers and report success', async () => {
      const wallet = makeInitializer('wallet', 10);
      const profile = makeInitializer('customer-profile', 20);
      const service = new CustomerBootstrapService([wallet, profile]);

      const event = makeEvent();
      const result = await service.bootstrap(event);

      expect(result.succeeded).toBe(true);
      expect(result.userId).toBe('user-1');
      expect(result.results).toHaveLength(2);
      expect(wallet.initialize).toHaveBeenCalledWith(event);
      expect(profile.initialize).toHaveBeenCalledWith(event);
    });

    it('should run initializers in priority order', async () => {
      const order: string[] = [];
      const late = makeInitializer('late', 50, {}, async () => {
        order.push('late');
        return { created: true, alreadyExisted: false };
      });
      const early = makeInitializer('early', 10, {}, async () => {
        order.push('early');
        return { created: true, alreadyExisted: false };
      });

      // Registered out of order on purpose.
      const service = new CustomerBootstrapService([late, early]);
      await service.bootstrap(makeEvent());

      expect(order).toEqual(['early', 'late']);
    });

    it('should isolate failures so one initializer never blocks others', async () => {
      const failing = makeInitializer('failing', 10, {}, async () => {
        throw new Error('DB unavailable');
      });
      const healthy = makeInitializer('healthy', 20);
      const service = new CustomerBootstrapService([failing, healthy]);

      const result = await service.bootstrap(makeEvent());

      expect(result.succeeded).toBe(false);
      expect(healthy.initialize).toHaveBeenCalled();

      const failed = result.results.find((r) => r.name === 'failing');
      expect(failed?.succeeded).toBe(false);
      expect(failed?.error).toBe('DB unavailable');

      const ok = result.results.find((r) => r.name === 'healthy');
      expect(ok?.succeeded).toBe(true);
    });

    it('should never throw out of bootstrap when an initializer fails', async () => {
      const failing = makeInitializer('failing', 10, {}, async () => {
        throw new Error('boom');
      });
      const service = new CustomerBootstrapService([failing]);

      await expect(service.bootstrap(makeEvent())).resolves.toBeDefined();
    });

    it('should be idempotent: second run reports alreadyExisted, creates nothing', async () => {
      let callCount = 0;
      const wallet = makeInitializer('wallet', 10, {}, async () => {
        callCount++;
        return callCount === 1
          ? { created: true, alreadyExisted: false }
          : { created: false, alreadyExisted: true };
      });
      const service = new CustomerBootstrapService([wallet]);
      const event = makeEvent();

      const first = await service.bootstrap(event);
      const second = await service.bootstrap(event);

      expect(first.results[0].created).toBe(true);
      expect(second.results[0].created).toBe(false);
      expect(second.results[0].alreadyExisted).toBe(true);
      expect(second.succeeded).toBe(true);
    });

    it('should succeed with no initializers registered', async () => {
      const service = new CustomerBootstrapService([]);

      const result = await service.bootstrap(makeEvent());

      expect(result.succeeded).toBe(true);
      expect(result.results).toHaveLength(0);
    });

    it('should tolerate the initializer token being absent', async () => {
      const service = new CustomerBootstrapService();

      const result = await service.bootstrap(makeEvent());

      expect(result.succeeded).toBe(true);
    });

    it('should record duration for each initializer', async () => {
      const service = new CustomerBootstrapService([makeInitializer('wallet', 10)]);

      const result = await service.bootstrap(makeEvent());

      expect(result.results[0].durationMs).toBeGreaterThanOrEqual(0);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('registerInitializer', () => {
    it('should let a future module plug in without modifying existing code', async () => {
      const service = new CustomerBootstrapService([makeInitializer('wallet', 10)]);
      const loyalty = makeInitializer('loyalty', 30);

      service.registerInitializer(loyalty);
      const result = await service.bootstrap(makeEvent());

      expect(loyalty.initialize).toHaveBeenCalled();
      expect(result.results.map((r) => r.name)).toEqual(['wallet', 'loyalty']);
    });

    it('should honour priority of a runtime-registered initializer', async () => {
      const service = new CustomerBootstrapService([makeInitializer('profile', 20)]);
      service.registerInitializer(makeInitializer('wallet', 10));

      expect(service.getInitializerNames()).toEqual(['wallet', 'profile']);
    });

    it('should ignore duplicate registration of the same name', async () => {
      const service = new CustomerBootstrapService([makeInitializer('wallet', 10)]);

      service.registerInitializer(makeInitializer('wallet', 10));

      expect(service.getInitializerNames()).toEqual(['wallet']);
    });
  });
});
