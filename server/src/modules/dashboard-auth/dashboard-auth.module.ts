import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { DashboardAuthController } from './dashboard-auth.controller';
import {
  DASHBOARD_PERMISSION_RESOLVER,
  DASHBOARD_ROLE_RESOLVER,
  DASHBOARD_STORE_SCOPE_RESOLVER,
} from './constants';
import {
  DashboardAuthGuard,
  DashboardJwtGuard,
  DashboardRefreshGuard,
} from './guards';
import {
  DashboardSessionRepository,
  DashboardStoreRepository,
} from './repositories';
import {
  DashboardAccessCodeService,
  DashboardAuthService,
  DashboardCacheService,
  DashboardCodeBootstrapService,
  DashboardCodeCipherService,
  DashboardCodeRecoveryService,
  DashboardLoginThrottleService,
  DashboardSessionService,
  DashboardTokenService,
  DefaultDashboardPermissionResolver,
  DefaultDashboardRoleResolver,
  DefaultDashboardStoreScopeResolver,
} from './services';
import { DashboardJwtStrategy } from './strategies/dashboard-jwt.strategy';

/**
 * Dashboard IAM.
 *
 * The dashboard is a second frontend against this one backend, not a second
 * backend: it gets its own controller namespace, its own secrets and its own
 * guards, while every rule it enforces lives in services here that future
 * dashboard modules will reuse rather than reimplement.
 *
 * The three resolver tokens are the seam for the Permission Engine. Rebinding
 * them in that module is the whole integration — nothing in this module, and
 * no consumer of the exported guards or decorators, has to change.
 */
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('dashboardAuth.jwtSecret'),
        signOptions: {
          expiresIn: config.get<string>(
            'dashboardAuth.jwtExpiresIn',
            '15m',
          ) as never,
          issuer: config.get<string>(
            'dashboardAuth.jwtIssuer',
            'greenchillyz-api',
          ),
          audience: config.get<string>(
            'dashboardAuth.jwtAudience',
            'greenchillyz-dashboard',
          ),
        },
      }),
    }),
  ],
  controllers: [DashboardAuthController],
  providers: [
    DashboardStoreRepository,
    DashboardSessionRepository,
    DashboardAccessCodeService,
    DashboardCodeCipherService,
    DashboardCodeBootstrapService,
    DashboardCodeRecoveryService,
    DashboardCacheService,
    DashboardTokenService,
    DashboardSessionService,
    DashboardLoginThrottleService,
    DashboardAuthService,
    DashboardJwtStrategy,
    DashboardJwtGuard,
    DashboardRefreshGuard,
    DashboardAuthGuard,
    {
      provide: DASHBOARD_PERMISSION_RESOLVER,
      useClass: DefaultDashboardPermissionResolver,
    },
    { provide: DASHBOARD_ROLE_RESOLVER, useClass: DefaultDashboardRoleResolver },
    {
      provide: DASHBOARD_STORE_SCOPE_RESOLVER,
      useClass: DefaultDashboardStoreScopeResolver,
    },
  ],
  exports: [
    DashboardAuthService,
    DashboardSessionService,
    DashboardAccessCodeService,
    DashboardCodeCipherService,
    DashboardCodeRecoveryService,
    DashboardTokenService,
    DashboardCacheService,
    DashboardJwtGuard,
    DashboardAuthGuard,
    DashboardRefreshGuard,
    // Guard dependencies: modules that put DashboardAuthGuard in @UseGuards
    // resolve it in their own context, so its constructor needs these too.
    DashboardStoreRepository,
    DASHBOARD_PERMISSION_RESOLVER,
  ],
})
export class DashboardAuthModule {}
