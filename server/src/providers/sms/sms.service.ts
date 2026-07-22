import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsOptions {
  to: string;
  message: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  async send(options: SmsOptions): Promise<void> {
    // Transport implementation will be added when an SMS provider is chosen.
    this.logger.log(`SMS queued to ${options.to}`);
  }
}
