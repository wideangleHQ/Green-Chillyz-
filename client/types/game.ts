export type GameSessionStatus =
  | 'CREATED'
  | 'STARTED'
  | 'PLAYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'EXPIRED'
  | 'ABANDONED'
  | 'REWARDED';

export interface Game {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  dailyLimit: number;
  cooldown: number;
  minLevel: number;
  maxRewards: number | null;
  rewardType: string | null;
  rewardConfig: Record<string, any> | null;
  storeEligibility: string[];
  campaignEligibility: string[];
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface GameSession {
  id: string;
  userId: string;
  gameId: string;
  status: GameSessionStatus;
  startedAt: string | null;
  endedAt: string | null;
  device: string | null;
  browser: string | null;
  ipAddress: string | null;
  score: number;
  rewardDecision: Record<string, any> | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  game?: {
    name: string;
    slug: string;
  };
}

export interface StartGameSessionDto {
  gameSlug: string;
  clientData?: Record<string, any>;
}

export interface EndGameSessionDto {
  sessionId: string;
  clientData: Record<string, any>;
}

export interface GameQueryDto {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  search?: string;
}

export interface GameSessionQueryDto {
  page?: number;
  pageSize?: number;
  gameId?: string;
  userId?: string;
  status?: string;
}

export interface GameStats {
  sessionsStarted: number;
  sessionsCompleted: number;
  sessionsFailed: number;
  sessionsAbandoned: number;
  completionRate: number;
  averageSessionTimeSeconds?: number;
  fraudAttempts?: number;
  rewardsDistributed?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  score: number;
  playedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
