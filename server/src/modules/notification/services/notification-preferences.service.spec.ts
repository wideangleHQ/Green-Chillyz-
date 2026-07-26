import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationType, NotificationChannel } from '@prisma/client';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationCacheService } from './notification-cache.service';
import { PrismaService } from '../../../database/prisma.service';

const defaults = {
  wallet: true,
  games: true,
  rewards: true,
  marketing: true,
  campaigns: true,
  storeUpdates: true,
  referral: true,
  security: true,
  system: true,
  inAppEnabled: true,
  pushEnabled: false,
  emailEnabled: false,
  whatsappEnabled: false,
  smsEnabled: false,
  quietHoursStart: null,
  quietHoursEnd: null,
};

describe('NotificationPreferencesService', () => {
  let service: NotificationPreferencesService;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    prisma = {
      notificationPreference: {
        upsert: vi.fn().mockResolvedValue(defaults),
      },
    };
    cache = {
      getPreferences: vi.fn().mockResolvedValue(null),
      setPreferences: vi.fn(),
      invalidatePreferences: vi.fn(),
    };

    service = new NotificationPreferencesService(
      prisma as unknown as PrismaService,
      cache as unknown as NotificationCacheService,
    );
  });

  describe('get', () => {
    it('should create permissive defaults on first read', async () => {
      const result = await service.get('user-1');

      expect(result.wallet).toBe(true);
      expect(result.inAppEnabled).toBe(true);
      expect(prisma.notificationPreference.upsert).toHaveBeenCalled();
    });

    it('should default future channels to off', async () => {
      const result = await service.get('user-1');

      expect(result.pushEnabled).toBe(false);
      expect(result.emailEnabled).toBe(false);
      expect(result.whatsappEnabled).toBe(false);
      expect(result.smsEnabled).toBe(false);
    });

    it('should serve from cache without querying', async () => {
      cache.getPreferences.mockResolvedValue(defaults);

      await service.get('user-1');

      expect(prisma.notificationPreference.upsert).not.toHaveBeenCalled();
    });

    it('should cache after a miss', async () => {
      await service.get('user-1');

      expect(cache.setPreferences).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should persist and invalidate the cache', async () => {
      prisma.notificationPreference.upsert.mockResolvedValue({
        ...defaults,
        marketing: false,
      });

      const result = await service.update('user-1', { marketing: false });

      expect(result.marketing).toBe(false);
      expect(cache.invalidatePreferences).toHaveBeenCalledWith('user-1');
    });

    it('should accept future-channel switches', async () => {
      prisma.notificationPreference.upsert.mockResolvedValue({
        ...defaults,
        pushEnabled: true,
      });

      const result = await service.update('user-1', { pushEnabled: true });

      expect(result.pushEnabled).toBe(true);
    });
  });

  describe('allows', () => {
    it('should allow an opted-in category on an enabled channel', async () => {
      const allowed = await service.allows(
        'user-1',
        NotificationType.WALLET,
        NotificationChannel.IN_APP,
      );

      expect(allowed).toBe(true);
    });

    it('should block an opted-out category', async () => {
      cache.getPreferences.mockResolvedValue({ ...defaults, marketing: false });

      const allowed = await service.allows(
        'user-1',
        NotificationType.MARKETING,
        NotificationChannel.IN_APP,
      );

      expect(allowed).toBe(false);
    });

    it('should block a disabled channel regardless of category', async () => {
      cache.getPreferences.mockResolvedValue({ ...defaults, inAppEnabled: false });

      const allowed = await service.allows(
        'user-1',
        NotificationType.WALLET,
        NotificationChannel.IN_APP,
      );

      expect(allowed).toBe(false);
    });

    it('should block a future channel that is off by default', async () => {
      const allowed = await service.allows(
        'user-1',
        NotificationType.WALLET,
        NotificationChannel.PUSH,
      );

      expect(allowed).toBe(false);
    });

    it('should allow a future channel once enabled', async () => {
      cache.getPreferences.mockResolvedValue({ ...defaults, pushEnabled: true });

      const allowed = await service.allows(
        'user-1',
        NotificationType.WALLET,
        NotificationChannel.PUSH,
      );

      expect(allowed).toBe(true);
    });

    it('should allow unmapped types such as ORDER', async () => {
      const allowed = await service.allows(
        'user-1',
        NotificationType.ORDER,
        NotificationChannel.IN_APP,
      );

      expect(allowed).toBe(true);
    });

    it('should map REDEMPTION onto the rewards switch', async () => {
      cache.getPreferences.mockResolvedValue({ ...defaults, rewards: false });

      const allowed = await service.allows(
        'user-1',
        NotificationType.REDEMPTION,
        NotificationChannel.IN_APP,
      );

      expect(allowed).toBe(false);
    });
  });
});
