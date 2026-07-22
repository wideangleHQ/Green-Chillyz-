import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  async send(options: MailOptions): Promise<void> {
    // Transport implementation will be added when a mail provider is chosen.
    // This service provides the contract that all modules depend on.
    this.logger.log(`Mail queued: "${options.subject}" to ${options.to}`);
  }
}
