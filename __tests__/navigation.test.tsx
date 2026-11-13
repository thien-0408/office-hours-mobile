import {
  AUTH_SCREENS,
  initialAuthRoute,
  resolveTarget,
  ROLE_SPECS,
  SCREEN_NUMBER,
  screensForRole,
  shouldShowWelcome,
  tabNamesForRole,
} from '../src/navigation/roleConfig';
import { SCREEN_COMPONENTS } from '../src/navigation/screenComponents';
import type { ScreenName } from '../src/navigation/types';
import type { UserRole } from '../src/api/types';

const ROLES: UserRole[] = ['STUDENT', 'LECTURER', 'ADMIN'];
const ALL = Object.keys(SCREEN_NUMBER) as ScreenName[];

test('role -> tab names', () => {
  expect(tabNamesForRole('STUDENT')).toEqual([
    'Home',
    'Find',
    'Bookings',
    'Map',
    'Me',
  ]);
  expect(tabNamesForRole('LECTURER')).toEqual([
    'Home',
    'Review',
    'Calendar',
    'Map',
    'Me',
  ]);
  expect(tabNamesForRole('ADMIN')).toEqual([
    'Users',
    'Campus',
    'Notifications',
    'Me',
  ]);
});

test('screens are numbered 0..27 exactly once and all have a component', () => {
  expect(ALL).toHaveLength(28);
  expect(ALL.map(n => SCREEN_NUMBER[n]).sort((a, b) => a - b)).toEqual(
    Array.from({ length: 28 }, (_, i) => i),
  );
  ALL.forEach(n => expect(SCREEN_COMPONENTS[n]).toBeDefined());
});

test.each(ROLES)('%s registers each of its screens exactly once', role => {
  const screens = screensForRole(role);
  expect(new Set(screens).size).toBe(screens.length);
  const tabNames = ROLE_SPECS[role].tabs.map(t => t.name);
  expect(new Set(tabNames).size).toBe(tabNames.length);
});

test('every screen belongs to auth or at least one role', () => {
  ALL.forEach(n => {
    const owners =
      (AUTH_SCREENS.includes(n) ? 1 : 0) +
      ROLES.filter(r => screensForRole(r).includes(n)).length;
    expect(owners).toBeGreaterThan(0);
  });
  // auth screens are never inside a role app
  ROLES.forEach(r =>
    AUTH_SCREENS.forEach(n => expect(screensForRole(r)).not.toContain(n)),
  );
});

test('role-specific screens', () => {
  expect(screensForRole('STUDENT')).toContain('LecturerDetail');
  expect(screensForRole('LECTURER')).not.toContain('LecturerDetail');
  expect(screensForRole('LECTURER')).toEqual(
    expect.arrayContaining(['Availability', 'MeetingRecord', 'ReviewQueue']),
  );
  expect(screensForRole('ADMIN')).toEqual(
    expect.arrayContaining(['UserAdmin', 'CampusActivity']),
  );
});

test('resolveTarget: tab root vs stack vs unreachable', () => {
  expect(resolveTarget('STUDENT', 'Dashboard')).toEqual({
    kind: 'tab',
    tab: 'Home',
  });
  expect(resolveTarget('STUDENT', 'BookingDetail')).toEqual({
    kind: 'stack',
    screen: 'BookingDetail',
  });
  expect(resolveTarget('STUDENT', 'ReviewQueue')).toBeNull();
  expect(resolveTarget(null, 'Login')).toEqual({
    kind: 'stack',
    screen: 'Login',
  });
  expect(resolveTarget(null, 'Dashboard')).toBeNull();
});

test('Welcome shows only when the welcomeSeen flag is absent', () => {
  expect(shouldShowWelcome(null)).toBe(true);
  expect(shouldShowWelcome(undefined)).toBe(true);
  expect(shouldShowWelcome('')).toBe(true);
  expect(shouldShowWelcome('1')).toBe(false);
  expect(initialAuthRoute(null)).toBe('Welcome');
  expect(initialAuthRoute('1')).toBe('Login');
});
