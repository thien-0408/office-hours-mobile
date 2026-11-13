import { useSyncExternalStore } from 'react';
import type { UserProfile, UserRole } from '../api/types';
import {
  useSession,
  type SessionStatus,
} from '../features/auth/session/SessionProvider';

/**
 * TODO(MO-04): delete this file once Login is wired to the API.
 * Dev-only fake session so every role's navigation can be clicked through
 * without a backend. setDevRole is a no-op unless __DEV__.
 */
let devRole: UserRole | null = null;
const listeners = new Set<() => void>();

function fake(role: UserRole, fullName: string): UserProfile {
  return {
    id: `dev-${role.toLowerCase()}`,
    email: `${role.toLowerCase()}@dev.local`,
    fullName,
    role,
    department: null,
    notificationPrefs: {
      bookingConfirmed: true,
      bookingDeclined: true,
      waitlistOffer: true,
      reminders: true,
    },
  };
}

const FAKE_USERS: Record<UserRole, UserProfile> = {
  STUDENT: fake('STUDENT', 'Sinh viên Dev'),
  LECTURER: fake('LECTURER', 'Giảng viên Dev'),
  ADMIN: fake('ADMIN', 'Admin Dev'),
};

export function setDevRole(role: UserRole | null) {
  if (!__DEV__) {
    return;
  }
  devRole = role;
  listeners.forEach(l => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useDevRole(): UserRole | null {
  const role = useSyncExternalStore(
    subscribe,
    () => devRole,
    () => null,
  );
  return __DEV__ ? role : null;
}

export type AppSession = {
  status: SessionStatus;
  role: UserRole | null;
  signOut: () => Promise<void>;
};

/** Real session, overridden by the dev role when one is set (dev builds only). */
export function useAppSession(): AppSession {
  const session = useSession();
  const dev = useDevRole();
  if (dev) {
    return {
      status: 'signedIn',
      role: FAKE_USERS[dev].role,
      signOut: async () => setDevRole(null),
    };
  }
  return {
    status: session.status,
    role: session.role,
    signOut: session.signOut,
  };
}
