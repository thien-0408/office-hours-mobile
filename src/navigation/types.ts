import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Params of every numbered screen (MOBILE-PLAN section 7, SCREENS-FIREBASE
 * section 1). Ids are UUID strings. Each navigator's param list is a Pick of
 * this map, so a screen has one params shape wherever it is registered.
 */
export type ScreenParams = {
  // Tai khoan
  Welcome: undefined; // 0
  Login: undefined; // 1
  Register: undefined; // 2
  ForgotPassword: undefined; // 3
  ResetPassword: { token?: string } | undefined; // 4
  // Chung
  Dashboard: undefined; // 5
  Profile: undefined; // 6
  Settings: undefined; // 7
  Notifications: undefined; // 8
  Help: undefined; // 9
  // Booking
  LecturerSearch: undefined; // 10
  LecturerDetail: { lecturerId: string }; // 11
  BookSlot: { lecturerId: string; slotId?: string }; // 12
  BookingList: undefined; // 13
  BookingDetail: { bookingId: string }; // 14
  Reschedule: { bookingId: string }; // 15
  Waitlist: undefined; // 16
  // Lich
  MySchedule: undefined; // 17
  ScheduleScan: undefined; // 18
  // Chat
  Chat: { bookingId: string }; // 19
  // Campus
  CampusMap: { roomId?: string } | undefined; // 20
  LocationConsent: undefined; // 21
  LiveMeeting: { bookingId: string }; // 22
  // Giang vien
  Availability: undefined; // 23
  ReviewQueue: undefined; // 24
  MeetingRecord: { bookingId: string }; // 25
  // Admin
  UserAdmin: undefined; // 26
  CampusActivity: undefined; // 27
};

export type ScreenName = keyof ScreenParams;

export type AuthStackParamList = Pick<
  ScreenParams,
  'Welcome' | 'Login' | 'Register' | 'ForgotPassword' | 'ResetPassword'
>;

// Tabs: each tab hosts one root screen (tab name -> root: see roleConfig.ts).
export type StudentTabParamList = {
  Home: undefined;
  Find: undefined;
  Bookings: undefined;
  Map: ScreenParams['CampusMap'];
  Me: undefined;
};
export type LecturerTabParamList = {
  Home: undefined;
  Review: undefined;
  Calendar: undefined;
  Map: ScreenParams['CampusMap'];
  Me: undefined;
};
export type AdminTabParamList = {
  Users: undefined;
  Campus: undefined;
  Notifications: undefined;
  Me: undefined;
};

// Role stacks: Tabs + detail screens pushed over the tab bar.
export type StudentStackParamList = {
  Tabs: NavigatorScreenParams<StudentTabParamList>;
} & Pick<
  ScreenParams,
  | 'Notifications'
  | 'Settings'
  | 'Help'
  | 'LecturerDetail'
  | 'BookSlot'
  | 'BookingDetail'
  | 'Reschedule'
  | 'Waitlist'
  | 'MySchedule'
  | 'ScheduleScan'
  | 'Chat'
  | 'LocationConsent'
  | 'LiveMeeting'
>;
export type LecturerStackParamList = {
  Tabs: NavigatorScreenParams<LecturerTabParamList>;
} & Pick<
  ScreenParams,
  | 'Notifications'
  | 'Settings'
  | 'Help'
  | 'BookingDetail'
  | 'MySchedule'
  | 'ScheduleScan'
  | 'Chat'
  | 'LocationConsent'
  | 'LiveMeeting'
  | 'Availability'
  | 'MeetingRecord'
>;
export type AdminStackParamList = {
  Tabs: NavigatorScreenParams<AdminTabParamList>;
} & Pick<ScreenParams, 'Settings' | 'Help'>;

/** Loose shapes used by the generic role navigator. */
export type AnyTabParamList = Record<string, object | undefined>;
export type AnyStackParamList = ScreenParams & {
  Tabs: NavigatorScreenParams<AnyTabParamList>;
};
