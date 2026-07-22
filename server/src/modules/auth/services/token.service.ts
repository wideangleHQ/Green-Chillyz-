import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../database/prisma.service';
import { generateToken, hashSha256 } from '../../../common/helpers/hash.helper';
import { JwtPayload, RoleWithScope, AuthTokens } from '../interfaces';
import { AUTH_ERRORS, REFRESH_TOKEN_BYTES } from '../constants';
import { SessionService } from './session.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly jwtIssuer: string;
  private readonly jwtAudience: string;
  private readonly refreshTokenExpiryDays: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
  ) {
    this.jwtSecret = this.configService.getOrThrow<string>('auth.jwtSecret');
    this.jwtExpiresIn = this.configService.get<string>(
      'auth.jwtExpiresIn',
      '15m',
    );
    this.jwtIssuer = this.configService.get<string>(
      'auth.jwtIssuer',
      'greenchillyz-api',
    );
    this.jwtAudience = this.configService.get<string>(
      'auth.jwtAudience',
      'greenchillyz-client',
    );
    this.refreshTokenExpiryDays = this.configService.get<number>(
      'auth.refreshTokenExpiryDays',
      30,
    );
  }

  async generateTokenPair(
    userId: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string | null,
    deviceId: string | null,
    familyId?: string,
  ): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(userId, sessionId),
      this.generateRefreshToken(
        userId,
        sessionId,
        ipAddress,
        userAgent,
        deviceId,
        familyId,
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async generateAccessToken(
    userId: string,
    sessionId: string,
  ): Promise<string> {
    const { roles, permissions } = await this.loadUserRolesAndPermissions(userId);
    const tokenVersion = await this.sessionService.getTokenVersion(userId);
    const permissionsVersion =
      await this.sessionService.getPermissionsVersion(userId);

    const payload: Omit<JwtPayload, 'iat' | 'exp' | 'iss' | 'aud'> = {
      sub: userId,
      email: await this.getUserEmail(userId),
      roles,
      permissions,
      tokenVersion,
      permissionsVersion,
      sessionId,
    };

    return this.jwtService.sign(payload as Record<string, unknown>, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn as any,
      issuer: this.jwtIssuer,
      audience: this.jwtAudience,
    });
  }

  async generateRefreshToken(
    userId: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string | null,
    deviceId: string | null,
    familyId?: string,
  ): Promise<string> {
    const rawToken = generateToken(REFRESH_TOKEN_BYTES);
    const tokenHash = hashSha256(rawToken);
    const resolvedFamilyId = familyId ?? uuidv4();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenExpiryDays);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId: resolvedFamilyId,
        deviceId,
        sessionId,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    return rawToken;
  }

  async rotateRefreshToken(
    oldRawToken: string,
    ipAddress: string,
    userAgent: string | null,
  ): Promise<{ tokens: AuthTokens; userId: string }> {
    const oldTokenHash = hashSha256(oldRawToken);

    const existingToken = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: oldTokenHash },
    });

    if (!existingToken) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_REFRESH_TOKEN);
    }

    if (existingToken.revokedAt) {
      this.logger.warn(
        `Refresh token reuse detected for family ${existingToken.familyId}, user ${existingToken.userId}`,
      );
      await this.revokeTokenFamily(existingToken.familyId);
      await this.sessionService.destroyAllUserSessions(existingToken.userId);
      throw new UnauthorizedException(AUTH_ERRORS.TOKEN_REUSE_DETECTED);
    }

    if (existingToken.expiresAt < new Date()) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_REFRESH_TOKEN);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: existingToken.userId },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException(AUTH_ERRORS.USER_DEACTIVATED);
    }

    await this.prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.generateTokenPair(
      existingToken.userId,
      existingToken.sessionId,
      ipAddress,
      userAgent,
      existingToken.deviceId,
      existingToken.familyId,
    );

    return { tokens, userId: existingToken.userId };
  }

  async revokeTokensBySession(sessionId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeTokensByDevice(
    userId: string,
    deviceId: string,
  ): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, deviceId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async revokeTokenFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async loadUserRolesAndPermissions(
    userId: string,
  ): Promise<{ roles: RoleWithScope[]; permissions: string[] }> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId, revokedAt: null },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const roles: RoleWithScope[] = userRoles.map((ur) => ({
      role: ur.role.name,
      storeId: ur.storeId,
    }));

    const permissionSet = new Set<string>();
    for (const ur of userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissionSet.add(rp.permission.name);
      }
    }

    return { roles, permissions: Array.from(permissionSet) };
  }

  private async getUserEmail(userId: string): Promise<string> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true },
    });
    return user.email;
  }
}
