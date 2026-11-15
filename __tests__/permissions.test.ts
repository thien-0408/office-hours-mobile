import { Linking } from 'react-native';
import * as Location from 'expo-location';
import { Barometer } from 'expo-sensors';
import {
  hasBarometer,
  openSettings,
  requestForegroundLocation,
} from '../src/platform/permissions';

const mockLoc = Location.requestForegroundPermissionsAsync as jest.Mock;
const mockBaro = Barometer.isAvailableAsync as jest.Mock;

describe('permissions', () => {
  it('maps responses to granted / denied / blocked', async () => {
    expect(await requestForegroundLocation()).toBe('granted');
    mockLoc.mockResolvedValueOnce({ granted: false, canAskAgain: true });
    expect(await requestForegroundLocation()).toBe('denied');
    mockLoc.mockResolvedValueOnce({ granted: false, canAskAgain: false });
    expect(await requestForegroundLocation()).toBe('blocked');
  });

  it('reports barometer availability and tolerates errors', async () => {
    expect(await hasBarometer()).toBe(true);
    mockBaro.mockResolvedValueOnce(false);
    expect(await hasBarometer()).toBe(false);
    mockBaro.mockRejectedValueOnce(new Error('no sensor'));
    expect(await hasBarometer()).toBe(false);
  });

  it('opens system settings', async () => {
    const spy = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    await openSettings();
    expect(spy).toHaveBeenCalled();
  });
});
