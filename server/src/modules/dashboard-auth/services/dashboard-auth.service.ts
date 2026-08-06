import {
  ForbiddenException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseException } from '../../../common/exceptions/base.exception';
import {
  DASHBOARD_AUTH_ERRORS,
  DASHBOARD_EVENTS,
  DASHBOARD_PERMISSION_RESOLVER,
  DASHBOARD_ROLE_RESOLVER,
  DASHBOARD_SESSION_REVOKE_REASONS,
  DASHBOARD_STORE_SCOPE_RESOLVER,
} from '../constants';
import {
  DashboardCodeRotatedEvent,
  DashboardLoginFailedEvent,
  DashboardLoginSuccessEvent,
  DashboardLogoutEvent,
  DashboardSessionCreatedEvent,
  DashboardSessionRevokedEvent,
} from '../events';
import {
  DashboardLoginResult,
  DashboardPermissionResolver,
  DashboardPrincipal,
  DashboardRequestContext,
  DashboardResolverSubject,
  DashboardRoleResolver,
  DashboardStoreContext,
  DashboardStoreScopeResolver,
  DashboardTokens,
} from '../interfaces';
import { DashboardStoreRepository } from '../repositories';
import { DashboardAccessCodeService } from './dashboard-access-code.service';
import { DashboardCacheService } from './dashboard-cache.service';
import { DashboardCodeCipherService } from './dashboard-code-cipher.service';
import { DashboardLoginThrottleService } from './dashboard-login-throttle.service';
import { DashboardSessionService } from './dashboard-session.service';
import { DashboardTokenService } from './dashboard-token.service';

/** 429 has no dedicated Nest exception; the filter renders BaseException. */
class DashboardRateLimitException extends BaseException {
  constructor(message: string) {
    super(message, HttpStatus.TOO_MANY_REQUESTS, 'DASHBOARD_RATE_LIMITED');
  }
}

/**
 * The dashboard IAM use cases. Every business rule for dashboard access lives
 * here; the controller does nothing but translate HTTP to a call and back.
 */
@Injectable()
export class DashboardAuthService {
  private readonly logger = new Logger(DashboardAuthService.name);

  constructor(
    private readonly storeRepository: DashboardStoreRepository,
    private readonly accessCodeService: DashboardAccessCodeService,
    private readonly tokenService: DashboardTokenService,
    private readonly sessionService: DashboardSessionService,
    private readonly cache: DashboardCacheService,
    private readonly cipher: DashboardCodeCipherService,
    private readonly throttle: DashboardLoginThrottleService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(DASHBOARD_PERMISSION_RESOLVER)
    private readonly permissionResolver: DashboardPermissionResolver,
    @Inject(DASHBOARD_ROLE_RESOLVER)
    private readonly roleResolver: DashboardRoleResolver,
    @Inject(DASHBOARD_STORE_SCOPE_RESOLVER)
    private readonly scopeResolver: DashboardStoreScopeResolver,
  ) {}

  /**
   * Store access code → dashboard session.
   *
   * Every rejection below the rate limiter raises the same
   * `INVALID_ACCESS_CODE` message. A caller learns only that the code did not
   * work — not whether the store exists, is inactive, or has the dashboard
   * switched off, any of which would turn this endpoint into a store
   * enumeration oracle.
   */
  async login(
    accessCode: string,
    context: DashboardRequestContext,
  ): Promise<DashboardLoginResult> {
    const withinRateLimit = await this.throttle.consumeAttempt(
      context.ipAddress,
    );
    if (!withinRateLimit) {
      this.publishLoginFailure(null, 'RATE_LIMITED', 0, null, context);
      throw new DashboardRateLimitException(DASHBOARD_AUTH_ERRORS.RATE_LIMITED);
    }

    const lookup = this.accessCodeService.lookupIndex(accessCode);
    const store = await this.storeRepository.findCredentialByLookup(lookup);

    if (!store || !store.dashboardCodeHash) {
      this.publishLoginFailure(null, 'UNKNOWN_CODE', 0, null, context);
      throw new UnauthorizedException(
        DASHBOARD_AUTH_ERRORS.INVALID_ACCESS_CODE,
      );
    }

    // Lockout is checked before the hash so a locked store costs an attacker a
    // rejection, not an Argon2 verification.
    if (this.throttle.isLocked(store.dashboardLockedUntil)) {
      this.publishLoginFailure(
        store.id,
        'LOCKED',
        store.dashboardFailedAttempts,
        store.dashboardLockedUntil,
        context,
      );
      throw new ForbiddenException(DASHBOARD_AUTH_ERRORS.ACCOUNT_LOCKED);
    }

    const codeMatches = await this.accessCodeService.verify(
      store.dashboardCodeHash,
      accessCode,
    );

    if (!codeMatches) {
      const lock = await this.throttle.registerFailure(store.id);
      this.publishLoginFailure(
        store.id,
        'INVALID_CODE',
        lock.failedAttempts,
        lock.lockedUntil,
        context,
      );
      throw new UnauthorizedException(
        DASHBOARD_AUTH_ERRORS.INVALID_ACCESS_CODE,
      );
    }

    if (!store.dashboardAccessEnabled) {
      this.publishLoginFailure(
        store.id,
        'DASHBOARD_DISABLED',
        store.dashboardFailedAttempts,
        null,
        context,
      );
      throw new UnauthorizedException(
        DASHBOARD_AUTH_ERRORS.INVALID_ACCESS_CODE,
      );
    }

    if (!store.isActive || store.deletedAt) {
      this.publishLoginFailure(
        store.id,
        'STORE_INACTIVE',
        store.dashboardFailedAttempts,
        null,
        context,
      );
      throw new UnauthorizedException(
        DASHBOARD_AUTH_ERRORS.INVALID_ACCESS_CODE,
      );
    }

    const refreshToken = this.tokenService.issueRefreshToken();
    const session = await this.sessionService.createSession(
      store.id,
      context,
      refreshToken,
    );

    this.eventEmitter.emit(
      DASHBOARD_EVENTS.SESSION_CREATED,
      new DashboardSessionCreatedEvent(
        store.id,
        session.id,
        session.expiresAt,
        new Date(),
        context,
      ),
    );

    const [storeContext, tokenVersion] = await Promise.all([
      this.buildStoreContext(store.id),
      this.cache.getTokenVersion(store.id),
    ]);

    const accessToken = this.tokenService.signAccessToken({
      storeId: store.id,
      sessionId: session.id,
      slug: storeContext.storeSlug,
      scope: storeContext.scope,
      role: storeContext.role,
      permissionsProfile: storeContext.permissionsProfile,
      tokenVersion,
    });

    await this.throttle.registerSuccess(store.id, context.ipAddress);

    this.eventEmitter.emit(
      DASHBOARD_EVENTS.LOGIN_SUCCESS,
      new DashboardLoginSuccessEvent(
        store.id,
        storeContext.storeSlug,
        session.id,
        new Date(),
        context,
      ),
    );

    return {
      tokens: { accessToken, refreshToken: refreshToken.rawToken },
      store: storeContext,
      sessionId: session.id,
    };
  }

  /**
   * Rotates the refresh token and re-mints the access token.
   *
   * The store's access state is re-read on every refresh: disabling a store's
   * dashboard must end its sessions at the next rotation, not whenever the
   * refresh token happens to expire.
   */
  async refresh(
    rawRefreshToken: string,
    context: DashboardRequestContext,
  ): Promise<DashboardTokens> {
    const tokenHash = this.tokenService.hashRefreshToken(rawRefreshToken);
    const rotation = await this.sessionService.validateRefreshToken(tokenHash);

    const accessState = await this.storeRepository.findAccessStateById(
      rotation.session.storeId,
    );

    if (
      !accessState ||
      !accessState.isActive ||
      accessState.deletedAt ||
      !accessState.dashboardAccessEnabled
    ) {
      await this.sessionService.revokeSession(
        rotation.session.id,
        rotation.session.storeId,
        DASHBOARD_SESSION_REVOKE_REASONS.MANUAL_REVOKE,
      );
      throw new UnauthorizedException(DASHBOARD_AUTH_ERRORS.DASHBOARD_DISABLED);
    }

    const nextRefreshToken = this.tokenService.issueRefreshToken(
      rotation.familyId,
    );
    await this.sessionService.rotate(rotation, nextRefreshToken);

    const [storeContext, tokenVersion] = await Promise.all([
      this.buildStoreContext(rotation.session.storeId),
      this.cache.getTokenVersion(rotation.session.storeId),
    ]);

    const accessToken = this.tokenService.signAccessToken({
      storeId: rotation.session.storeId,
      sessionId: rotation.session.id,
      slug: storeContext.storeSlug,
      scope: storeContext.scope,
      role: storeContext.role,
      permissionsProfile: storeContext.permissionsProfile,
      tokenVersion,
    });

    return { accessToken, refreshToken: nextRefreshToken.rawToken };
  }

  async logout(
    principal: DashboardPrincipal,
    context: DashboardRequestContext,
  ): Promise<void> {
    await this.sessionService.revokeSession(
      principal.sessionId,
      principal.storeId,
      DASHBOARD_SESSION_REVOKE_REASONS.LOGOUT,
    );

    this.eventEmitter.emit(
      DASHBOARD_EVENTS.LOGOUT,
      new DashboardLogoutEvent(
        principal.storeId,
        principal.sessionId,
        false,
        new Date(),
        context,
      ),
    );
  }

  async logoutAll(
    principal: DashboardPrincipal,
    context: DashboardRequestContext,
  ): Promise<{ revokedSessions: number }> {
    const sessionIds = await this.sessionService.revokeAllSessions(
      principal.storeId,
      DASHBOARD_SESSION_REVOKE_REASONS.LOGOUT_ALL,
    );

    this.eventEmitter.emit(
      DASHBOARD_EVENTS.LOGOUT,
      new DashboardLogoutEvent(
        principal.storeId,
        principal.sessionId,
        true,
        new Date(),
        context,
      ),
    );

    return { revokedSessions: sessionIds.length };
  }

  async revokeSession(
    principal: DashboardPrincipal,
    sessionId: string,
    context: DashboardRequestContext,
  ): Promise<void> {
    await this.sessionService.revokeSessionForStore(
      sessionId,
      principal.storeId,
    );

    this.eventEmitter.emit(
      DASHBOARD_EVENTS.SESSION_REVOKED,
      new DashboardSessionRevokedEvent(
        principal.storeId,
        sessionId,
        DASHBOARD_SESSION_REVOKE_REASONS.MANUAL_REVOKE,
        new Date(),
        context,
      ),
    );
  }

  async getCurrentStore(
    principal: DashboardPrincipal,
  ): Promise<DashboardStoreContext> {
    return this.buildStoreContext(principal.storeId);
  }

  async listSessions(principal: DashboardPrincipal) {
    return this.sessionService.listSessions(
      principal.storeId,
      principal.sessionId,
    );
  }

  async getCurrentSession(principal: DashboardPrincipal) {
    return this.sessionService.getSessionSummary(
      principal.sessionId,
      principal.storeId,
    );
  }

  /**
   * Issues a fresh access code for a store and invalidates every session that
   * the previous code opened — a rotated credential that leaves live sessions
   * behind has not actually been rotated.
   *
   * The plaintext is returned exactly once. It is never persisted and cannot
   * be recovered; a lost code is re-issued, not looked up. No HTTP route
   * exposes this yet — the Dashboard Users / Store CRUD modules will own that
   * surface and call this service.
   */
  async rotateAccessCode(storeId: string): Promise<{ accessCode: string }> {
    const store = await this.storeRepository.findContextById(storeId);
    if (!store) {
      throw new NotFoundException(`Store ${storeId} not found`);
    }

    const generated = await this.accessCodeService.generate(store.code);

    // Replace the recoverable copy in the same write. Leaving the previous
    // ciphertext behind would let recovery hand back a code that no longer
    // authenticates.
    await this.storeRepository.setAccessCode(
      storeId,
      generated.codeHash,
      generated.codeLookup,
      this.cipher.encrypt(generated.code),
    );

    const revokedSessions = await this.sessionService.revokeAllSessions(
      storeId,
      DASHBOARD_SESSION_REVOKE_REASONS.CODE_ROTATED,
    );
    await this.cache.invalidateStoreContext(storeId);

    this.eventEmitter.emit(
      DASHBOARD_EVENTS.CODE_ROTATED,
      new DashboardCodeRotatedEvent(
        storeId,
        store.slug,
        revokedSessions.length,
        new Date(),
      ),
    );

    return { accessCode: generated.code };
  }

  /**
   * Builds the store context, cached for the guard and `/me` paths.
   *
   * Contains store identity and access metadata only — never customer data.
   * Role, scope and permissions come from the resolvers, so this shape stays
   * correct once the Permission Engine replaces them.
   */
  async buildStoreContext(storeId: string): Promise<DashboardStoreContext> {
    const cached = await this.cache.getStoreContext(storeId);
    if (cached) {
      return cached;
    }

    const store = await this.storeRepository.findContextById(storeId);
    if (!store) {
      throw new NotFoundException(`Store ${storeId} not found`);
    }

    const subject: DashboardResolverSubject = {
      storeId: store.id,
      brandId: store.brandId,
      slug: store.slug,
    };

    const [scope, role, permissionsProfile, permissions] = await Promise.all([
      this.scopeResolver.resolveScope(subject),
      this.roleResolver.resolveRole(subject),
      this.roleResolver.resolvePermissionsProfile(subject),
      this.permissionResolver.resolvePermissions(subject),
    ]);

    const context: DashboardStoreContext = {
      storeId: store.id,
      storeName: store.name,
      storeSlug: store.slug,
      storeCode: store.code,
      // The brand a store trades under is its type within the group.
      storeType: store.brand.slug,
      brandId: store.brand.id,
      brandName: store.brand.name,
      brandSlug: store.brand.slug,
      city: store.city,
      state: store.state,
      isActive: store.isActive,
      dashboardAccessEnabled: store.dashboardAccessEnabled,
      scope,
      role,
      permissionsProfile,
      permissions,
    };

    await this.cache.setStoreContext(context);
    return context;
  }

  private publishLoginFailure(
    storeId: string | null,
    reason: string,
    failedAttempts: number,
    lockedUntil: Date | null,
    context: DashboardRequestContext,
  ): void {
    this.eventEmitter.emit(
      DASHBOARD_EVENTS.LOGIN_FAILED,
      new DashboardLoginFailedEvent(
        storeId,
        reason,
        failedAttempts,
        lockedUntil,
        new Date(),
        context,
      ),
    );
  }
}
