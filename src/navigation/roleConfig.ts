import type { UserRole } from '../api/types';
import type { ScreenName, ScreenParams } from './types';

/** Screen number (MOBILE-PLAN section 7) of every screen. */
export const SCREEN_NUMBER: Record<ScreenName, number> = {
  Welcome: 0,
  Login: 1,
  Register: 2,
  ForgotPassword: 3,
  ResetPassword: 4,
  Dashboard: 5,
  Profile: 6,
  Settings: 7,
  Notifications: 8,
  Help: 9,
  LecturerSearch: 10,
  LecturerDetail: 11,
  BookSlot: 12,
  BookingList: 13,
  BookingDetail: 14,
  Reschedule: 15,
  Waitlist: 16,
  MySchedule: 17,
  ScheduleScan: 18,
  Chat: 19,
  CampusMap: 20,
  LocationConsent: 21,
  LiveMeeting: 22,
  Availability: 23,
  ReviewQueue: 24,
  MeetingRecord: 25,
  UserAdmin: 26,
  CampusActivity: 27,
};

export type TabIconName =
  | 'home'
  | 'search'
  | 'calendar'
  | 'map'
  | 'user'
  | 'inbox'
  | 'users'
  | 'bell';

export type TabSpec = {
  /** Route name inside the tab navigator. */
  name: string;
  label: string;
  icon: TabIconName;
  /** Screen shown as the tab's root. */
  root: ScreenName;
};

export type RoleSpec = {
  tabs: TabSpec[];
  /** Screens pushed over the tabs (native stack), in registration order. */
  stack: ScreenName[];
};

export const AUTH_SCREENS: ScreenName[] = [
  'Welcome',
  'Login',
  'Register',
  'ForgotPassword',
  'ResetPassword',
];

/**
 * The whole navigation graph of the signed-in app, in one place.
 * Each role: Stack[ Tabs[...roots], ...detail screens ].
 */
export const ROLE_SPECS: Record<UserRole, RoleSpec> = {
  STUDENT: {
    tabs: [
      { name: 'Home', label: 'Trang chủ', icon: 'home', root: 'Dashboard' },
      {
        name: 'Find',
        label: 'Giảng viên',
        icon: 'search',
        root: 'LecturerSearch',
      },
      {
        name: 'Bookings',
        label: 'Lịch hẹn',
        icon: 'calendar',
        root: 'BookingList',
      },
      { name: 'Map', label: 'Bản đồ', icon: 'map', root: 'CampusMap' },
      { name: 'Me', label: 'Tôi', icon: 'user', root: 'Profile' },
    ],
    stack: [
      'Notifications',
      'Settings',
      'Help',
      'LecturerDetail',
      'BookSlot',
      'BookingDetail',
      'Reschedule',
      'Waitlist',
      'MySchedule',
      'ScheduleScan',
      'Chat',
      'LocationConsent',
      'LiveMeeting',
    ],
  },
  LECTURER: {
    tabs: [
      { name: 'Home', label: 'Trang chủ', icon: 'home', root: 'Dashboard' },
      { name: 'Review', label: 'Duyệt', icon: 'inbox', root: 'ReviewQueue' },
      {
        name: 'Calendar',
        label: 'Lịch',
        icon: 'calendar',
        root: 'BookingList',
      },
      { name: 'Map', label: 'Bản đồ', icon: 'map', root: 'CampusMap' },
      { name: 'Me', label: 'Tôi', icon: 'user', root: 'Profile' },
    ],
    stack: [
      'Notifications',
      'Settings',
      'Help',
      'BookingDetail',
      'MySchedule',
      'ScheduleScan',
      'Chat',
      'LocationConsent',
      'LiveMeeting',
      'Availability',
      'MeetingRecord',
    ],
  },
  ADMIN: {
    tabs: [
      { name: 'Users', label: 'Người dùng', icon: 'users', root: 'UserAdmin' },
      { name: 'Campus', label: 'Campus', icon: 'map', root: 'CampusActivity' },
      {
        name: 'Notifications',
        label: 'Thông báo',
        icon: 'bell',
        root: 'Notifications',
      },
      { name: 'Me', label: 'Tôi', icon: 'user', root: 'Profile' },
    ],
    stack: ['Settings', 'Help'],
  },
};

export function tabNamesForRole(role: UserRole): string[] {
  return ROLE_SPECS[role].tabs.map(t => t.name);
}

/** Every screen a role can reach (tab roots + stack screens). */
export function screensForRole(role: UserRole): ScreenName[] {
  const spec = ROLE_SPECS[role];
  return [...spec.tabs.map(t => t.root), ...spec.stack];
}

/** Welcome only shows when the `welcomeSeen` flag was never stored. */
export function shouldShowWelcome(storedFlag: string | null | undefined) {
  return storedFlag == null || storedFlag === '';
}

export function initialAuthRoute(storedFlag: string | null | undefined) {
  return shouldShowWelcome(storedFlag) ? 'Welcome' : 'Login';
}

export type NavTarget =
  | { kind: 'stack'; screen: ScreenName }
  | { kind: 'tab'; tab: string };

/** How to reach `screen` from anywhere in the app; null if the role cannot. */
export function resolveTarget(
  role: UserRole | null,
  screen: ScreenName,
): NavTarget | null {
  if (!role) {
    return AUTH_SCREENS.includes(screen) ? { kind: 'stack', screen } : null;
  }
  const spec = ROLE_SPECS[role];
  const tab = spec.tabs.find(t => t.root === screen);
  if (tab) {
    return { kind: 'tab', tab: tab.name };
  }
  return spec.stack.includes(screen) ? { kind: 'stack', screen } : null;
}

/** Fake params so every placeholder link can navigate. TODO: remove with placeholders. */
export const SAMPLE_PARAMS: Partial<{
  [K in ScreenName]: ScreenParams[K];
}> = {
  LecturerDetail: { lecturerId: 'dev-lecturer-1' },
  BookSlot: { lecturerId: 'dev-lecturer-1', slotId: 'dev-slot-1' },
  BookingDetail: { bookingId: 'dev-booking-1' },
  Reschedule: { bookingId: 'dev-booking-1' },
  Chat: { bookingId: 'dev-booking-1' },
  LiveMeeting: { bookingId: 'dev-booking-1' },
  MeetingRecord: { bookingId: 'dev-booking-1' },
  ResetPassword: { token: 'dev-token' },
};
