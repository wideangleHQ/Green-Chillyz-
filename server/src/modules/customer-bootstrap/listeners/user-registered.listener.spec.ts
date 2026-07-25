import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRegisteredListener } from './user-registered.listener';
import { CustomerBootstrapService } from '../services';
import { UserRegisteredEvent } from '../events';

describe('UserRegisteredListener', () => {
  let listener: UserRegisteredListener;
  let bootstrapService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    bootstrapService = {
      bootstrap: vi.fn().mockResolvedValue({
        userId: 'user-1',
        succeeded: true,
        results: [],
        durationMs: 5,
      }),
    };

    listener = new UserRegisteredListener(
      bootstrapService as unknown as CustomerBootstrapService,
    );
  });

  it('should delegate the event to the bootstrap service', async () => {
    const event = new UserRegisteredEvent(
      'user-1',
      'user@test.com',
      'credentials',
    );

    await listener.handleUserRegistered(event);

    expect(bootstrapService.bootstrap).toHaveBeenCalledWith(event);
  });

  it('should handle google-provider registrations', async () => {
    const event = new UserRegisteredEvent('user-2', 'g@test.com', 'google');

    await listener.handleUserRegistered(event);

    expect(bootstrapService.bootstrap).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' }),
    );
  });
});
