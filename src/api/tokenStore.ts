import * as SecureStore from 'expo-secure-store';

// Tokens are secrets: never log them.
const ACCESS_KEY = 'oh.accessToken';
const REFRESH_KEY = 'oh.refreshToken';

export type Tokens = { accessToken: string; refreshToken: string };

let accessToken: string | null = null;
let refreshToken: string | null = null;
let loaded = false;

export async function loadTokens(): Promise<Tokens | null> {
  if (!loaded) {
    try {
      accessToken = await SecureStore.getItemAsync(ACCESS_KEY);
      refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
    } catch {
      accessToken = null;
      refreshToken = null;
    }
    loaded = true;
  }
  return accessToken && refreshToken ? { accessToken, refreshToken } : null;
}

export async function getAccessToken(): Promise<string | null> {
  await loadTokens();
  return accessToken;
}

export async function getRefreshToken(): Promise<string | null> {
  await loadTokens();
  return refreshToken;
}

export async function setTokens(tokens: Tokens): Promise<void> {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  loaded = true;
  await SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  loaded = true;
  try {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  } catch {
    // in-memory cache is already cleared
  }
}

/** Test helper: forget the in-memory cache so the next read hits SecureStore. */
export function resetTokenCache(): void {
  accessToken = null;
  refreshToken = null;
  loaded = false;
}
