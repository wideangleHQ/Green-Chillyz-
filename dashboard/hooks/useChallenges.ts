import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsApi } from '../lib/api/opsApi';
import { challengeKeys } from '../lib/queryKeys';

export function useChallenges(params?: any) {
  return useQuery({
    queryKey: challengeKeys.list(params),
    queryFn: () => opsApi.listChallenges(params),
    staleTime: 60_000,
  });
}

export function useChallenge(id: string) {
  return useQuery({
    queryKey: challengeKeys.detail(id),
    queryFn: () => opsApi.getChallenge(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useChallengeHistory(id: string) {
  return useQuery({
    queryKey: challengeKeys.history(id),
    queryFn: () => opsApi.getChallengeHistory(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => opsApi.createChallenge(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.all });
    },
  });
}

export function useUpdateChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => opsApi.updateChallenge(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.all });
      queryClient.invalidateQueries({ queryKey: challengeKeys.detail(variables.id) });
    },
  });
}

export function useDeleteChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.deleteChallenge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.all });
    },
  });
}

export function useRestoreChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.restoreChallenge(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.all });
      queryClient.invalidateQueries({ queryKey: challengeKeys.detail(id) });
    },
  });
}

export function usePublishChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.publishChallenge(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.all });
      queryClient.invalidateQueries({ queryKey: challengeKeys.detail(id) });
    },
  });
}

export function usePauseChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.pauseChallenge(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.all });
      queryClient.invalidateQueries({ queryKey: challengeKeys.detail(id) });
    },
  });
}

export function useEndChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.endChallenge(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.all });
      queryClient.invalidateQueries({ queryKey: challengeKeys.detail(id) });
    },
  });
}

export function useDuplicateChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto?: any }) => opsApi.duplicateChallenge(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.all });
    },
  });
}

export function useCreateChallengeRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => opsApi.createChallengeRule(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.all });
    },
  });
}

export function useUpdateChallengeRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, dto }: { ruleId: string; dto: any }) => opsApi.updateChallengeRule(ruleId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.all });
    },
  });
}

export function useDeleteChallengeRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => opsApi.deleteChallengeRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.all });
    },
  });
}

export function useCreateChallengeReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => opsApi.createChallengeReward(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.all });
    },
  });
}

export function useUpdateChallengeReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rewardId, dto }: { rewardId: string; dto: any }) => opsApi.updateChallengeReward(rewardId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.all });
    },
  });
}

export function useDeleteChallengeReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rewardId: string) => opsApi.deleteChallengeReward(rewardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.all });
    },
  });
}
