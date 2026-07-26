import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { NotificationType, NotificationPriority } from '@prisma/client';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationCacheService } from './notification-cache.service';
import { PrismaService } from '../../../database/prisma.service';
import { NOTIFICATION_ERRORS } from '../constants';

const template = {
  id: 'tpl-1',
  key: 'wallet.credited',
  name: 'Wallet Credited',
  description: null,
  type: NotificationType.WALLET,
  priority: NotificationPriority.NORMAL,
  titleTemplate: 'You earned {{amount}} coins',
  bodyTemplate: '{{description}} Balance is now {{newBalance}} coins.',
  icon: 'coins',
  actionLabel: 'View Wallet',
  actionUrl: '/wallet',
  channels: ['IN_APP'],
  expiryDays: null,
  isActive: true,
};

describe('NotificationTemplateService', () => {
  let service: NotificationTemplateService;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    prisma = {
      notificationTemplate: {
        findUnique: vi.fn().mockResolvedValue(template),
        findMany: vi.fn().mockResolvedValue([template]),
        create: vi.fn().mockResolvedValue(template),
        update: vi.fn().mockResolvedValue(template),
      },
    };
    cache = {
      getTemplate: vi.fn().mockResolvedValue(null),
      setTemplate: vi.fn(),
      invalidateTemplate: vi.fn(),
    };

    service = new NotificationTemplateService(
      prisma as unknown as PrismaService,
      cache as unknown as NotificationCacheService,
    );
  });

  describe('interpolate', () => {
    it('should substitute variables', () => {
      const result = service.interpolate('You earned {{amount}} coins', {
        amount: 50,
      });

      expect(result).toBe('You earned 50 coins');
    });

    it('should tolerate whitespace inside braces', () => {
      expect(service.interpolate('Hi {{ name }}', { name: 'Ada' })).toBe('Hi Ada');
    });

    it('should substitute repeated tokens', () => {
      const result = service.interpolate('{{a}} and {{a}}', { a: 'x' });

      expect(result).toBe('x and x');
    });

    it('should blank an unknown token rather than leak the placeholder', () => {
      const result = service.interpolate('Hello {{missing}} there', {});

      expect(result).not.toContain('{{');
      expect(result).toBe('Hello there');
    });

    it('should blank a null value', () => {
      expect(service.interpolate('X{{v}}Y', { v: null })).toBe('XY');
    });

    it('should strip angle brackets to prevent markup injection', () => {
      const result = service.interpolate('Hi {{name}}', {
        name: '<script>alert(1)</script>',
      });

      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should render numbers and booleans', () => {
      expect(service.interpolate('{{n}}/{{b}}', { n: 42, b: true })).toBe('42/true');
    });
  });

  describe('resolve', () => {
    it('should build a deliverable notification', async () => {
      const result = await service.resolve('wallet.credited', 'user-1', {
        amount: 50,
        newBalance: 550,
        description: 'Cashback.',
      });

      expect(result).not.toBeNull();
      expect(result?.title).toBe('You earned 50 coins');
      expect(result?.message).toBe('Cashback. Balance is now 550 coins.');
      expect(result?.type).toBe(NotificationType.WALLET);
      expect(result?.userId).toBe('user-1');
    });

    it('should carry the template key through', async () => {
      const result = await service.resolve('wallet.credited', 'user-1', {});

      expect(result?.templateKey).toBe('wallet.credited');
    });

    it('should set a default expiry', async () => {
      const result = await service.resolve('wallet.credited', 'user-1', {});

      expect(result?.expiresAt).toBeInstanceOf(Date);
      expect(result!.expiresAt!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should honour a template expiry override', async () => {
      prisma.notificationTemplate.findUnique.mockResolvedValue({
        ...template,
        expiryDays: 1,
      });

      const result = await service.resolve('wallet.credited', 'user-1', {});
      const diff = result!.expiresAt!.getTime() - Date.now();

      expect(diff).toBeLessThan(2 * 86_400_000);
    });

    it('should return null for a missing template', async () => {
      prisma.notificationTemplate.findUnique.mockResolvedValue(null);

      expect(await service.resolve('nope', 'user-1', {})).toBeNull();
    });

    it('should return null for an inactive template', async () => {
      prisma.notificationTemplate.findUnique.mockResolvedValue({
        ...template,
        isActive: false,
      });

      expect(await service.resolve('wallet.credited', 'user-1', {})).toBeNull();
    });

    it('should serve a cached template without querying', async () => {
      cache.getTemplate.mockResolvedValue(template);

      await service.resolve('wallet.credited', 'user-1', {});

      expect(prisma.notificationTemplate.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a template', async () => {
      prisma.notificationTemplate.findUnique.mockResolvedValue(null);

      const result = await service.create({
        key: 'custom.thing',
        name: 'Custom',
        titleTemplate: 'T',
        bodyTemplate: 'B',
      } as never);

      expect(result.key).toBe('wallet.credited');
      expect(prisma.notificationTemplate.create).toHaveBeenCalled();
    });

    it('should reject a duplicate key', async () => {
      await expect(
        service.create({
          key: 'wallet.credited',
          name: 'Dup',
          titleTemplate: 'T',
          bodyTemplate: 'B',
        } as never),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update and invalidate the cache', async () => {
      await service.update('wallet.credited', { name: 'Renamed' } as never);

      expect(cache.invalidateTemplate).toHaveBeenCalledWith('wallet.credited');
    });

    it('should throw when the template is missing', async () => {
      prisma.notificationTemplate.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nope', { name: 'X' } as never),
      ).rejects.toThrow(NOTIFICATION_ERRORS.TEMPLATE_NOT_FOUND);
    });
  });

  describe('seedDefaults', () => {
    it('should skip templates that already exist', async () => {
      const created = await service.seedDefaults();

      expect(created).toBe(0);
      expect(prisma.notificationTemplate.create).not.toHaveBeenCalled();
    });

    it('should create missing built-in templates', async () => {
      prisma.notificationTemplate.findUnique.mockResolvedValue(null);

      const created = await service.seedDefaults();

      expect(created).toBeGreaterThan(0);
    });

    it('should not throw on boot when the database is unavailable', async () => {
      prisma.notificationTemplate.findUnique.mockRejectedValue(new Error('db down'));

      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });
  });
});
