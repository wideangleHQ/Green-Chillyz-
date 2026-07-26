import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../database/prisma.service';
import {
  UserRegisteredEvent,
  RegistrationProvider,
} from '../../customer-bootstrap/events';
import { BOOTSTRAP_EVENTS } from '../../customer-bootstrap/constants';
import { NOTIFICATION_EVENTS } from '../../notification/constants';
import { CustomerRegisteredNotificationEvent } from '../../notification/events';
import { AUDIT_EVENTS } from '../../audit/constants';
import { AuthAuditEvent } from '../../audit/events';
import { AuditActorType } from '@prisma/client';
import { SupabaseService } from './supabase.service';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { DeviceService, DeviceInfo } from './device.service';
import { LoginHistoryService } from './login-history.service';
import { AuthTokens, AuthUserResponse, GoogleAuthResult } from '../interfaces';
import { AUTH_ERRORS } from '../constants';
import { Response } from 'express';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly deviceService: DeviceService,
    private readonly loginHistoryService: LoginHistoryService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private readonly BCRYPT_ROUNDS = 12;

  async register(
    data: { fullName: string; username: string; email: string; password: string },
    ipAddress: string,
    userAgent: string | undefined,
    fingerprint: string | null,
  ): Promise<GoogleAuthResult & { tokens: AuthTokens }> {
    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingByEmail) {
      throw new ConflictException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const existingByUsername = await this.prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existingByUsername) {
      throw new ConflictException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const passwordHash = await bcrypt.hash(data.password, this.BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        fullName: data.fullName,
        passwordHash,
      },
    });

    const customerRole = await this.prisma.role.findUnique({
      where: { name: 'customer' },
    });
    if (customerRole) {
      await this.prisma.userRole.create({
        data: { userId: user.id, roleId: customerRole.id },
      });
    }

    await this.publishUserRegistered(
      user.id,
      user.email,
      user.fullName,
      'credentials',
      ipAddress,
    );

    const parsedUA = this.deviceService.parseUserAgent(userAgent);
    const device = await this.deviceService.findOrCreateDevice(user.id, {
      ...parsedUA,
      ipAddress,
      fingerprint,
    });

    const sessionId = await this.sessionService.createSession(
      user.id,
      device.id,
      ipAddress,
    );

    const tokens = await this.tokenService.generateTokenPair(
      user.id,
      sessionId,
      ipAddress,
      userAgent ?? null,
      device.id,
    );

    await this.loginHistoryService.record({
      userId: user.id,
      deviceId: device.id,
      ipAddress,
      userAgent: userAgent ?? null,
      browser: parsedUA.browser,
      os: parsedUA.os,
      platform: parsedUA.platform,
      authProvider: 'credentials',
      wasSuccessful: true,
      failureReason: null,
    });

    const authUser = await this.buildUserResponse(user.id);
    return { user: authUser, isNewUser: true, tokens };
  }

  async loginWithCredentials(
    identifier: string,
    password: string,
    ipAddress: string,
    userAgent: string | undefined,
    fingerprint: string | null,
  ): Promise<{ user: AuthUserResponse; tokens: AuthTokens }> {
    const isEmail = identifier.includes('@');
    const user = await this.prisma.user.findUnique({
      where: isEmail ? { email: identifier } : { username: identifier },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await this.loginHistoryService.record({
        userId: user.id,
        deviceId: null,
        ipAddress,
        userAgent: userAgent ?? null,
        browser: null,
        os: null,
        platform: null,
        authProvider: 'credentials',
        wasSuccessful: false,
        failureReason: 'Invalid password',
      });
      this.emitLoginAudit(
        user.id, 'credentials', false, ipAddress, userAgent, 'Invalid password',
      );
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException(AUTH_ERRORS.USER_DEACTIVATED);
    }

    const parsedUA = this.deviceService.parseUserAgent(userAgent);
    const device = await this.deviceService.findOrCreateDevice(user.id, {
      ...parsedUA,
      ipAddress,
      fingerprint,
    });

    const sessionId = await this.sessionService.createSession(
      user.id,
      device.id,
      ipAddress,
    );

    const tokens = await this.tokenService.generateTokenPair(
      user.id,
      sessionId,
      ipAddress,
      userAgent ?? null,
      device.id,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.loginHistoryService.record({
      userId: user.id,
      deviceId: device.id,
      ipAddress,
      userAgent: userAgent ?? null,
      browser: parsedUA.browser,
      os: parsedUA.os,
      platform: parsedUA.platform,
      authProvider: 'credentials',
      wasSuccessful: true,
      failureReason: null,
    });

    this.emitLoginAudit(user.id, 'credentials', true, ipAddress, userAgent);

    const authUser = await this.buildUserResponse(user.id);
    return { user: authUser, tokens };
  }

  async authenticateWithGoogle(
    supabaseAccessToken: string,
    ipAddress: string,
    userAgent: string | undefined,
    fingerprint: string | null,
  ): Promise<GoogleAuthResult & { tokens: AuthTokens }> {
    const supabaseUser =
      await this.supabaseService.getSupabaseUser(supabaseAccessToken);

    const email = supabaseUser.email;
    const fullName =
      supabaseUser.user_metadata.full_name ??
      supabaseUser.user_metadata.name ??
      email.split('@')[0];
    const avatarUrl =
      supabaseUser.user_metadata.avatar_url ??
      supabaseUser.user_metadata.picture ??
      null;

    let isNewUser = false;
    let user = await this.prisma.user.findUnique({
      where: { supabaseUid: supabaseUser.id },
    });

    if (!user) {
      user = await this.prisma.user.findUnique({ where: { email } });

      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { supabaseUid: supabaseUser.id, avatarUrl },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            supabaseUid: supabaseUser.id,
            email,
            fullName,
            avatarUrl,
          },
        });
        isNewUser = true;

        const customerRole = await this.prisma.role.findUnique({
          where: { name: 'customer' },
        });

        if (customerRole) {
          await this.prisma.userRole.create({
            data: { userId: user.id, roleId: customerRole.id },
          });
        }

        await this.publishUserRegistered(
          user.id,
          user.email,
          user.fullName,
          'google',
          ipAddress,
        );
      }
    }

    if (!user.isActive || user.deletedAt) {
      await this.loginHistoryService.record({
        userId: user.id,
        deviceId: null,
        ipAddress,
        userAgent: userAgent ?? null,
        browser: null,
        os: null,
        platform: null,
        authProvider: 'google',
        wasSuccessful: false,
        failureReason: 'Account deactivated',
      });
      throw new UnauthorizedException(AUTH_ERRORS.USER_DEACTIVATED);
    }

    const parsedUA = this.deviceService.parseUserAgent(userAgent);
    const device = await this.deviceService.findOrCreateDevice(user.id, {
      ...parsedUA,
      ipAddress,
      fingerprint,
    });

    const sessionId = await this.sessionService.createSession(
      user.id,
      device.id,
      ipAddress,
    );

    const tokens = await this.tokenService.generateTokenPair(
      user.id,
      sessionId,
      ipAddress,
      userAgent ?? null,
      device.id,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.loginHistoryService.record({
      userId: user.id,
      deviceId: device.id,
      ipAddress,
      userAgent: userAgent ?? null,
      browser: parsedUA.browser,
      os: parsedUA.os,
      platform: parsedUA.platform,
      authProvider: 'google',
      wasSuccessful: true,
      failureReason: null,
    });

    this.emitLoginAudit(user.id, 'google', true, ipAddress, userAgent);

    const authUser = await this.buildUserResponse(user.id);
    return { user: authUser, isNewUser, tokens };
  }

  async refreshTokens(
    rawRefreshToken: string,
    ipAddress: string,
    userAgent: string | undefined,
  ): Promise<AuthTokens> {
    const { tokens, userId } = await this.tokenService.rotateRefreshToken(
      rawRefreshToken,
      ipAddress,
      userAgent ?? null,
    );
    return tokens;
  }

  async logout(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    await this.tokenService.revokeTokensBySession(sessionId);
    await this.sessionService.destroySession(sessionId, userId);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.tokenService.revokeAllUserTokens(userId);
    await this.sessionService.destroyAllUserSessions(userId);
    await this.deviceService.logoutAllDevices(userId);
    await this.sessionService.incrementTokenVersion(userId);
  }

  async getMe(userId: string): Promise<AuthUserResponse> {
    return this.buildUserResponse(userId);
  }

  async updateProfile(
    userId: string,
    data: {
      fullName?: string;
      phone?: string;
      avatarUrl?: string;
      dateOfBirth?: string;
      gender?: string;
    },
  ): Promise<AuthUserResponse> {
    const { dateOfBirth, gender, ...userData } = data;

    if (Object.keys(userData).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: userData,
      });
    }

    if (dateOfBirth !== undefined || gender !== undefined) {
      const customerProfile = await this.prisma.customerProfile.findUnique({
        where: { userId },
      });

      if (customerProfile) {
        await this.prisma.customerProfile.update({
          where: { userId },
          data: {
            ...(dateOfBirth !== undefined && {
              dateOfBirth: new Date(dateOfBirth),
            }),
            ...(gender !== undefined && { gender: gender as any }),
          },
        });
      }
    }

    return this.buildUserResponse(userId);
  }

  setAuthCookies(
    res: Response,
    tokens: AuthTokens,
  ): void {
    const cookieDomain = this.configService.get<string>(
      'auth.cookieDomain',
      'localhost',
    );
    const isSecure = this.configService.get<boolean>(
      'auth.cookieSecure',
      false,
    );
    const accessCookieName = this.configService.get<string>(
      'auth.accessTokenCookieName',
      'gc_access_token',
    );
    const refreshCookieName = this.configService.get<string>(
      'auth.refreshTokenCookieName',
      'gc_refresh_token',
    );
    const refreshExpiryDays = this.configService.get<number>(
      'auth.refreshTokenExpiryDays',
      30,
    );

    res.cookie(accessCookieName, tokens.accessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      domain: cookieDomain,
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie(refreshCookieName, tokens.refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict',
      domain: cookieDomain,
      path: '/api/v1/auth/refresh',
      maxAge: refreshExpiryDays * 24 * 60 * 60 * 1000,
    });
  }

  clearAuthCookies(res: Response): void {
    const cookieDomain = this.configService.get<string>(
      'auth.cookieDomain',
      'localhost',
    );
    const accessCookieName = this.configService.get<string>(
      'auth.accessTokenCookieName',
      'gc_access_token',
    );
    const refreshCookieName = this.configService.get<string>(
      'auth.refreshTokenCookieName',
      'gc_refresh_token',
    );

    res.clearCookie(accessCookieName, {
      domain: cookieDomain,
      path: '/',
    });
    res.clearCookie(refreshCookieName, {
      domain: cookieDomain,
      path: '/api/v1/auth/refresh',
    });
  }

  /**
   * Publishes the UserRegistered domain event. Awaited so the customer's
   * resources (wallet, profile, …) are provisioned before registration
   * returns, yet a provisioning failure never fails an otherwise valid
   * registration — subscribers own their error handling.
   */
  private async publishUserRegistered(
    userId: string,
    email: string,
    fullName: string,
    provider: RegistrationProvider,
    ipAddress: string,
  ): Promise<void> {
    try {
      await this.eventEmitter.emitAsync(
        BOOTSTRAP_EVENTS.USER_REGISTERED,
        new UserRegisteredEvent(userId, email, provider, new Date(), ipAddress),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Customer bootstrap failed for user ${userId}: ${message}`,
      );
    }

    // Welcome message. Emitted after bootstrap so the wallet the notification
    // points at already exists.
    this.eventEmitter.emit(
      NOTIFICATION_EVENTS.CUSTOMER_REGISTERED,
      new CustomerRegisteredNotificationEvent(userId, fullName),
    );
  }

  /**
   * Emits a login audit event. The audit module decides what to persist; auth
   * only reports what happened.
   */
  private emitLoginAudit(
    userId: string,
    provider: string,
    succeeded: boolean,
    ipAddress: string,
    userAgent: string | undefined,
    failureReason?: string,
  ): void {
    this.eventEmitter.emit(
      AUDIT_EVENTS.CUSTOMER_LOGIN,
      new AuthAuditEvent(
        userId,
        AuditActorType.CUSTOMER,
        'LOGIN',
        provider,
        succeeded,
        {
          ipAddress,
          device: userAgent ?? null,
          userAgent: userAgent ?? null,
        },
        failureReason,
      ),
    );
  }

  private async buildUserResponse(userId: string): Promise<AuthUserResponse> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        userRoles: {
          where: { revokedAt: null },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    const roles = user.userRoles.map((ur) => ({
      role: ur.role.name,
      storeId: ur.storeId,
    }));

    const permissionSet = new Set<string>();
    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissionSet.add(rp.permission.name);
      }
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      roles,
      permissions: Array.from(permissionSet),
    };
  }
}
