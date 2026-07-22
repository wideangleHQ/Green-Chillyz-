import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { RedisService } from '../../../providers/redis/redis.service';
import { hashSha256 } from '../../../common/helpers/hash.helper';
import { AUTH_ERRORS, OTP_CONFIG, REDIS_PREFIXES } from '../constants';
import { OtpPurpose } from '@prisma/client';
import { randomInt } from 'crypto';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async requestOtp(
    identifier: string,
    purpose: OtpPurpose,
    userId?: string,
  ): Promise<{ expiresAt: Date }> {
    await this.checkRateLimit(identifier);

    const code = this.generateOtpCode();
    const codeHash = hashSha256(code);
    const expiresAt = new Date(
      Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000,
    );

    await this.prisma.otp.create({
      data: {
        userId: userId ?? null,
        identifier,
        codeHash,
        purpose,
        maxAttempts: OTP_CONFIG.MAX_ATTEMPTS,
        expiresAt,
      },
    });

    this.logger.log(
      `OTP generated for ${identifier} (purpose: ${purpose}). Code: ${code}`,
    );

    return { expiresAt };
  }

  async verifyOtp(
    identifier: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<boolean> {
    const otp = await this.prisma.otp.findFirst({
      where: {
        identifier,
        purpose,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException(AUTH_ERRORS.OTP_EXPIRED);
    }

    if (otp.attempts >= otp.maxAttempts) {
      throw new BadRequestException(AUTH_ERRORS.OTP_MAX_ATTEMPTS);
    }

    const codeHash = hashSha256(code);
    const isValid = this.timingSafeCompare(codeHash, otp.codeHash);

    if (!isValid) {
      await this.prisma.otp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException(AUTH_ERRORS.OTP_INVALID);
    }

    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { verifiedAt: new Date() },
    });

    return true;
  }

  private generateOtpCode(): string {
    const max = Math.pow(10, OTP_CONFIG.LENGTH);
    const min = Math.pow(10, OTP_CONFIG.LENGTH - 1);
    return String(randomInt(min, max));
  }

  private async checkRateLimit(identifier: string): Promise<void> {
    const key = `${REDIS_PREFIXES.OTP_RATE_LIMIT}${identifier}`;
    const current = await this.redisService.get<number>(key);

    if (current !== null && current >= OTP_CONFIG.MAX_REQUESTS_PER_WINDOW) {
      throw new HttpException(AUTH_ERRORS.OTP_RATE_LIMITED, HttpStatus.TOO_MANY_REQUESTS);
    }

    const next = (current ?? 0) + 1;
    await this.redisService.set(
      key,
      next,
      OTP_CONFIG.RATE_LIMIT_WINDOW_SECONDS,
    );
  }

  private timingSafeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    const bufA = Buffer.from(a, 'utf-8');
    const bufB = Buffer.from(b, 'utf-8');
    return timingSafeEqual(bufA, bufB);
  }
}
