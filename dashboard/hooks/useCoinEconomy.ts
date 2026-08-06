import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsApi } from '../lib/api/opsApi';
import { coinKeys } from '../lib/queryKeys';

export function useCoinRules() {
  return useQuery({
    queryKey: coinKeys.rules(),
    queryFn: () => opsApi.getCoinRules(),
    staleTime: 60_000,
  });
}

export function useCoinGameRules() {
  return useQuery({
    queryKey: coinKeys.gameRules(),
    queryFn: () => opsApi.getCoinGameRules(),
    staleTime: 60_000,
  });
}

export function useCoinDailyLimits() {
  return useQuery({
    queryKey: coinKeys.dailyLimits(),
    queryFn: () => opsApi.getCoinDailyLimits(),
    staleTime: 60_000,
  });
}

export function useCoinBonuses() {
  return useQuery({
    queryKey: coinKeys.bonuses(),
    queryFn: () => opsApi.getCoinBonuses(),
    staleTime: 60_000,
  });
}

export function useListCoinRules(params?: any) {
  return useQuery({
    queryKey: coinKeys.coinRules(params),
    queryFn: () => opsApi.listCoinRules(params),
    staleTime: 60_000,
  });
}

export function useCoinRule(id: string) {
  return useQuery({
    queryKey: coinKeys.coinRule(id),
    queryFn: () => opsApi.getCoinRule(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useListCoinLimits() {
  return useQuery({
    queryKey: coinKeys.coinLimits(),
    queryFn: () => opsApi.listCoinLimits(),
    staleTime: 60_000,
  });
}

export function useListCoinMultipliers() {
  return useQuery({
    queryKey: coinKeys.coinMultipliers(),
    queryFn: () => opsApi.listCoinMultipliers(),
    staleTime: 60_000,
  });
}

// --- Coin Rules Mutations ---

export function useCreateCoinRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => opsApi.createCoinRule(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coinKeys.coinRules() });
      queryClient.invalidateQueries({ queryKey: coinKeys.rules() });
    },
  });
}

export function useUpdateCoinRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => opsApi.updateCoinRule(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: coinKeys.coinRules() });
      queryClient.invalidateQueries({ queryKey: coinKeys.coinRule(variables.id) });
      queryClient.invalidateQueries({ queryKey: coinKeys.rules() });
    },
  });
}

export function useEnableCoinRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.enableCoinRule(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: coinKeys.coinRules() });
      queryClient.invalidateQueries({ queryKey: coinKeys.coinRule(id) });
    },
  });
}

export function useDisableCoinRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.disableCoinRule(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: coinKeys.coinRules() });
      queryClient.invalidateQueries({ queryKey: coinKeys.coinRule(id) });
    },
  });
}

export function useDeleteCoinRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.deleteCoinRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coinKeys.coinRules() });
      queryClient.invalidateQueries({ queryKey: coinKeys.rules() });
    },
  });
}

// --- Coin Limits Mutations ---

export function useCreateCoinLimit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => opsApi.createCoinLimit(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coinKeys.coinLimits() });
      queryClient.invalidateQueries({ queryKey: coinKeys.dailyLimits() });
    },
  });
}

export function useUpdateCoinLimit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => opsApi.updateCoinLimit(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: coinKeys.coinLimits() });
      queryClient.invalidateQueries({ queryKey: coinKeys.coinLimit(variables.id) });
      queryClient.invalidateQueries({ queryKey: coinKeys.dailyLimits() });
    },
  });
}

export function useDeleteCoinLimit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.deleteCoinLimit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coinKeys.coinLimits() });
      queryClient.invalidateQueries({ queryKey: coinKeys.dailyLimits() });
    },
  });
}

// --- Coin Multipliers Mutations ---

export function useCreateCoinMultiplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => opsApi.createCoinMultiplier(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coinKeys.coinMultipliers() });
    },
  });
}

export function useUpdateCoinMultiplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => opsApi.updateCoinMultiplier(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: coinKeys.coinMultipliers() });
      queryClient.invalidateQueries({ queryKey: coinKeys.coinMultiplier(variables.id) });
    },
  });
}

export function useDeleteCoinMultiplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.deleteCoinMultiplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coinKeys.coinMultipliers() });
    },
  });
}
