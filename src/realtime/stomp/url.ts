/** http(s)://host:8080/api/v1 -> ws(s)://host:8080/api/v1/ws (native WebSocket, no SockJS). */
export function stompUrlFromApiBase(apiBaseUrl: string): string {
  return `${apiBaseUrl.trim().replace(/\/+$/, '').replace(/^http/i, 'ws')}/ws`;
}

/** `exp` of a JWT in ms since epoch; null when it cannot be read. */
export function jwtExpiryMs(token: string): number | null {
  try {
    const part = token.split('.')[1];
    if (!part) {
      return null;
    }
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = JSON.parse((globalThis as unknown as { atob: (s: string) => string }).atob(padded)) as { exp?: unknown };
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** True when there is no token, or it expires within `skewMs`. An unreadable expiry is trusted. */
export function needsRefresh(
  token: string | null,
  now: number,
  skewMs = 30_000,
): boolean {
  if (!token) {
    return true;
  }
  const exp = jwtExpiryMs(token);
  return exp !== null && exp - skewMs <= now;
}
