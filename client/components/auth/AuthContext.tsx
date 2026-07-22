'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import type {
  AuthUser,
  AuthModalView,
  GoogleAuthResponse,
  RequestOtpPayload,
  RequestOtpResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
  UpdateProfilePayload,
} from '@/types/auth';
import { authApi } from '@/lib/api/authApi';
import { extractApiError } from '@/lib/api/client';
import type { LoginFormValues, SignUpFormValues } from '@/lib/validation/authSchemas';

/* ─── Context Shape ─────────────────────────────────────── */

interface AuthContextValue {
  /* State */
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  /* Permissions helper */
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;

  /* Modal control */
  isAuthModalOpen: boolean;
  modalView: AuthModalView;
  draftIdentifier: string;
  setDraftIdentifier: (v: string) => void;
  openAuthModal: (view?: AuthModalView, identifier?: string) => void;
  closeAuthModal: () => void;
  setModalView: (view: AuthModalView) => void;

  /* Actions */
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;

  /* Mutations */
  googleAuthMutation: UseMutationResult<GoogleAuthResponse, Error, string>;
  requestOtpMutation: UseMutationResult<RequestOtpResponse, Error, RequestOtpPayload>;
  verifyOtpMutation: UseMutationResult<VerifyOtpResponse, Error, VerifyOtpPayload>;
  updateProfileMutation: UseMutationResult<AuthUser, Error, UpdateProfilePayload>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ─── Provider ──────────────────────────────────────────── */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [modalView, setModalView] = useState<AuthModalView>('sign-in');
  const [draftIdentifier, setDraftIdentifier] = useState('');

  /* --- Session query (GET /auth/me) --- */
  const {
    data: user = null,
    isLoading,
  } = useQuery<AuthUser | null>({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getMe,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
    retry: false,
  });

  /* --- Listen for session-expired event from Axios interceptor --- */
  useEffect(() => {
    const handleSessionExpired = () => {
      queryClient.setQueryData(['auth', 'me'], null);
    };
    window.addEventListener('gc:session-expired', handleSessionExpired);
    return () => window.removeEventListener('gc:session-expired', handleSessionExpired);
  }, [queryClient]);

  /* --- Modal helpers --- */
  const openAuthModal = useCallback(
    (view: AuthModalView = 'sign-in', identifier?: string) => {
      setModalView(view);
      if (identifier !== undefined) setDraftIdentifier(identifier);
      setIsAuthModalOpen(true);
    },
    []
  );

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  /* --- Body scroll lock --- */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isAuthModalOpen) return;

    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      const saved = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (saved) window.scrollTo(0, parseInt(saved, 10) * -1);
    };
  }, [isAuthModalOpen]);

  /* --- Google Auth Mutation --- */
  const googleAuthMutation = useMutation<GoogleAuthResponse, Error, string>({
    mutationFn: (token) => authApi.googleAuth(token),
    onSuccess: (res) => {
      queryClient.setQueryData(['auth', 'me'], res.user);
      setIsAuthModalOpen(false);
    },
  });

  /* --- OTP Mutations --- */
  const requestOtpMutation = useMutation<RequestOtpResponse, Error, RequestOtpPayload>({
    mutationFn: (payload) => authApi.requestOtp(payload),
  });

  const verifyOtpMutation = useMutation<VerifyOtpResponse, Error, VerifyOtpPayload>({
    mutationFn: (payload) => authApi.verifyOtp(payload),
  });

  /* --- Profile Mutation --- */
  const updateProfileMutation = useMutation<AuthUser, Error, UpdateProfilePayload>({
    mutationFn: (payload) => authApi.updateProfile(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['auth', 'me'], updated);
    },
  });

  /* --- Logout --- */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore — cookie will be cleared server-side or expired
    }
    queryClient.setQueryData(['auth', 'me'], null);
    queryClient.removeQueries({ queryKey: ['auth'] });
  }, [queryClient]);

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } catch {
      // Ignore
    }
    queryClient.setQueryData(['auth', 'me'], null);
    queryClient.removeQueries({ queryKey: ['auth'] });
  }, [queryClient]);

  /* --- Permission helpers --- */
  const hasPermission = useCallback(
    (perm: string) => user?.permissions?.includes(perm) ?? false,
    [user]
  );

  const hasRole = useCallback(
    (role: string) => user?.roles?.some((r) => r.role === role) ?? false,
    [user]
  );

  /* --- Memoized value --- */
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      hasPermission,
      hasRole,
      isAuthModalOpen,
      modalView,
      draftIdentifier,
      setDraftIdentifier,
      openAuthModal,
      closeAuthModal,
      setModalView,
      logout,
      logoutAll,
      googleAuthMutation,
      requestOtpMutation,
      verifyOtpMutation,
      updateProfileMutation,
    }),
    [
      user,
      isLoading,
      hasPermission,
      hasRole,
      isAuthModalOpen,
      modalView,
      draftIdentifier,
      openAuthModal,
      closeAuthModal,
      logout,
      logoutAll,
      googleAuthMutation,
      requestOtpMutation,
      verifyOtpMutation,
      updateProfileMutation,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* ─── Hook ──────────────────────────────────────────────── */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
