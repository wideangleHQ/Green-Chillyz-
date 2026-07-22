import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { LoginHistory } from '@prisma/client';

export interface LoginHistoryEntry {
  userId: string;
  deviceId: string | null;
  ipAddress: string;
  userAgent: string | null;
  browser: string | null;
  os: string | null;
  platform: string | null;
  authProvider: string;
  wasSuccessful: boolean;
  failureReason: string | null;
}

@Injectable()
export class LoginHistoryService {
  private readonly logger = new Logger(LoginHistoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: LoginHistoryEntry): Promise<void> {
    await this.prisma.loginHistory.create({ data: entry });
  }

  async getUserHistory(
    userId: string,
    limit = 20,
  ): Promise<LoginHistory[]> {
    return this.prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { device: true },
    });
  }
}
