// Android emulator reaches the host machine at 10.0.2.2. On a physical phone,
// call setApiBaseUrl('http://<LAN-IP>:8080/api/v1') at runtime.
export const DEFAULT_API_BASE_URL = 'http://10.0.2.2:8080/api/v1';

export const REQUEST_TIMEOUT_MS = 15000;

let baseUrl = DEFAULT_API_BASE_URL;

export function getApiBaseUrl(): string {
  return baseUrl;
}

export function setApiBaseUrl(url: string): void {
  baseUrl = url.trim().replace(/\/+$/, '');
}
