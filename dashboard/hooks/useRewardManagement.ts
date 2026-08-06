import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsApi } from '../lib/api/opsApi';
import { rewardKeys } from '../lib/queryKeys';

// --- Profile hooks ---

export function useRewardProfiles(params?: any) {
  return useQuery({
    queryKey: rewardKeys.profiles(params),
    queryFn: () => opsApi.listRewardProfiles(params),
    staleTime: 60_000,
  });
}

export function useRewardProfile(id: string) {
  return useQuery({
    queryKey: rewardKeys.profile(id),
    queryFn: () => opsApi.getRewardProfile(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useDefaultProfile() {
  return useQuery({
    queryKey: rewardKeys.defaultProfile(),
    queryFn: () => opsApi.getDefaultRewardProfile(),
    staleTime: 60_000,
  });
}

export function useProfileVersions(id: string) {
  return useQuery({
    queryKey: rewardKeys.profileVersions(id),
    queryFn: () => opsApi.getRewardProfileVersions(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => opsApi.createRewardProfile(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards-mgmt', 'profiles'] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => opsApi.updateRewardProfile(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rewards-mgmt', 'profiles'] });
      queryClient.invalidateQueries({ queryKey: rewardKeys.profile(variables.id) });
    },
  });
}

export function useArchiveProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.archiveRewardProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards-mgmt', 'profiles'] });
    },
  });
}

export function usePublishProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.publishRewardProfile(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['rewards-mgmt', 'profiles'] });
      queryClient.invalidateQueries({ queryKey: rewardKeys.profile(id) });
    },
  });
}

export function useSetDefaultProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.setDefaultRewardProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards-mgmt', 'profiles'] });
      queryClient.invalidateQueries({ queryKey: rewardKeys.defaultProfile() });
    },
  });
}

// --- Rule hooks ---

export function useRewardRules(params?: any) {
  return useQuery({
    queryKey: rewardKeys.rules(params),
    queryFn: () => opsApi.listRewardRules(params),
    staleTime: 60_000,
  });
}

export function useRulesByProfile(profileId: string) {
  return useQuery({
    queryKey: rewardKeys.rulesByProfile(profileId),
    queryFn: () => opsApi.getRewardRulesByProfile(profileId),
    enabled: !!profileId,
    staleTime: 60_000,
  });
}

export function useMilestones() {
  return useQuery({
    queryKey: rewardKeys.milestones(),
    queryFn: () => opsApi.getRewardMilestones(),
    staleTime: 60_000,
  });
}

export function useRewardRule(id: string) {
  return useQuery({
    queryKey: rewardKeys.rule(id),
    queryFn: () => opsApi.getRewardRule(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => opsApi.createRewardRule(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards-mgmt', 'rules'] });
    },
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => opsApi.updateRewardRule(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rewards-mgmt', 'rules'] });
      queryClient.invalidateQueries({ queryKey: rewardKeys.rule(variables.id) });
    },
  });
}

export function useEnableRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.enableRewardRule(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['rewards-mgmt', 'rules'] });
      queryClient.invalidateQueries({ queryKey: rewardKeys.rule(id) });
    },
  });
}

export function useDisableRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.disableRewardRule(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['rewards-mgmt', 'rules'] });
      queryClient.invalidateQueries({ queryKey: rewardKeys.rule(id) });
    },
  });
}

// --- Assignment hooks ---

export function useRewardAssignments(params?: any) {
  return useQuery({
    queryKey: rewardKeys.assignments(params),
    queryFn: () => opsApi.listRewardAssignments(params),
    staleTime: 60_000,
  });
}

export function useMyAssignment() {
  return useQuery({
    queryKey: rewardKeys.myAssignment(),
    queryFn: () => opsApi.getMyRewardAssignment(),
    staleTime: 60_000,
  });
}

export function useMyProfile() {
  return useQuery({
    queryKey: rewardKeys.myProfile(),
    queryFn: () => opsApi.getMyRewardProfile(),
    staleTime: 60_000,
  });
}

export function useMyAssignmentHistory() {
  return useQuery({
    queryKey: rewardKeys.myAssignmentHistory(),
    queryFn: () => opsApi.getMyRewardAssignmentHistory(),
    staleTime: 60_000,
  });
}

export function useAssignProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => opsApi.assignRewardProfile(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards-mgmt', 'assignments'] });
      queryClient.invalidateQueries({ queryKey: rewardKeys.myAssignment() });
    },
  });
}

export function useChangeStoreProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, dto }: { storeId: string; dto: any }) => opsApi.changeStoreRewardProfile(storeId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards-mgmt', 'assignments'] });
      queryClient.invalidateQueries({ queryKey: rewardKeys.myAssignment() });
    },
  });
}

// --- Override hooks ---

export function useMyOverrides(params?: any) {
  return useQuery({
    queryKey: rewardKeys.myOverrides(params),
    queryFn: () => opsApi.listMyRewardOverrides(params),
    staleTime: 60_000,
  });
}

export function usePreviewMyRewards() {
  return useQuery({
    queryKey: rewardKeys.overridePreview(),
    queryFn: () => opsApi.previewMyRewards(),
    staleTime: 60_000,
  });
}

export function useMyOverrideHistory() {
  return useQuery({
    queryKey: rewardKeys.myOverrideHistory(),
    queryFn: () => opsApi.getMyOverrideHistory(),
    staleTime: 60_000,
  });
}

export function useCreateOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => opsApi.createRewardOverride(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards-mgmt', 'overrides'] });
    },
  });
}

export function useUpdateOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => opsApi.updateRewardOverride(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rewards-mgmt', 'overrides'] });
      queryClient.invalidateQueries({ queryKey: rewardKeys.override(variables.id) });
    },
  });
}

export function useArchiveOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.archiveRewardOverride(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards-mgmt', 'overrides'] });
    },
  });
}

// --- Profile extras ---

export function useRollbackProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, versionNumber }: { id: string; versionNumber: number }) =>
      opsApi.rollbackRewardProfile(id, versionNumber),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rewards-mgmt', 'profiles'] });
      queryClient.invalidateQueries({ queryKey: rewardKeys.profile(variables.id) });
      queryClient.invalidateQueries({ queryKey: rewardKeys.profileVersions(variables.id) });
    },
  });
}

// --- Rule extras ---

export function useDuplicateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.duplicateRewardRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards-mgmt', 'rules'] });
    },
  });
}

export function useBulkUpdateRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => opsApi.bulkUpdateRewardRules(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards-mgmt', 'rules'] });
    },
  });
}

// --- Assignment extras ---

export function useRestoreAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => opsApi.restoreRewardAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards-mgmt', 'assignments'] });
    },
  });
}

export function useBulkAssignProfiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => opsApi.bulkAssignRewardProfiles(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards-mgmt', 'assignments'] });
    },
  });
}

// --- Override extras ---

export function useBulkCreateOverrides() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => opsApi.bulkCreateRewardOverrides(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards-mgmt', 'overrides'] });
    },
  });
}

// --- Analytics & Search hooks ---

export function useRewardAnalytics() {
  return useQuery({
    queryKey: rewardKeys.rewardAnalytics(),
    queryFn: () => opsApi.getRewardAnalytics(),
    staleTime: 60_000,
  });
}

export function useRewardSearch(params?: any) {
  return useQuery({
    queryKey: rewardKeys.rewardSearch(params),
    queryFn: () => opsApi.searchRewards(params),
    enabled: !!params?.q,
    staleTime: 60_000,
  });
}
