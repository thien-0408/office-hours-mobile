import type { ComponentType } from 'react';
import type { ScreenName } from './types';
import { WelcomeScreen } from '../features/auth/screens/WelcomeScreen';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { RegisterScreen } from '../features/auth/screens/RegisterScreen';
import { ForgotPasswordScreen } from '../features/auth/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../features/auth/screens/ResetPasswordScreen';
import { DashboardScreen } from '../features/dashboard/screens/DashboardScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { SettingsScreen } from '../features/profile/screens/SettingsScreen';
import { NotificationsScreen } from '../features/notifications/screens/NotificationsScreen';
import { HelpScreen } from '../features/help/screens/HelpScreen';
import { LecturerSearchScreen } from '../features/lecturers/screens/LecturerSearchScreen';
import { LecturerDetailScreen } from '../features/lecturers/screens/LecturerDetailScreen';
import { BookSlotScreen } from '../features/booking/screens/BookSlotScreen';
import { BookingListScreen } from '../features/booking/screens/BookingListScreen';
import { BookingDetailScreen } from '../features/booking/screens/BookingDetailScreen';
import { RescheduleScreen } from '../features/booking/screens/RescheduleScreen';
import { WaitlistScreen } from '../features/waitlist/screens/WaitlistScreen';
import { MyScheduleScreen } from '../features/schedule/screens/MyScheduleScreen';
import { ScheduleScanScreen } from '../features/schedule/screens/ScheduleScanScreen';
import { ChatScreen } from '../features/chat/screens/ChatScreen';
import { CampusMapScreen } from '../features/campus/screens/CampusMapScreen';
import { LocationConsentScreen } from '../features/campus/screens/LocationConsentScreen';
import { LiveMeetingScreen } from '../features/campus/screens/LiveMeetingScreen';
import { AvailabilityScreen } from '../features/availability/screens/AvailabilityScreen';
import { ReviewQueueScreen } from '../features/review/screens/ReviewQueueScreen';
import { MeetingRecordScreen } from '../features/review/screens/MeetingRecordScreen';
import { UserAdminScreen } from '../features/admin/screens/UserAdminScreen';
import { CampusActivityScreen } from '../features/admin/screens/CampusActivityScreen';

/** Screen name -> component. Feature tasks swap the placeholders behind these. */
export const SCREEN_COMPONENTS: Record<ScreenName, ComponentType> = {
  Welcome: WelcomeScreen,
  Login: LoginScreen,
  Register: RegisterScreen,
  ForgotPassword: ForgotPasswordScreen,
  ResetPassword: ResetPasswordScreen,
  Dashboard: DashboardScreen,
  Profile: ProfileScreen,
  Settings: SettingsScreen,
  Notifications: NotificationsScreen,
  Help: HelpScreen,
  LecturerSearch: LecturerSearchScreen,
  LecturerDetail: LecturerDetailScreen,
  BookSlot: BookSlotScreen,
  BookingList: BookingListScreen,
  BookingDetail: BookingDetailScreen,
  Reschedule: RescheduleScreen,
  Waitlist: WaitlistScreen,
  MySchedule: MyScheduleScreen,
  ScheduleScan: ScheduleScanScreen,
  Chat: ChatScreen,
  CampusMap: CampusMapScreen,
  LocationConsent: LocationConsentScreen,
  LiveMeeting: LiveMeetingScreen,
  Availability: AvailabilityScreen,
  ReviewQueue: ReviewQueueScreen,
  MeetingRecord: MeetingRecordScreen,
  UserAdmin: UserAdminScreen,
  CampusActivity: CampusActivityScreen,
};
