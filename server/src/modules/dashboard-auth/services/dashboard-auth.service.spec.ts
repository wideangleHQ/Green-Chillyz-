import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ForbiddenException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseException } from '../../../common/exceptions/base.exception';
import { DashboardStoreRepository } from '../repositories';
import { DashboardAccessCodeService } from './dashboard-access-code.service';
import { DashboardAuthService } from './dashboard-auth.service';
import { DashboardCodeCipherService } from './dashboard-code-cipher.service';
import { DashboardCacheService } from './dashboard-cache.service';
import { DashboardLoginThrottleService } from './dashboard-login-throttle.service';
import { DashboardSessionService } from './dashboard-session.service';
import { DashboardTokenService } from './dashboard-token.service';
import {
  DASHBOARD_AUTH_ERRORS,
  DASHBOARD_EVENTS,
  DASHBOARD_SESSION_REVOKE_REASONS,
} from '../constants';
import {
  DashboardPermissionResolver,
  DashboardPrincipal,
  DashboardRequestContext,
  DashboardRoleResolver,
  DashboardStoreScopeResolver,
} from '../interfaces';

const CONTEXT: DashboardRequestContext = {
  ipAddress: '203.0.113.10',
  userAgent: 'vitest',
  deviceFingerprint: null,
};

const PRINCIPAL: DashboardPrincipal = {
  storeId: 'store-1',
  sessionId: 'session-1',
  slug: 'greenchillyz-patia',
  scope: { storeId: 'store-1', brandId: 'brand-1', scopeType: 'STORE' },
  role: 'STORE_DASHBOARD',
  permissionsProfile: 'STORE_DASHBOARD',
  permissions: [],
};

function credential(overrides: Record<string, unknown> = {}) {
  return {
    id: 'store-1',
    slug: 'greenchillyz-patia',
    brandId: 'brand-1',
    isActive: true,
    deletedAt: null,
    dashboardCodeHash: '$argon2id$hash',
    dashboardAccessEnabled: true,
    dashboardFailedAttempts: 0,
    dashboardLockedUntil: null,
    ...overrides,
  };
}

function storeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'store-1',
    name: 'GreenChillyz Patia',
    slug: 'greenchillyz-patia',
    code: 'PAT',
    city: 'Bhubaneswar',
    state: 'Odisha',
    isActive: true,
    brandId: 'brand-1',
    dashboardAccessEnabled: true,
    brand: { id: 'brand-1', name: 'GreenChillyz', slug: 'greenchillyz' },
    ...overrides,
  };
}

describe('DashboardAuthService', () => {
  let service: DashboardAuthService;
  let storeRepository: Record<string, ReturnType<typeof vi.fn>>;
  let accessCodeService: Record<string, ReturnType<typeof vi.fn>>;
  let tokenService: Record<string, ReturnType<typeof vi.fn>>;
  let sessionService: Record<string, ReturnType<typeof vi.fn>>;
  let cache: Record<string, ReturnType<typeof vi.fn>>;
  let cipher: Record<string, ReturnType<typeof vi.fn>>;
  let throttle: Record<string, ReturnType<typeof vi.fn>>;
  let eventEmitter: { emit: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    storeRepository = {
      findCredentialByLookup: vi.fn().mockResolvedValue(credential()),
      findContextById: vi.fn().mockResolvedValue(storeRow()),
      findAccessStateById: vi.fn().mockResolvedValue({
        id: 'store-1',
        isActive: true,
        deletedAt: null,
        dashboardAccessEnabled: true,
      }),
      setAccessCode: vi.fn().mockResolvedValue(undefined),
    };
    accessCodeService = {
      lookupIndex: vi.fn().mockReturnValue('lookup-1'),
      verify: vi.fn().mockResolvedValue(true),
      generate: vi.fn().mockResolvedValue({
        code: 'GC-PAT-NEWCODE1',
        codeHash: '$argon2id$new',
        codeLookup: 'lookup-2',
      }),
    };
    tokenService = {
      issueRefreshToken: vi.fn().mockReturnValue({
        rawToken: 'raw-refresh',
        tokenHash: 'hash-1',
        familyId: 'family-1',
        expiresAt: new Date(Date.now() + 604_800_000),
      }),
      signAccessToken: vi.fn().mockReturnValue('signed-access-token'),
      hashRefreshToken: vi.fn().mockReturnValue('hash-1'),
    };
    sessionService = {
      createSession: vi.fn().mockResolvedValue({ id: 'session-1' }),
      validateRefreshToken: vi.fn(),
      rotate: vi.fn().mockResolvedValue(undefined),
      revokeSession: vi.fn().mockResolvedValue(undefined),
      revokeAllSessions: vi.fn().mockResolvedValue(['session-1']),
      revokeSessionForStore: vi.fn().mockResolvedValue(undefined),
      listSessions: vi.fn().mockResolvedValue([]),
      getSessionSummary: vi.fn().mockResolvedValue({ id: 'session-1' }),
    };
    cache = {
      getTokenVersion: vi.fn().mockResolvedValue(0),
      getStoreContext: vi.fn().mockResolvedValue(null),
      setStoreContext: vi.fn().mockResolvedValue(undefined),
      invalidateStoreContext: vi.fn().mockResolvedValue(undefined),
    };
    throttle = {
      consumeAttempt: vi.fn().mockResolvedValue(true),
      isLocked: vi.fn().mockReturnValue(false),
      registerFailure: vi.fn().mockResolvedValue({
        locked: false,
        lockedUntil: null,
        failedAttempts: 1,
      }),
      registerSuccess: vi.fn().mockResolvedValue(undefined),
    };
    eventEmitter = { emit: vi.fn() };

    const permissionResolver: DashboardPermissionResolver = {
      resolvePermissions: vi.fn().mockResolvedValue([]),
    };
    const roleResolver: DashboardRoleResolver = {
      resolveRole: vi.fn().mockResolvedValue('STORE_DASHBOARD'),
      resolvePermissionsProfile: vi.fn().mockResolvedValue('STORE_DASHBOARD'),
    };
    const scopeResolver: DashboardStoreScopeResolver = {
      resolveScope: vi.fn().mockResolvedValue({
        storeId: 'store-1',
        brandId: 'brand-1',
        scopeType: 'STORE',
      }),
    };

    cipher = {
      encrypt: vi.fn().mockReturnValue('iv:tag:ct'),
      decrypt: vi.fn().mockReturnValue(null),
      isAvailable: vi.fn().mockReturnValue(true),
    };

    service = new DashboardAuthService(
      storeRepository as unknown as DashboardStoreRepository,
      accessCodeService as unknown as DashboardAccessCodeService,
      tokenService as unknown as DashboardTokenService,
      sessionService as unknown as DashboardSessionService,
      cache as unknown as DashboardCacheService,
      cipher as unknown as DashboardCodeCipherService,
      throttle as unknown as DashboardLoginThrottleService,
      eventEmitter as unknown as EventEmitter2,
      permissionResolver,
      roleResolver,
      scopeResolver,
    );
  });

  describe('login — success', () => {
    it('should return tokens, store context and the new session id', async () => {
      const result = await service.login('GC-PAT-X93KL8Q2', CONTEXT);

      expect(result.tokens.accessToken).toBe('signed-access-token');
      expect(result.tokens.refreshToken).toBe('raw-refresh');
      expect(result.sessionId).toBe('session-1');
      expect(result.store.storeId).toBe('store-1');
    });

    it('should find the store by blind index, not by scanning', async () => {
      await service.login('GC-PAT-X93KL8Q2', CONTEXT);

      expect(accessCodeService.lookupIndex).toHaveBeenCalledWith(
        'GC-PAT-X93KL8Q2',
      );
      expect(storeRepository.findCredentialByLookup).toHaveBeenCalledWith(
        'lookup-1',
      );
      expect(storeRepository.findCredentialByLookup).toHaveBeenCalledTimes(1);
    });

    it('should never return customer information in the store context', async () => {
      const result = await service.login('GC-PAT-X93KL8Q2', CONTEXT);
      const keys = Object.keys(result.store).join(' ').toLowerCase();

      expect(keys).not.toContain('customer');
      expect(keys).not.toContain('user');
      expect(keys).not.toContain('email');
      expect(keys).not.toContain('phone');
    });

    it('should reset the failure counters on success', async () => {
      await service.login('GC-PAT-X93KL8Q2', CONTEXT);

      expect(throttle.registerSuccess).toHaveBeenCalledWith(
        'store-1',
        '203.0.113.10',
      );
    });

    it('should publish a login success event', async () => {
      await service.login('GC-PAT-X93KL8Q2', CONTEXT);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        DASHBOARD_EVENTS.LOGIN_SUCCESS,
        expect.objectContaining({ storeId: 'store-1', sessionId: 'session-1' }),
      );
    });

    it('should sign the access token with the current token version', async () => {
      cache.getTokenVersion.mockResolvedValue(3);

      await service.login('GC-PAT-X93KL8Q2', CONTEXT);

      expect(tokenService.signAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({ tokenVersion: 3, sessionId: 'session-1' }),
      );
    });
  });

  describe('login — rejection', () => {
    it('should reject an unknown code without verifying a hash', async () => {
      storeRepository.findCredentialByLookup.mockResolvedValue(null);

      await expect(service.login('GC-XXX-NOPE1234', CONTEXT)).rejects.toThrow(
        DASHBOARD_AUTH_ERRORS.INVALID_ACCESS_CODE,
      );
      expect(accessCodeService.verify).not.toHaveBeenCalled();
    });

    it('should reject a store with no code configured', async () => {
      storeRepository.findCredentialByLookup.mockResolvedValue(
        credential({ dashboardCodeHash: null }),
      );

      await expect(service.login('GC-PAT-X93KL8Q2', CONTEXT)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject a wrong code and count the failure', async () => {
      accessCodeService.verify.mockResolvedValue(false);

      await expect(service.login('GC-PAT-WRONG123', CONTEXT)).rejects.toThrow(
        DASHBOARD_AUTH_ERRORS.INVALID_ACCESS_CODE,
      );
      expect(throttle.registerFailure).toHaveBeenCalledWith('store-1');
    });

    it('should reject a locked store before spending an Argon2 verification', async () => {
      throttle.isLocked.mockReturnValue(true);

      await expect(service.login('GC-PAT-X93KL8Q2', CONTEXT)).rejects.toThrow(
        ForbiddenException,
      );
      expect(accessCodeService.verify).not.toHaveBeenCalled();
    });

    it('should reject when dashboard access is disabled', async () => {
      storeRepository.findCredentialByLookup.mockResolvedValue(
        credential({ dashboardAccessEnabled: false }),
      );

      await expect(service.login('GC-PAT-X93KL8Q2', CONTEXT)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(sessionService.createSession).not.toHaveBeenCalled();
    });

    it('should reject an inactive store', async () => {
      storeRepository.findCredentialByLookup.mockResolvedValue(
        credential({ isActive: false }),
      );

      await expect(service.login('GC-PAT-X93KL8Q2', CONTEXT)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject a soft-deleted store', async () => {
      storeRepository.findCredentialByLookup.mockResolvedValue(
        credential({ deletedAt: new Date() }),
      );

      await expect(service.login('GC-PAT-X93KL8Q2', CONTEXT)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should give the same message whether the store is unknown, disabled or inactive', async () => {
      const messages: string[] = [];

      storeRepository.findCredentialByLookup.mockResolvedValueOnce(null);
      messages.push(
        await service
          .login('GC-PAT-X93KL8Q2', CONTEXT)
          .then(() => 'unexpected success')
          .catch((e: Error) => e.message),
      );

      storeRepository.findCredentialByLookup.mockResolvedValueOnce(
        credential({ dashboardAccessEnabled: false }),
      );
      messages.push(
        await service
          .login('GC-PAT-X93KL8Q2', CONTEXT)
          .then(() => 'unexpected success')
          .catch((e: Error) => e.message),
      );

      storeRepository.findCredentialByLookup.mockResolvedValueOnce(
        credential({ isActive: false }),
      );
      messages.push(
        await service
          .login('GC-PAT-X93KL8Q2', CONTEXT)
          .then(() => 'unexpected success')
          .catch((e: Error) => e.message),
      );

      expect(new Set(messages).size).toBe(1);
      expect(messages[0]).toBe(DASHBOARD_AUTH_ERRORS.INVALID_ACCESS_CODE);
    });

    it('should publish a failure event carrying the reason', async () => {
      accessCodeService.verify.mockResolvedValue(false);

      await expect(service.login('GC-PAT-WRONG123', CONTEXT)).rejects.toThrow();

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        DASHBOARD_EVENTS.LOGIN_FAILED,
        expect.objectContaining({ storeId: 'store-1', reason: 'INVALID_CODE' }),
      );
    });

    it('should not name a store in the failure event for an unknown code', async () => {
      storeRepository.findCredentialByLookup.mockResolvedValue(null);

      await expect(service.login('GC-XXX-NOPE1234', CONTEXT)).rejects.toThrow();

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        DASHBOARD_EVENTS.LOGIN_FAILED,
        expect.objectContaining({ storeId: null, reason: 'UNKNOWN_CODE' }),
      );
    });
  });

  describe('login — rate limiting', () => {
    it('should reject with 429 once the window is exhausted', async () => {
      throttle.consumeAttempt.mockResolvedValue(false);

      const error = await service
        .login('GC-PAT-X93KL8Q2', CONTEXT)
        .catch((e: BaseException) => e);

      expect(error).toBeInstanceOf(BaseException);
      expect((error as BaseException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    });

    it('should not touch the database when rate limited', async () => {
      throttle.consumeAttempt.mockResolvedValue(false);

      await expect(service.login('GC-PAT-X93KL8Q2', CONTEXT)).rejects.toThrow();

      expect(storeRepository.findCredentialByLookup).not.toHaveBeenCalled();
    });

    it('should apply the limiter before anything else', async () => {
      await service.login('GC-PAT-X93KL8Q2', CONTEXT);

      expect(throttle.consumeAttempt).toHaveBeenCalledWith('203.0.113.10');
    });
  });

  describe('refresh', () => {
    beforeEach(() => {
      sessionService.validateRefreshToken.mockResolvedValue({
        session: { id: 'session-1', storeId: 'store-1' },
        currentTokenId: 'token-1',
        familyId: 'family-1',
      });
    });

    it('should rotate the refresh token and re-mint the access token', async () => {
      const tokens = await service.refresh('raw-refresh', CONTEXT);

      expect(sessionService.rotate).toHaveBeenCalled();
      expect(tokens.accessToken).toBe('signed-access-token');
      expect(tokens.refreshToken).toBe('raw-refresh');
    });

    it('should keep the rotated token in the same family', async () => {
      await service.refresh('raw-refresh', CONTEXT);

      expect(tokenService.issueRefreshToken).toHaveBeenCalledWith('family-1');
    });

    it('should look the token up by digest, never by the raw value', async () => {
      await service.refresh('raw-refresh', CONTEXT);

      expect(tokenService.hashRefreshToken).toHaveBeenCalledWith('raw-refresh');
      expect(sessionService.validateRefreshToken).toHaveBeenCalledWith('hash-1');
    });

    it('should re-check store access on every rotation', async () => {
      await service.refresh('raw-refresh', CONTEXT);

      expect(storeRepository.findAccessStateById).toHaveBeenCalledWith(
        'store-1',
      );
    });

    it('should end the session when dashboard access was revoked meanwhile', async () => {
      storeRepository.findAccessStateById.mockResolvedValue({
        id: 'store-1',
        isActive: true,
        deletedAt: null,
        dashboardAccessEnabled: false,
      });

      await expect(service.refresh('raw-refresh', CONTEXT)).rejects.toThrow(
        DASHBOARD_AUTH_ERRORS.DASHBOARD_DISABLED,
      );
      expect(sessionService.revokeSession).toHaveBeenCalled();
    });

    it('should end the session when the store was deactivated meanwhile', async () => {
      storeRepository.findAccessStateById.mockResolvedValue({
        id: 'store-1',
        isActive: false,
        deletedAt: null,
        dashboardAccessEnabled: true,
      });

      await expect(service.refresh('raw-refresh', CONTEXT)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should not issue tokens when validation rejects the presented token', async () => {
      sessionService.validateRefreshToken.mockRejectedValue(
        new UnauthorizedException(DASHBOARD_AUTH_ERRORS.TOKEN_REUSE_DETECTED),
      );

      await expect(service.refresh('raw-refresh', CONTEXT)).rejects.toThrow(
        DASHBOARD_AUTH_ERRORS.TOKEN_REUSE_DETECTED,
      );
      expect(sessionService.rotate).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should revoke only the current session', async () => {
      await service.logout(PRINCIPAL, CONTEXT);

      expect(sessionService.revokeSession).toHaveBeenCalledWith(
        'session-1',
        'store-1',
        DASHBOARD_SESSION_REVOKE_REASONS.LOGOUT,
      );
    });

    it('should publish a logout event scoped to one session', async () => {
      await service.logout(PRINCIPAL, CONTEXT);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        DASHBOARD_EVENTS.LOGOUT,
        expect.objectContaining({ allSessions: false }),
      );
    });
  });

  describe('logoutAll', () => {
    it('should revoke every session and report the count', async () => {
      sessionService.revokeAllSessions.mockResolvedValue([
        'session-1',
        'session-2',
      ]);

      const result = await service.logoutAll(PRINCIPAL, CONTEXT);

      expect(result.revokedSessions).toBe(2);
      expect(sessionService.revokeAllSessions).toHaveBeenCalledWith(
        'store-1',
        DASHBOARD_SESSION_REVOKE_REASONS.LOGOUT_ALL,
      );
    });

    it('should publish a logout event marked as all-sessions', async () => {
      await service.logoutAll(PRINCIPAL, CONTEXT);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        DASHBOARD_EVENTS.LOGOUT,
        expect.objectContaining({ allSessions: true }),
      );
    });
  });

  describe('revokeSession', () => {
    it('should delegate to the store-scoped revocation', async () => {
      await service.revokeSession(PRINCIPAL, 'session-9', CONTEXT);

      expect(sessionService.revokeSessionForStore).toHaveBeenCalledWith(
        'session-9',
        'store-1',
      );
    });

    it('should publish a session revoked event', async () => {
      await service.revokeSession(PRINCIPAL, 'session-9', CONTEXT);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        DASHBOARD_EVENTS.SESSION_REVOKED,
        expect.objectContaining({ sessionId: 'session-9' }),
      );
    });

    it('should publish nothing when the revocation is refused', async () => {
      sessionService.revokeSessionForStore.mockRejectedValue(
        new UnauthorizedException(),
      );

      await expect(
        service.revokeSession(PRINCIPAL, 'session-9', CONTEXT),
      ).rejects.toThrow();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('buildStoreContext', () => {
    it('should serve a cached context without querying', async () => {
      cache.getStoreContext.mockResolvedValue({ storeId: 'store-1' });

      await service.buildStoreContext('store-1');

      expect(storeRepository.findContextById).not.toHaveBeenCalled();
    });

    it('should cache a freshly built context', async () => {
      await service.buildStoreContext('store-1');

      expect(cache.setStoreContext).toHaveBeenCalledWith(
        expect.objectContaining({ storeId: 'store-1' }),
      );
    });

    it('should expose the brand slug as the store type', async () => {
      const context = await service.buildStoreContext('store-1');

      expect(context.storeType).toBe('greenchillyz');
      expect(context.brandName).toBe('GreenChillyz');
    });

    it('should take role, scope and permissions from the resolvers', async () => {
      const context = await service.buildStoreContext('store-1');

      expect(context.role).toBe('STORE_DASHBOARD');
      expect(context.permissionsProfile).toBe('STORE_DASHBOARD');
      expect(context.permissions).toEqual([]);
      expect(context.scope.scopeType).toBe('STORE');
    });

    it('should raise when the store is gone', async () => {
      storeRepository.findContextById.mockResolvedValue(null);

      await expect(service.buildStoreContext('store-1')).rejects.toThrow(
        'Store store-1 not found',
      );
    });
  });

  describe('rotateAccessCode', () => {
    it('should return the new plaintext exactly once', async () => {
      const result = await service.rotateAccessCode('store-1');

      expect(result.accessCode).toBe('GC-PAT-NEWCODE1');
    });

    it('should persist the hash, the lookup index and the recoverable copy', async () => {
      await service.rotateAccessCode('store-1');

      expect(storeRepository.setAccessCode).toHaveBeenCalledWith(
        'store-1',
        '$argon2id$new',
        'lookup-2',
        'iv:tag:ct',
      );
    });

    it('should re-encrypt so recovery cannot return the superseded code', async () => {
      await service.rotateAccessCode('store-1');

      expect(cipher.encrypt).toHaveBeenCalledWith('GC-PAT-NEWCODE1');
    });

    it('should never persist the plaintext code', async () => {
      await service.rotateAccessCode('store-1');

      const persisted = JSON.stringify(
        storeRepository.setAccessCode.mock.calls[0],
      );
      expect(persisted).not.toContain('GC-PAT-NEWCODE1');
    });

    it('should revoke every session the old code opened', async () => {
      await service.rotateAccessCode('store-1');

      expect(sessionService.revokeAllSessions).toHaveBeenCalledWith(
        'store-1',
        DASHBOARD_SESSION_REVOKE_REASONS.CODE_ROTATED,
      );
    });

    it('should invalidate the cached store context', async () => {
      await service.rotateAccessCode('store-1');

      expect(cache.invalidateStoreContext).toHaveBeenCalledWith('store-1');
    });

    it('should publish a code rotated event with the sessions it ended', async () => {
      sessionService.revokeAllSessions.mockResolvedValue(['s1', 's2', 's3']);

      await service.rotateAccessCode('store-1');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        DASHBOARD_EVENTS.CODE_ROTATED,
        expect.objectContaining({ revokedSessionCount: 3 }),
      );
    });

    it('should refuse to rotate a code for a store that does not exist', async () => {
      storeRepository.findContextById.mockResolvedValue(null);

      await expect(service.rotateAccessCode('store-1')).rejects.toThrow(
        'Store store-1 not found',
      );
      expect(storeRepository.setAccessCode).not.toHaveBeenCalled();
    });
  });

  describe('concurrency', () => {
    it('should create an independent session per simultaneous login', async () => {
      let counter = 0;
      sessionService.createSession.mockImplementation(async () => {
        counter += 1;
        return { id: `session-${counter}` };
      });

      const results = await Promise.all([
        service.login('GC-PAT-X93KL8Q2', CONTEXT),
        service.login('GC-PAT-X93KL8Q2', CONTEXT),
        service.login('GC-PAT-X93KL8Q2', CONTEXT),
      ]);

      expect(new Set(results.map((r) => r.sessionId)).size).toBe(3);
    });

    it('should count every simultaneous wrong code as a separate failure', async () => {
      accessCodeService.verify.mockResolvedValue(false);

      await Promise.all([
        service.login('GC-PAT-BAD1', CONTEXT).catch(() => null),
        service.login('GC-PAT-BAD2', CONTEXT).catch(() => null),
        service.login('GC-PAT-BAD3', CONTEXT).catch(() => null),
      ]);

      expect(throttle.registerFailure).toHaveBeenCalledTimes(3);
    });

    it('should serve concurrent refreshes of the same session without cross-talk', async () => {
      sessionService.validateRefreshToken.mockResolvedValue({
        session: { id: 'session-1', storeId: 'store-1' },
        currentTokenId: 'token-1',
        familyId: 'family-1',
      });

      const results = await Promise.all([
        service.refresh('raw-a', CONTEXT),
        service.refresh('raw-b', CONTEXT),
      ]);

      expect(results).toHaveLength(2);
      expect(sessionService.rotate).toHaveBeenCalledTimes(2);
    });
  });
});
