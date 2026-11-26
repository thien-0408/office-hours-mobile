import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppRole } from '../components/AppPrimitives';
import { colors, fontFamily, radius, squircle } from '../theme/tokens';

// 01. Auth (4 màn)
import { WelcomeScreen } from '../features/auth/WelcomeScreen';
import { LoginScreen } from '../features/auth/LoginScreen';
import { RegisterScreen } from '../features/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../features/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../features/auth/ResetPasswordScreen';

// 02. Common & Dashboards (6 màn)
import { StudentDashboardScreen } from '../features/common/StudentDashboardScreen';
import { LecturerDashboardScreen } from '../features/common/LecturerDashboardScreen';
import { NotificationsScreen } from '../features/common/NotificationsScreen';
import { ProfileScreen } from '../features/common/ProfileScreen';
import { SettingsScreen } from '../features/common/SettingsScreen';
import { HelpScreen } from '../features/common/HelpScreen';

// 03. Booking & Sheets (5 màn + 2 sheet)
import { LecturerSearchScreen } from '../features/booking/LecturerSearchScreen';
import { LecturerDetailScreen } from '../features/booking/LecturerDetailScreen';
import { BookSlotSheet } from '../features/booking/BookSlotSheet';
import { BookingListScreen } from '../features/booking/BookingListScreen';
import { BookingDetailScreen } from '../features/booking/BookingDetailScreen';
import { RescheduleSheet } from '../features/booking/RescheduleSheet';
import { WaitlistScreen } from '../features/booking/WaitlistScreen';

// 04. Schedule & Chat (4 màn)
import { MyScheduleScreen } from '../features/schedule-chat/MyScheduleScreen';
import { ScanTimetableCameraScreen } from '../features/schedule-chat/ScanTimetableCameraScreen';
import { ScanTimetableReviewScreen } from '../features/schedule-chat/ScanTimetableReviewScreen';
import { BookingChatScreen } from '../features/schedule-chat/BookingChatScreen';

// 05. Lecturer & Admin (4 màn)
import { LecturerAvailabilityScreen } from '../features/lecturer-admin/LecturerAvailabilityScreen';
import { ReviewRequestsScreen } from '../features/lecturer-admin/ReviewRequestsScreen';
import { MeetingRecordScreen } from '../features/lecturer-admin/MeetingRecordScreen';
import { UserManagementScreen } from '../features/lecturer-admin/UserManagementScreen';

// 06. Map & Campus (5 màn)
import { CampusMapScreen } from '../features/map/CampusMapScreen';
import { FloorPlanScreen } from '../features/map/FloorPlanScreen';
import { LocationConsentScreen } from '../features/map/LocationConsentScreen';
import { LiveMeetingMapScreen } from '../features/map/LiveMeetingMapScreen';
import { CampusActivityScreen } from '../features/map/CampusActivityScreen';

export type RouteName =
  // Auth
  | 'welcome'
  | 'login'
  | 'register'
  | 'forgot'
  | 'resetPassword'
  // Core dashboards & tabs
  | 'home'
  | 'search'
  | 'bookings'
  | 'map'
  | 'profile'
  // Secondary screens
  | 'notifications'
  | 'settings'
  | 'help'
  | 'lecturerDetail'
  | 'bookingDetail'
  | 'waitlist'
  | 'mySchedule'
  | 'scanCamera'
  | 'scanReview'
  | 'chat'
  | 'floorPlan'
  | 'locationConsent'
  | 'liveMeeting'
  // Lecturer & Admin
  | 'availability'
  | 'review'
  | 'meetingRecord'
  | 'users'
  | 'campusActivity';

const ALL_ROUTES: { key: RouteName; label: string; group: string }[] = [
  { key: 'welcome', label: '01. Chào mừng', group: 'Auth' },
  { key: 'login', label: '02. Đăng nhập', group: 'Auth' },
  { key: 'register', label: '03. Đăng ký', group: 'Auth' },
  { key: 'forgot', label: '04. Quên mật khẩu', group: 'Auth' },
  { key: 'resetPassword', label: '05. Đặt lại mật khẩu', group: 'Auth' },

  { key: 'home', label: '07. Trang chủ (SV / GV)', group: 'Chung' },
  { key: 'search', label: '08. Tìm giảng viên', group: 'Chung' },
  { key: 'notifications', label: '09. Thông báo', group: 'Chung' },
  { key: 'profile', label: '10. Hồ sơ cá nhân', group: 'Chung' },
  { key: 'settings', label: '11. Cài đặt', group: 'Chung' },
  { key: 'help', label: '11b. Trợ giúp & FAQ', group: 'Chung' },

  { key: 'lecturerDetail', label: '12. Hồ sơ giảng viên', group: 'Đặt lịch' },
  { key: 'bookings', label: '14. Danh sách lịch hẹn', group: 'Đặt lịch' },
  { key: 'bookingDetail', label: '15. Chi tiết buổi hẹn', group: 'Đặt lịch' },
  { key: 'waitlist', label: '16. Hàng đợi slot', group: 'Đặt lịch' },

  { key: 'mySchedule', label: '17. Lịch bận của tôi', group: 'Lịch & Chat' },
  { key: 'scanCamera', label: '18a. Quét TKB (Camera)', group: 'Lịch & Chat' },
  { key: 'scanReview', label: '18b. Soát lại TKB', group: 'Lịch & Chat' },
  { key: 'chat', label: '19. Phòng chat', group: 'Lịch & Chat' },

  { key: 'map', label: '20. Bản đồ campus 2.5D', group: 'Bản đồ' },
  { key: 'floorPlan', label: '20b. Sơ đồ tầng Block 11', group: 'Bản đồ' },
  { key: 'locationConsent', label: '21. Xin phép vị trí', group: 'Bản đồ' },
  { key: 'liveMeeting', label: '22. Buổi hẹn trực tiếp', group: 'Bản đồ' },

  { key: 'availability', label: '23. Lịch rảnh GV', group: 'Giảng viên & Admin' },
  { key: 'review', label: '24. Duyệt yêu cầu GV', group: 'Giảng viên & Admin' },
  { key: 'meetingRecord', label: '25. Biên bản & Tóm tắt', group: 'Giảng viên & Admin' },
  { key: 'users', label: '26. Quản lý người dùng', group: 'Giảng viên & Admin' },
  { key: 'campusActivity', label: '27. Hoạt động campus', group: 'Giảng viên & Admin' },
];

export function MockNavigator() {
  const [role, setRole] = useState<AppRole>('sv');
  const [stack, setStack] = useState<RouteName[]>(['home']);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [floorPlanState, setFloorPlanState] = useState<{
    buildingCode: string;
    floor: number;
    roomShortCode?: string;
  }>({ buildingCode: 'B11', floor: 3, roomShortCode: '306' });

  // State cho 2 modal sheet của luồng Booking
  const [bookSheet, setBookSheet] = useState<{
    visible: boolean;
    mode: 'book' | 'taken';
    timeRange: string;
  }>({ visible: false, mode: 'book', timeRange: '09:40 – 10:00' });
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const current = stack[stack.length - 1];

  const push = (next: RouteName) => setStack((prev) => [...prev, next]);
  const resetTo = (next: RouteName) => setStack([next]);
  const pop = () =>
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : ['home']));

  // Điều hướng thanh NavPill dưới đáy theo từng vai trò
  const handleTabSelect = (tab: string) => {
    if (tab === 'home') return resetTo('home');
    if (tab === 'search') return resetTo('search');
    if (tab === 'map') return resetTo('map');
    if (tab === 'profile') return resetTo('profile');

    if (tab === 'book') {
      return resetTo(role === 'gv' ? 'availability' : 'bookings');
    }
    if (tab === 'review') return resetTo('review');
    if (tab === 'users') return resetTo('users');
    if (tab === 'campus') return resetTo('campusActivity');
  };

  const switchRole = (nextRole: AppRole) => {
    setRole(nextRole);
    if (nextRole === 'sv') resetTo('home');
    if (nextRole === 'gv') resetTo('home');
    if (nextRole === 'ad') resetTo('users');
  };

  const renderScreen = () => {
    switch (current) {
      // 01. Auth
      case 'welcome':
        return (
          <WelcomeScreen
            onGoLogin={() => push('login')}
            onGoRegister={() => push('register')}
          />
        );
      case 'login':
        return (
          <LoginScreen
            onBack={pop}
            onGoRegister={() => push('register')}
            onGoForgotPassword={() => push('forgot')}
            onSubmitLogin={async () => {
              resetTo('home');
            }}
          />
        );
      case 'register':
        return (
          <RegisterScreen
            onBackToLogin={() => resetTo('login')}
            onSubmitRegister={async ({ role: regRole }) => {
              setRole(regRole === 'LECTURER' ? 'gv' : 'sv');
              resetTo('home');
            }}
          />
        );
      case 'forgot':
        return (
          <ForgotPasswordScreen
            onBackToLogin={() => resetTo('login')}
            onSubmitForgotPassword={async () => {
              push('resetPassword');
            }}
          />
        );
      case 'resetPassword':
        return (
          <ResetPasswordScreen
            onCloseToLogin={() => resetTo('login')}
            onTokenInvalid={() => resetTo('forgot')}
            onSubmitResetPassword={async () => {
              resetTo('login');
            }}
          />
        );

      // 02. Common & Dashboards
      case 'home':
        if (role === 'gv') {
          return (
            <LecturerDashboardScreen
              onSelectTab={handleTabSelect}
              {...({
                onPressAvatar: () => push('profile'),
                onOpenReview: () => resetTo('review'),
                onOpenAvailability: () => resetTo('availability'),
                onOpenBooking: () => push('bookingDetail'),
              } as any)}
            />
          );
        }
        return (
          <StudentDashboardScreen
            onPressAvatar={() => push('profile')}
            onPressNextBooking={() => push('bookingDetail')}
            onPressSeeAllLecturers={() => resetTo('search')}
            onPressSuggestedSlot={() => push('lecturerDetail')}
            onSelectTab={handleTabSelect}
          />
        );

      case 'search':
        return (
          <LecturerSearchScreen
            onSelectLecturer={() => push('lecturerDetail')}
            onSelectTab={handleTabSelect}
          />
        );

      case 'notifications':
        return (
          <NotificationsScreen
            role={role}
            onPressNotification={() => push('bookingDetail')}
            onPressAction={() => push('waitlist')}
            onSelectTab={handleTabSelect}
          />
        );

      case 'profile':
        return (
          <ProfileScreen
            role={role}
            onBack={pop}
            onSelectTab={handleTabSelect}
            {...({
              onOpenSettings: () => push('settings'),
              onOpenSchedule: () =>
                push(role === 'gv' ? 'availability' : 'mySchedule'),
              onLogout: () => resetTo('welcome'),
            } as any)}
          />
        );

      case 'settings':
        return (
          <SettingsScreen
            role={role}
            onPressChangePassword={() => push('resetPassword')}
            onPressLogout={() => resetTo('welcome')}
            onSelectTab={handleTabSelect}
          />
        );

      case 'help':
        return <HelpScreen onBack={pop} />;

      // 03. Booking
      case 'lecturerDetail':
        return (
          <>
            <LecturerDetailScreen
              onBack={pop}
              onOpenBookSheet={(slot) =>
                setBookSheet({
                  visible: true,
                  mode: 'book',
                  timeRange: `${slot.time} – 10:00`,
                })
              }
              onOpenWaitlistPrompt={(slot) =>
                setBookSheet({
                  visible: true,
                  mode: 'taken',
                  timeRange: `${slot.time} – 10:00`,
                })
              }
            />
            <BookSlotSheet
              visible={bookSheet.visible}
              initialMode={bookSheet.mode}
              lecturerName="TS. Nguyễn Minh Khoa"
              lecturerAvatarUrl="https://i.pravatar.cc/120?img=11"
              locationSubtitle="Trực tiếp tại 306.B11"
              dayNumber="19"
              dateLine="Thứ Năm, tháng 11"
              timeRange={bookSheet.timeRange}
              onClose={() =>
                setBookSheet((prev) => ({ ...prev, visible: false }))
              }
              {...({
                onConfirmBooking: async () => {
                  setBookSheet((prev) => ({ ...prev, visible: false }));
                  resetTo('bookings');
                },
                onJoinWaitlist: async () => {
                  setBookSheet((prev) => ({ ...prev, visible: false }));
                  push('waitlist');
                },
              } as any)}
            />
          </>
        );

      case 'bookings':
        return (
          <BookingListScreen
            role={role}
            onPressWaitlist={() => push('waitlist')}
            onPressBooking={() => push('bookingDetail')}
            onSelectTab={handleTabSelect}
          />
        );

      case 'bookingDetail':
        return (
          <>
            <BookingDetailScreen
              {...({
                onBack: pop,
                onOpenChat: () => push('chat'),
                onOpenMap: () => push('locationConsent'),
                onOpenReschedule: () => setRescheduleOpen(true),
                onOpenRecord: () => push('meetingRecord'),
              } as any)}
            />
            <RescheduleSheet
              visible={rescheduleOpen}
              currentSlotLabel="Thứ Năm 19/11 · 15:00"
              onClose={() => setRescheduleOpen(false)}
              onConfirmReschedule={async () => {
                setRescheduleOpen(false);
              }}
            />
          </>
        );

      case 'waitlist':
        return <WaitlistScreen onBack={pop} />;

      // 04. Schedule & Chat
      case 'mySchedule':
        return (
          <MyScheduleScreen
            role={role}
            onOpenScanTimetable={() => push('scanCamera')}
            onSelectTab={handleTabSelect}
          />
        );
      case 'scanCamera':
        return (
          <ScanTimetableCameraScreen
            onClose={pop}
            onPickFromGallery={() => push('scanReview')}
            onCapture={() => push('scanReview')}
          />
        );
      case 'scanReview':
        return (
          <ScanTimetableReviewScreen
            onBack={pop}
            onSaveBatch={async () => {
              resetTo('mySchedule');
            }}
          />
        );
      case 'chat':
        return (
          <BookingChatScreen
            showLecturerActionBar={role === 'gv'}
            onBack={pop}
            onMarkCompleted={() => push('meetingRecord')}
          />
        );

      // 05. Lecturer & Admin
      case 'availability':
        return <LecturerAvailabilityScreen onSelectTab={handleTabSelect} />;
      case 'review':
        return <ReviewRequestsScreen onSelectTab={handleTabSelect} />;
      case 'meetingRecord':
        return (
          <MeetingRecordScreen
            onBack={pop}
            onSaveRecord={async () => pop()}
          />
        );
      case 'users':
        return <UserManagementScreen onSelectTab={handleTabSelect} />;

      // 06. Map & Campus
      case 'map':
        return (
          <CampusMapScreen
            role={role}
            onPressDirections={() => push('locationConsent')}
            onOpenFloorPlan={(buildingCode, floor, roomShortCode) => {
              setFloorPlanState({ buildingCode, floor, roomShortCode });
              push('floorPlan');
            }}
            onSelectTab={handleTabSelect}
          />
        );
      case 'floorPlan':
        return (
          <FloorPlanScreen
            buildingCode={floorPlanState.buildingCode}
            initialFloor={floorPlanState.floor}
            initialSelectedRoom={floorPlanState.roomShortCode}
            onBack={pop}
          />
        );
      case 'locationConsent':
        return (
          <LocationConsentScreen
            onClose={pop}
            onSkip={pop}
            onEnableSharing={async () => push('liveMeeting')}
          />
        );
      case 'liveMeeting':
        return (
          <LiveMeetingMapScreen
            viewerRole={role === 'gv' ? 'LECTURER' : 'STUDENT'}
            studentHasBarometer={role !== 'gv'}
            onPressChat={() => push('chat')}
            onStopSharing={pop}
          />
        );
      case 'campusActivity':
        return <CampusActivityScreen onSelectTab={handleTabSelect} />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {renderScreen()}

      {/* Viên thuốc nhỏ góc trên phải để chuyển Role & nhảy tới bất kỳ màn nào */}
      <Pressable
        onPress={() => setDrawerOpen(true)}
        style={styles.devPill}
      >
        <Text style={styles.devPillText}>
          {role.toUpperCase()} · {current}
        </Text>
      </Pressable>

      <Modal
        visible={drawerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <View style={styles.scrim}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDrawerOpen(false)}
          />
          <View style={[styles.drawer, squircle(radius.sheet)]}>
            <Text style={styles.drawerTitle}>Chuyển vai trò & Màn hình</Text>

            <View style={styles.roleBar}>
              {(
                [
                  ['sv', 'Sinh viên'],
                  ['gv', 'Giảng viên'],
                  ['ad', 'Admin'],
                ] as [AppRole, string][]
              ).map(([rKey, rLabel]) => {
                const active = role === rKey;
                return (
                  <Pressable
                    key={rKey}
                    onPress={() => {
                      switchRole(rKey);
                      setDrawerOpen(false);
                    }}
                    style={[styles.roleBtn, active && styles.roleBtnOn]}
                  >
                    <Text
                      style={[
                        styles.roleBtnText,
                        active && { color: '#000000' },
                      ]}
                    >
                      {rLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <ScrollView style={{ maxHeight: 420, marginTop: 12 }}>
              {ALL_ROUTES.map((item) => {
                const isCur = item.key === current;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => {
                      resetTo(item.key);
                      setDrawerOpen(false);
                    }}
                    style={[styles.routeRow, isCur && styles.routeRowOn]}
                  >
                    <Text
                      style={[
                        styles.routeLabel,
                        isCur && { color: '#000000' },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        styles.routeGroup,
                        isCur && { color: 'rgba(0,0,0,0.6)' },
                      ]}
                    >
                      {item.group}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  devPill: {
    position: 'absolute',
    top: 52,
    right: 14,
    zIndex: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  devPillText: {
    fontFamily: fontFamily.bold,
    fontSize: 10.5,
    color: colors.fg,
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  drawer: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: colors.line2,
    padding: 20,
    paddingBottom: 32,
  },
  drawerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.fg,
  },
  roleBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  roleBtn: {
    flex: 1,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBtnOn: {
    backgroundColor: colors.fg,
    borderWidth: 0,
  },
  roleBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.fg2,
  },
  routeRow: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  routeRowOn: {
    backgroundColor: colors.fg,
  },
  routeLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.fg,
  },
  routeGroup: {
    fontFamily: fontFamily.medium,
    fontSize: 11.5,
    color: colors.fg3,
  },
});