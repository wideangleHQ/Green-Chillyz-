import { describe, it, expect } from 'vitest';
import { AuditActorType } from '@prisma/client';
import {
  buildAuditContext,
  resolveActorType,
  resolveActorRole,
  encodeCursor,
  decodeCursor,
  redactSensitive,
  diffValues,
} from './audit.utils';
import { AUDIT_ERRORS } from '../constants';

describe('audit utils', () => {
  describe('buildAuditContext', () => {
    it('should extract ip, agent and trace ids', () => {
      const context = buildAuditContext({
        ip: '10.0.0.1',
        headers: {
          'user-agent': 'Chrome/1.0',
          'x-request-id': 'req-1',
          'x-correlation-id': 'corr-1',
        },
      });

      expect(context.ipAddress).toBe('10.0.0.1');
      expect(context.userAgent).toBe('Chrome/1.0');
      expect(context.requestId).toBe('req-1');
      expect(context.correlationId).toBe('corr-1');
    });

    it('should return an empty context with no request', () => {
      expect(buildAuditContext()).toEqual({});
    });

    it('should tolerate missing headers', () => {
      const context = buildAuditContext({ ip: '10.0.0.1' });

      expect(context.ipAddress).toBe('10.0.0.1');
      expect(context.requestId).toBeNull();
    });

    it('should take the first value of an array header', () => {
      const context = buildAuditContext({
        headers: { 'x-request-id': ['req-a', 'req-b'] },
      });

      expect(context.requestId).toBe('req-a');
    });

    it('should truncate an overlong user agent', () => {
      const context = buildAuditContext({
        headers: { 'user-agent': 'x'.repeat(900) },
      });

      expect(context.userAgent?.length).toBe(500);
      expect(context.device?.length).toBe(255);
    });
  });

  describe('resolveActorType', () => {
    it('should default to SYSTEM with no roles', () => {
      expect(resolveActorType()).toBe(AuditActorType.SYSTEM);
      expect(resolveActorType([])).toBe(AuditActorType.SYSTEM);
    });

    it('should map a customer role', () => {
      expect(resolveActorType([{ role: 'customer' }])).toBe(
        AuditActorType.CUSTOMER,
      );
    });

    it('should map a store manager role', () => {
      expect(resolveActorType([{ role: 'store_manager' }])).toBe(
        AuditActorType.STORE_MANAGER,
      );
    });

    it('should map a super admin role', () => {
      expect(resolveActorType([{ role: 'super_admin' }])).toBe(
        AuditActorType.SUPER_ADMIN,
      );
    });

    it('should let the highest privilege win', () => {
      expect(
        resolveActorType([{ role: 'customer' }, { role: 'super_admin' }]),
      ).toBe(AuditActorType.SUPER_ADMIN);
    });

    it('should join roles into an actor role label', () => {
      expect(resolveActorRole([{ role: 'admin' }, { role: 'manager' }])).toBe(
        'admin,manager',
      );
    });
  });

  describe('cursor', () => {
    it('should round-trip', () => {
      const at = new Date('2026-07-26T10:00:00.000Z');
      const decoded = decodeCursor(encodeCursor(at, 'audit-1'));

      expect(decoded.id).toBe('audit-1');
      expect(decoded.createdAt).toBe(at.toISOString());
    });

    it('should be opaque base64url', () => {
      const cursor = encodeCursor(new Date(), 'audit-1');

      expect(cursor).not.toContain('{');
      expect(cursor).not.toContain('audit-1');
    });

    it('should reject malformed input', () => {
      expect(() => decodeCursor('garbage')).toThrow(AUDIT_ERRORS.INVALID_CURSOR);
    });

    it('should reject a cursor missing fields', () => {
      const bad = Buffer.from(JSON.stringify({ id: 'x' })).toString('base64url');

      expect(() => decodeCursor(bad)).toThrow(AUDIT_ERRORS.INVALID_CURSOR);
    });

    it('should reject a cursor with an unparsable date', () => {
      const bad = Buffer.from(
        JSON.stringify({ createdAt: 'not-a-date', id: 'x' }),
      ).toString('base64url');

      expect(() => decodeCursor(bad)).toThrow(AUDIT_ERRORS.INVALID_CURSOR);
    });
  });

  describe('redactSensitive', () => {
    it('should redact credential fields', () => {
      const result = redactSensitive({
        email: 'a@b.com',
        password: 'hunter2',
        refreshToken: 'abc',
        apiKey: 'k',
      });

      expect(result?.email).toBe('a@b.com');
      expect(result?.password).toBe('[REDACTED]');
      expect(result?.refreshToken).toBe('[REDACTED]');
      expect(result?.apiKey).toBe('[REDACTED]');
    });

    it('should be case-insensitive', () => {
      const result = redactSensitive({ PassWord: 'x', TOKEN: 'y' });

      expect(result?.PassWord).toBe('[REDACTED]');
      expect(result?.TOKEN).toBe('[REDACTED]');
    });

    it('should recurse into nested objects', () => {
      const result = redactSensitive({
        user: { name: 'Ada', password: 'secret' },
      });

      expect((result?.user as Record<string, unknown>).password).toBe(
        '[REDACTED]',
      );
      expect((result?.user as Record<string, unknown>).name).toBe('Ada');
    });

    it('should return null for absent input', () => {
      expect(redactSensitive(null)).toBeNull();
      expect(redactSensitive(undefined)).toBeNull();
    });

    it('should leave arrays intact', () => {
      const result = redactSensitive({ tags: ['a', 'b'] });

      expect(result?.tags).toEqual(['a', 'b']);
    });
  });

  describe('diffValues', () => {
    it('should keep only changed keys', () => {
      const { oldValue, newValue } = diffValues(
        { name: 'A', coinCost: 100, slug: 'x' },
        { name: 'B', coinCost: 100, slug: 'x' },
      );

      expect(oldValue).toEqual({ name: 'A' });
      expect(newValue).toEqual({ name: 'B' });
    });

    it('should return nulls when nothing changed', () => {
      const { oldValue, newValue } = diffValues({ a: 1 }, { a: 1 });

      expect(oldValue).toBeNull();
      expect(newValue).toBeNull();
    });

    it('should include keys added or removed', () => {
      const { oldValue, newValue } = diffValues({ a: 1 }, { a: 1, b: 2 });

      expect(newValue).toEqual({ b: 2 });
    });

    it('should redact secrets inside a diff', () => {
      const { newValue } = diffValues(
        { password: 'old' },
        { password: 'new' },
      );

      expect(newValue?.password).toBe('[REDACTED]');
    });

    it('should pass through when one side is absent', () => {
      const { oldValue, newValue } = diffValues(null, { a: 1 });

      expect(oldValue).toBeNull();
      expect(newValue).toEqual({ a: 1 });
    });
  });
});
