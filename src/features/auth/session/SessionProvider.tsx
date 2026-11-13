import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { login, logout } from '../../../api/auth';
import { onSessionExpired } from '../../../api/client';
import { loadTokens } from '../../../api/tokenStore';
import type { UserProfile, UserRole } from '../../../api/types';
import { me } from '../../../api/users';

export type SessionStatus = 'loading' | 'signedOut' | 'signedIn';

export type Session = {
  status: SessionStatus;
  user: UserProfile | null;
  role: UserRole | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-read /users/me (e.g. after updateMe). */
  reloadUser: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

// TODO(firebase): after sign-in/restore, exchange for a Firebase custom token and
// call signInWithCustomToken; sign out of Firebase in signOut. Not implemented yet.
// TODO(fcm): after sign-in/restore, request notification permission and subscribe to
// the user's FCM topics; unsubscribe in signOut. Not implemented yet.

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);
  const mounted = useRef(true);

  const clearLocal = useCallback(() => {
    if (!mounted.current) {
      return;
    }
    setUser(null);
    setStatus('signedOut');
    queryClient.clear();
  }, [queryClient]);

  // Restore on start.
  useEffect(() => {
    mounted.current = true;
    (async () => {
      const tokens = await loadTokens();
      if (!tokens) {
        clearLocal();
        return;
      }
      try {
        const profile = await me();
        if (mounted.current) {
          setUser(profile);
          setStatus('signedIn');
        }
      } catch {
        // 401: the client already cleared tokens (refresh failed). Network error:
        // tokens are kept, the user lands on sign-in and the next start restores.
        clearLocal();
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, [clearLocal]);

  // Refresh failed somewhere in the app.
  useEffect(() => onSessionExpired(clearLocal), [clearLocal]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await login(email, password); // stores tokens; ApiError/NetworkError propagate to the form
      const profile = await me();
      queryClient.clear();
      setUser(profile);
      setStatus('signedIn');
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    try {
      await logout(); // clears tokens even if the request fails
    } catch {
      // ignore: signing out locally is what matters
    }
    clearLocal();
  }, [clearLocal]);

  const reloadUser = useCallback(async () => {
    setUser(await me());
  }, []);

  const value = useMemo<Session>(
    () => ({
      status,
      user,
      role: user?.role ?? null,
      signIn,
      signOut,
      reloadUser,
    }),
    [status, user, signIn, signOut, reloadUser],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used inside <SessionProvider>');
  }
  return ctx;
}
