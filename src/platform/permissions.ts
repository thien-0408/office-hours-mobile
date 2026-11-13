import { Linking } from 'react-native';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { Barometer } from 'expo-sensors';

/**
 * granted: usable now.
 * denied:  refused this time, the system dialog can be shown again.
 * blocked: refused with "don't ask again" (or policy); only system Settings can fix it.
 */
export type PermissionResult = 'granted' | 'denied' | 'blocked';

type PermissionResponse = { granted: boolean; canAskAgain: boolean };

function toResult(res: PermissionResponse): PermissionResult {
  if (res.granted) {
    return 'granted';
  }
  return res.canAskAgain ? 'denied' : 'blocked';
}

/** Foreground location only: the app shares location while it is open. */
export async function requestForegroundLocation(): Promise<PermissionResult> {
  return toResult(await Location.requestForegroundPermissionsAsync());
}

export async function requestCamera(): Promise<PermissionResult> {
  return toResult(await Camera.requestCameraPermissionsAsync());
}

/** Barometer needs no permission; false means the device has no sensor ("Tầng ?"). */
export async function hasBarometer(): Promise<boolean> {
  try {
    return await Barometer.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Send the user to this app's system settings (for `blocked` results). */
export function openSettings(): Promise<void> {
  return Linking.openSettings();
}
