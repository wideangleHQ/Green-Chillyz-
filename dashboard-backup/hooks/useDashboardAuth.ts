import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../lib/api/authApi';
import { dashboardKeys } from '../lib/queryKeys';
import type {
  DashboardLoginResponse,
  DashboardStoreContext,
  DashboardCurrentSession,
  DashboardSession,
  DashboardLogoutAllResponse,
  DashboardMessageResponse,
} from '../types/auth';

export function useDashboardLogin() {
  const queryClient = useQueryClient();

  return useMutation<DashboardLoginResponse, Error, string>({
    mutationFn: (accessCode: string) => authApi.login(accessCode),
    onSuccess: (data) => {
      queryClient.setQueryData(dashboardKeys.me, data.store);
    },
  });
}

export function useCurrentStore(enabled = true) {
  return useQuery<DashboardStoreContext, Error>({
    queryKey: dashboardKeys.me,
    queryFn: () => authApi.getMe(),
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled,
  });
}

export function useDashboardSession() {
  return useQuery<DashboardCurrentSession, Error>({
    queryKey: dashboardKeys.session,
    queryFn: () => authApi.getCurrentSession(),
    staleTime: 1000 * 60 * 2,
    retry: false,
  });
}

export function useDashboardSessions() {
  return useQuery<DashboardSession[], Error>({
    queryKey: dashboardKeys.sessions,
    queryFn: () => authApi.listSessions(),
    staleTime: 1000 * 60,
    retry: false,
  });
}

export function useDashboardLogout() {
  const queryClient = useQueryClient();

  return useMutation<DashboardMessageResponse, Error, void>({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useDashboardLogoutAll() {
  const queryClient = useQueryClient();

  return useMutation<DashboardLogoutAllResponse, Error, void>({
    mutationFn: () => authApi.logoutAll(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation<DashboardMessageResponse, Error, string>({
    mutationFn: (sessionId: string) => authApi.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.sessions });
    },
  });
}
