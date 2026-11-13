import * as SecureStore from 'expo-secure-store';

const KEY = 'welcomeSeen';

export async function readWelcomeSeen(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

export async function markWelcomeSeen(): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, '1');
  } catch {
    // not fatal: Welcome just shows again next launch
  }
}
