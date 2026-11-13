import { useCallback, useEffect, useSyncExternalStore } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { PermissionResult } from '../../../platform/permissions';

export const LOCATION_CONSENT_KEY = 'locationSharingConsent';

export type ConsentStatus = 'unknown' | 'granted' | 'declined';

export interface LocationConsentRecord {
  granted: boolean;
  at: string; // ISO 8601 timestamp
  version: 1;
}

export type NextStep = 'navigate' | 'retry' | 'settings';

export interface ConsentStoreState {
  status: ConsentStatus;
  loading: boolean;
  record: LocationConsentRecord | null;
}

const INITIAL_STATE: ConsentStoreState = {
  status: 'unknown',
  loading: true,
  record: null,
};

let currentState: ConsentStoreState = { ...INITIAL_STATE };
const listeners = new Set<() => void>();
let initPromise: Promise<LocationConsentRecord | null> | null = null;

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function getSnapshot(): ConsentStoreState {
  return currentState;
}

function getServerSnapshot(): ConsentStoreState {
  return INITIAL_STATE;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  ensureInitialized();
  return () => {
    listeners.delete(listener);
  };
}

async function readFromStorage(): Promise<LocationConsentRecord | null> {
  try {
    const raw = await SecureStore.getItemAsync(LOCATION_CONSENT_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.granted === 'boolean' &&
      typeof parsed.at === 'string' &&
      parsed.version === 1
    ) {
      return parsed as LocationConsentRecord;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Initialize consent state from secure storage if not yet loaded.
 */
export function ensureInitialized(): Promise<LocationConsentRecord | null> {
  if (!initPromise) {
    initPromise = (async () => {
      const record = await readFromStorage();
      const nextStatus: ConsentStatus = record
        ? record.granted
          ? 'granted'
          : 'declined'
        : 'unknown';
      currentState = {
        status: nextStatus,
        loading: false,
        record,
      };
      emitChange();
      return record;
    })();
  }
  return initPromise;
}

/**
 * Read the current stored consent from SecureStore.
 * Returns null if missing or invalid/corrupted JSON.
 */
export async function getConsent(): Promise<LocationConsentRecord | null> {
  const record = await readFromStorage();
  const nextStatus: ConsentStatus = record
    ? record.granted
      ? 'granted'
      : 'declined'
    : 'unknown';
  currentState = {
    status: nextStatus,
    loading: false,
    record,
  };
  emitChange();
  return record;
}

/**
 * Persist consent decision into SecureStore and broadcast to external store subscribers.
 */
export async function setConsent(granted: boolean): Promise<LocationConsentRecord> {
  const record: LocationConsentRecord = {
    granted,
    at: new Date().toISOString(),
    version: 1,
  };
  currentState = {
    status: granted ? 'granted' : 'declined',
    loading: false,
    record,
  };
  emitChange();
  try {
    await SecureStore.setItemAsync(
      LOCATION_CONSENT_KEY,
      JSON.stringify(record),
    );
  } catch {
    // In-memory state remains updated even if native store fails
  }
  return record;
}

/**
 * Clear stored location consent from SecureStore and reset status to 'unknown'.
 */
export async function clearConsent(): Promise<void> {
  currentState = {
    status: 'unknown',
    loading: false,
    record: null,
  };
  emitChange();
  try {
    await SecureStore.deleteItemAsync(LOCATION_CONSENT_KEY);
  } catch {
    // In-memory state remains cleared
  }
}

/**
 * Test helper: resets the in-memory cache and initialization promise.
 */
export function resetConsentCache(): void {
  currentState = { ...INITIAL_STATE };
  initPromise = null;
  emitChange();
}

/**
 * Hook for consuming and updating location sharing consent across screens.
 * Uses useSyncExternalStore for synchronous cross-screen state propagation.
 */
export function useLocationConsent() {
  const storeState = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    ensureInitialized();
  }, []);

  const grant = useCallback(async () => {
    await setConsent(true);
  }, []);

  const decline = useCallback(async () => {
    await setConsent(false);
  }, []);

  const revoke = useCallback(async () => {
    await clearConsent();
  }, []);

  return {
    status: storeState.status,
    loading: storeState.loading,
    record: storeState.record,
    grant,
    decline,
    revoke,
  };
}

/**
 * Pure decision mapping function based on PermissionResult.
 * - granted -> 'navigate' (goBack or proceed to next route)
 * - denied  -> 'retry' (show retry prompt)
 * - blocked -> 'settings' (show openSettings prompt)
 */
export function nextStepFor(result: PermissionResult): NextStep {
  switch (result) {
    case 'granted':
      return 'navigate';
    case 'denied':
      return 'retry';
    case 'blocked':
      return 'settings';
  }
}

/**
 * Helper to get Vietnamese explanation text for denied or blocked permission steps.
 */
export function getExplanationForStep(step: NextStep): string | null {
  switch (step) {
    case 'retry':
      return 'Bạn chưa cấp quyền truy cập vị trí. Vui lòng cho phép để hai bên có thể thấy nhau trên bản đồ khi đến giờ hẹn.';
    case 'settings':
      return 'Quyền truy cập vị trí đã bị chặn trong Cài đặt hệ thống. Vui lòng mở Cài đặt để cho phép ứng dụng truy cập vị trí.';
    case 'navigate':
    default:
      return null;
  }
}
