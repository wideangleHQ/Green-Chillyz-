'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { authApi } from '@/lib/api/authApi';
import { useQueryClient } from '@tanstack/react-query';

/**
 * OAuth callback page.
 * After Supabase redirects here with an access_token in the URL hash,
 * we extract it, send it to our NestJS backend (POST /auth/google),
 * and the backend sets HttpOnly cookies + returns the user.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    async function handleCallback() {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          router.replace('/');
          return;
        }

        // Supabase stores session data from the URL hash automatically
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session?.access_token) {
          router.replace('/');
          return;
        }

        // Send Supabase access token to our NestJS backend
        const result = await authApi.googleAuth(data.session.access_token);

        // Update the global auth cache
        queryClient.setQueryData(['auth', 'me'], result.user);

        // Sign out of Supabase client (we don't use Supabase sessions)
        await supabase.auth.signOut();

        router.replace('/');
      } catch {
        router.replace('/');
      }
    }

    handleCallback();
  }, [router, queryClient]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="size-10 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
        <p className="text-sm font-medium text-slate-600">Authenticating…</p>
      </div>
    </div>
  );
}
