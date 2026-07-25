import { Injectable, Logger } from '@nestjs/common';
import { GameHandler } from '../interfaces/game-handler.interface';

@Injectable()
export class GameRegistry {
  private readonly logger = new Logger(GameRegistry.name);
  private readonly handlers = new Map<string, GameHandler>();

  register(handler: GameHandler) {
    if (this.handlers.has(handler.gameSlug)) {
      this.logger.warn(`Overwriting game handler for slug: ${handler.gameSlug}`);
    }
    this.handlers.set(handler.gameSlug, handler);
    this.logger.log(`Registered game handler for: ${handler.gameSlug}`);
  }

  get(slug: string): GameHandler | undefined {
    return this.handlers.get(slug);
  }

  has(slug: string): boolean {
    return this.handlers.has(slug);
  }

  listSlugs(): string[] {
    return Array.from(this.handlers.keys());
  }
}
