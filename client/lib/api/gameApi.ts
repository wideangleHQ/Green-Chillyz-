import { api } from "./client";
import type {
  Game,
  GameSession,
  StartGameSessionDto,
  EndGameSessionDto,
  GameQueryDto,
  GameSessionQueryDto,
  LeaderboardEntry,
  GameStats,
  PaginatedResponse,
} from "@/types/game";

export async function listGames(params?: GameQueryDto): Promise<PaginatedResponse<Game>> {
  const { data } = await api.get<PaginatedResponse<Game>>("/games", { params });
  return data;
}

export async function getGame(idOrSlug: string): Promise<Game> {
  const { data } = await api.get<Game>(`/games/${idOrSlug}`);
  return data;
}

export async function startSession(dto: StartGameSessionDto): Promise<GameSession> {
  const { data } = await api.post<GameSession>("/games/sessions/start", dto);
  return data;
}

export async function endSession(
  dto: EndGameSessionDto,
): Promise<{ session: GameSession; rewardDecision: any }> {
  const { data } = await api.post<{ session: GameSession; rewardDecision: any }>(
    "/games/sessions/end",
    dto,
  );
  return data;
}

export async function getMySessions(
  params?: GameSessionQueryDto,
): Promise<PaginatedResponse<GameSession>> {
  const { data } = await api.get<PaginatedResponse<GameSession>>("/games/sessions/me", {
    params,
  });
  return data;
}

export async function getLeaderboard(gameId: string): Promise<LeaderboardEntry[]> {
  const { data } = await api.get<LeaderboardEntry[]>(`/games/${gameId}/leaderboard`);
  return data;
}

export async function getGameStats(gameId: string): Promise<GameStats> {
  const { data } = await api.get<GameStats>(`/games/${gameId}/stats`);
  return data;
}
