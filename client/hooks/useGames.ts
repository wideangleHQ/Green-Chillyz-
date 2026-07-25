import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listGames,
  getGame,
  startSession,
  endSession,
  getMySessions,
  getLeaderboard,
  getGameStats,
} from "@/lib/api/gameApi";
import type {
  GameQueryDto,
  GameSessionQueryDto,
  StartGameSessionDto,
  EndGameSessionDto,
} from "@/types/game";
import { WALLET_KEYS } from "./useWallet";

export const GAME_KEYS = {
  all: ["games"] as const,
  list: (params?: GameQueryDto) => [...GAME_KEYS.all, "list", params] as const,
  detail: (idOrSlug: string) => [...GAME_KEYS.all, "detail", idOrSlug] as const,
  leaderboard: (gameId: string) => [...GAME_KEYS.all, "leaderboard", gameId] as const,
  sessions: (params?: GameSessionQueryDto) => [...GAME_KEYS.all, "sessions", params] as const,
  stats: (gameId: string) => [...GAME_KEYS.all, "stats", gameId] as const,
};

export function useGamesList(params?: GameQueryDto, enabled = true) {
  return useQuery({
    queryKey: GAME_KEYS.list(params),
    queryFn: () => listGames(params),
    enabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useGameConfig(idOrSlug: string, enabled = true) {
  return useQuery({
    queryKey: GAME_KEYS.detail(idOrSlug),
    queryFn: () => getGame(idOrSlug),
    enabled: !!idOrSlug && enabled,
    staleTime: 5 * 60 * 1000, // configurations change rarely
    gcTime: 10 * 60 * 1000,
  });
}

export function useStartSession() {
  const queryClient = useClientQueryClient();
  return useMutation({
    mutationFn: (dto: StartGameSessionDto) => startSession(dto),
    onSuccess: (data) => {
      // Invalidate active session query or list queries
      queryClient.invalidateQueries({ queryKey: GAME_KEYS.sessions() });
    },
  });
}

export function useEndSession() {
  const queryClient = useClientQueryClient();
  return useMutation({
    mutationFn: (dto: EndGameSessionDto) => endSession(dto),
    onSuccess: (data) => {
      // Invalidate user game sessions list
      queryClient.invalidateQueries({ queryKey: GAME_KEYS.sessions() });
      // Invalidate stats
      if (data.session?.gameId) {
        queryClient.invalidateQueries({ queryKey: GAME_KEYS.stats(data.session.gameId) });
        queryClient.invalidateQueries({ queryKey: GAME_KEYS.leaderboard(data.session.gameId) });
      }
      // Critical: Invalidate wallet balances because playing a game rewards coins!
      queryClient.invalidateQueries({ queryKey: WALLET_KEYS.all });
    },
  });
}

export function useGameLeaderboard(gameId: string, enabled = true) {
  return useQuery({
    queryKey: GAME_KEYS.leaderboard(gameId),
    queryFn: () => getLeaderboard(gameId),
    enabled: !!gameId && enabled,
    staleTime: 30 * 1000, // refresh often
  });
}

export function useMyGameSessions(params?: GameSessionQueryDto, enabled = true) {
  return useQuery({
    queryKey: GAME_KEYS.sessions(params),
    queryFn: () => getMySessions(params),
    enabled,
    staleTime: 15 * 1000,
  });
}

export function useGameStats(gameId: string, enabled = true) {
  return useQuery({
    queryKey: GAME_KEYS.stats(gameId),
    queryFn: () => getGameStats(gameId),
    enabled: !!gameId && enabled,
    staleTime: 60 * 1000,
  });
}

// Helper to safely get the QueryClient inside a Client Component
function useClientQueryClient() {
  try {
    return useQueryClient();
  } catch {
    // Return dummy client if called outside QueryClientProvider (should not happen in Client Components)
    return new (require("@tanstack/react-query").QueryClient)();
  }
}
