import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StructuredLogger extends ConsoleLogger {
  constructor(private readonly configService: ConfigService) {
    super();
    const level = configService.get<string>('LOG_LEVEL', 'debug');
    this.setLogLevels(this.getLogLevels(level));
  }

  private getLogLevels(level: string): LogLevel[] {
    const levels: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];
    const idx = levels.indexOf(level as LogLevel);
    return idx >= 0 ? levels.slice(0, idx + 1) : levels;
  }

  protected formatMessage(
    logLevel: LogLevel,
    message: unknown,
    pidMessage: string,
    formattedLogLevel: string,
    contextMessage: string,
    timestampDiff: string,
  ): string {
    const timestamp = new Date().toISOString();
    const context = contextMessage?.trim() || 'Application';
    return `${timestamp} ${formattedLogLevel} [${context}] ${message}${timestampDiff}\n`;
  }
}
