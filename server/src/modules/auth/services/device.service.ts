import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { DeviceType, UserDevice } from '@prisma/client';
import { AUTH_ERRORS } from '../constants';

export interface DeviceInfo {
  deviceType: DeviceType;
  deviceName: string | null;
  browser: string | null;
  os: string | null;
  platform: string | null;
  ipAddress: string;
  fingerprint: string | null;
}

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateDevice(
    userId: string,
    info: DeviceInfo,
  ): Promise<UserDevice> {
    if (info.fingerprint) {
      const existing = await this.prisma.userDevice.findFirst({
        where: {
          userId,
          fingerprint: info.fingerprint,
          loggedOutAt: null,
        },
      });

      if (existing) {
        return this.prisma.userDevice.update({
          where: { id: existing.id },
          data: {
            ipAddress: info.ipAddress,
            lastActiveAt: new Date(),
            browser: info.browser,
            os: info.os,
          },
        });
      }
    }

    return this.prisma.userDevice.create({
      data: {
        userId,
        deviceType: info.deviceType,
        deviceName: info.deviceName,
        browser: info.browser,
        os: info.os,
        platform: info.platform,
        ipAddress: info.ipAddress,
        fingerprint: info.fingerprint,
        lastActiveAt: new Date(),
      },
    });
  }

  async getUserDevices(userId: string): Promise<UserDevice[]> {
    return this.prisma.userDevice.findMany({
      where: { userId, loggedOutAt: null },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async logoutDevice(userId: string, deviceId: string): Promise<void> {
    const device = await this.prisma.userDevice.findFirst({
      where: { id: deviceId, userId, loggedOutAt: null },
    });

    if (!device) {
      throw new NotFoundException(AUTH_ERRORS.DEVICE_NOT_FOUND);
    }

    await this.prisma.userDevice.update({
      where: { id: deviceId },
      data: { loggedOutAt: new Date() },
    });
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.prisma.userDevice.updateMany({
      where: { userId, loggedOutAt: null },
      data: { loggedOutAt: new Date() },
    });
  }

  async updateLastActive(deviceId: string): Promise<void> {
    await this.prisma.userDevice.update({
      where: { id: deviceId },
      data: { lastActiveAt: new Date() },
    });
  }

  parseUserAgent(userAgent: string | undefined): Omit<DeviceInfo, 'ipAddress' | 'fingerprint'> {
    if (!userAgent) {
      return {
        deviceType: DeviceType.DESKTOP,
        deviceName: null,
        browser: null,
        os: null,
        platform: null,
      };
    }

    const ua = userAgent.toLowerCase();

    let deviceType: DeviceType = DeviceType.DESKTOP;
    if (/mobile|android|iphone|ipod/.test(ua)) {
      deviceType = DeviceType.MOBILE;
    } else if (/tablet|ipad/.test(ua)) {
      deviceType = DeviceType.TABLET;
    }

    let browser: string | null = null;
    if (/edg\//.test(ua)) browser = 'Edge';
    else if (/chrome\//.test(ua) && !/chromium/.test(ua)) browser = 'Chrome';
    else if (/firefox\//.test(ua)) browser = 'Firefox';
    else if (/safari\//.test(ua) && !/chrome/.test(ua)) browser = 'Safari';

    let os: string | null = null;
    if (/windows/.test(ua)) os = 'Windows';
    else if (/macintosh|mac os x/.test(ua)) os = 'macOS';
    else if (/linux/.test(ua)) os = 'Linux';
    else if (/android/.test(ua)) os = 'Android';
    else if (/iphone|ipad|ipod/.test(ua)) os = 'iOS';

    let platform: string | null = null;
    if (/mobile/.test(ua)) platform = 'Mobile';
    else if (/tablet/.test(ua)) platform = 'Tablet';
    else platform = 'Desktop';

    return { deviceType, deviceName: null, browser, os, platform };
  }
}
