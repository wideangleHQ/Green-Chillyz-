import { Game, GameSession, RewardEventType, RewardSourceType } from '@prisma/client';

export interface GameValidationResult {
  isValid: boolean;
  score: number;
  reason?: string;
  rewardEvent?: {
    eventType: RewardEventType;
    source: RewardSourceType;
    purchaseAmount?: number;
    referenceId?: string;
    referenceType?: string;
    storeId?: string;
    brandId?: string;
    metadata?: Record<string, any>;
  };
}

export interface GameHandler {
  readonly gameSlug: string;
  validateStart(userId: string, game: Game, clientData?: any): Promise<void>;
  validateEnd(userId: string, session: GameSession, clientData: any): Promise<GameValidationResult>;
}
