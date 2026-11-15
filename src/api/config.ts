// Dev: `adb reverse tcp:8080 tcp:8080` maps the device's localhost to the
// host machine (works for USB phones and emulators). Without adb reverse, call
// setApiBaseUrl('http://<LAN-IP>:8080/api/v1') or use 10.0.2.2 on an emulator.
export const DEFAULT_API_BASE_URL = 'http://localhost:8080/api/v1';

export const REQUEST_TIMEOUT_MS = 15000;

let baseUrl = DEFAULT_API_BASE_URL;

export function getApiBaseUrl(): string {
  return baseUrl;
}

export function setApiBaseUrl(url: string): void {
  baseUrl = url.trim().replace(/\/+$/, '');
}
