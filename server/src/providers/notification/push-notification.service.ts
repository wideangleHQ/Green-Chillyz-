import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PushPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(private readonly configService: ConfigService) {}

  async send(payload: PushPayload): Promise<void> {
    // FCM/APNs implementation will be added when push is configured.
    this.logger.log(`Push notification queued: "${payload.title}" to ${payload.token}`);
  }

  async sendBatch(payloads: PushPayload[]): Promise<void> {
    this.logger.log(`Batch push queued: ${payloads.length} notifications`);
  }
}
