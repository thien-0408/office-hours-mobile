import { api } from './client';
import type { FirebaseTokenResponse } from './domainTypes';

/** POST /realtime/firebase-token (no body) -> { firebaseToken }. 503 REALTIME_DISABLED, 502 REALTIME_UPSTREAM_FAILED. */
export function getFirebaseToken(): Promise<FirebaseTokenResponse> {
  return api.post<FirebaseTokenResponse>('/realtime/firebase-token');
}
