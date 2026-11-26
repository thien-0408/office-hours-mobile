import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { SectionHeader } from '../../components/AppPrimitives';
import {
  IconButton,
  PillButton,
  RevealView,
  ToastBanner,
} from '../../components/AuthPrimitives';
import { DateBlock } from '../../components/BookingPrimitives';
import { GlowBackground } from '../../components/GlowBackground';
import {
  GlyphType,
  GoogleCalendarLogo,
  GoogleMeetLogo,
  StatusGlyph,
  ZoomLogo,
} from '../../components/Icons';
import { Pressable3D } from '../../components/Pressable3D';
import {
  colors,
  fontFamily,
  ls,
  radius,
  squircle,
  typography,
} from '../../theme/tokens';

export interface TimelineEventItem {
  id: string;
  glyph: GlyphType;
  dimmed?: boolean;
  title: string;
  subtitle: string;
  time: string;
}

interface BookingDetailScreenProps {
  showConfirmedToast?: boolean;
  lecturerName?: string;
  lecturerAvatarUrl?: string;
  departmentAndTopic?: string;
  dayNumber?: string;
  dateLine?: string;
  timeRange?: string;
  meetingUrl?: string;
  within24Hours?: boolean;
  timeline?: TimelineEventItem[];
  onBack?: () => void;
  onOpenChat?: () => void;
  onOpenReschedule?: () => void;
  onCancelBooking?: () => void;
}

const SAMPLE_TIMELINE: TimelineEventItem[] = [
  {
    id: 't1',
    glyph: 'ok',
    title: 'Đã xác nhận',
    subtitle: 'bởi ThS. Phạm Anh Thư',
    time: '11:30',
  },
  {
    id: 't2',
    glyph: 'wait',
    dimmed: true,
    title: 'Đã gửi yêu cầu',
    subtitle: '"Sửa bài Task 2 tuần trước"',
    time: '08:02',
  },
];

export function BookingDetailScreen({
  showConfirmedToast = true,
  lecturerName = 'ThS. Phạm Anh Thư',
  lecturerAvatarUrl = 'https://i.pravatar.cc/200?img=32',
  departmentAndTopic = 'Khoa Ngôn ngữ · IELTS Writing',
  dayNumber = '19',
  dateLine = 'Thứ Năm, tháng 11',
  timeRange = '15:00 – 15:20',
  meetingUrl = 'https://meet.google.com/abc-defg-hij',
  within24Hours = false,
  timeline = SAMPLE_TIMELINE,
  onBack,
  onOpenChat,
  onOpenReschedule,
  onCancelBooking,
}: BookingDetailScreenProps) {
  // Xác định dịch vụ họp từ tên miền meetingUrl
  const provider = meetingUrl?.includes('meet.google.com')
    ? 'meet'
    : meetingUrl?.includes('zoom.us')
      ? 'zoom'
      : meetingUrl
        ? 'other'
        : null;

  const handleJoinMeeting = () => {
    if (meetingUrl) Linking.openURL(meetingUrl).catch(() => { });
  };

  const handleAddGoogleCalendar = () => {
    const title = encodeURIComponent(`OfficeHours: ${lecturerName}`);
    const details = encodeURIComponent(departmentAndTopic);
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
    Linking.openURL(url).catch(() => { });
  };

  return (
    <View style={styles.root}>
      <GlowBackground tone="wine" position="tl" />

      <SafeAreaView style={{ flex: 1 }}>
        {showConfirmedToast && (
          <ToastBanner
            glyph="ok"
            title="Đã được xác nhận"
            subtitle={`${lecturerName} vừa duyệt yêu cầu.`}
          />
        )}

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.appHead}>
            <IconButton icon="left" onPress={onBack} />
            <IconButton icon="message" onPress={onOpenChat} />
          </View>

          <RevealView index={0} style={styles.lecHeader}>
            <Image
              source={{ uri: lecturerAvatarUrl }}
              style={[styles.avatarLg, squircle(20)]}
              contentFit="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={typography.h2}>{lecturerName}</Text>
              <Text style={[typography.sm, { marginTop: 2 }]}>
                {departmentAndTopic}
              </Text>
            </View>
          </RevealView>

          <RevealView index={1}>
            <DateBlock
              dayNumber={dayNumber}
              line1={dateLine}
              timeRange={timeRange}
              suffix={provider ? ' · online' : undefined}
              style={{ marginTop: 24 }}
            />
          </RevealView>

          {/* Nút tham gia họp online (Google Meet / Zoom / Link) */}
          {provider && (
            <RevealView index={2} style={{ marginTop: 20 }}>
              <Pressable3D onPress={handleJoinMeeting}>
                <View style={styles.lightBtn}>
                  {provider === 'meet' && <GoogleMeetLogo size={20} />}
                  {provider === 'zoom' && <ZoomLogo size={20} />}
                  <Text style={styles.lightBtnText}>
                    {provider === 'meet'
                      ? 'Tham gia trên Google Meet'
                      : provider === 'zoom'
                        ? 'Tham gia trên Zoom'
                        : 'Mở link họp'}
                  </Text>
                </View>
              </Pressable3D>
            </RevealView>
          )}

          {/* Nút Thêm vào Google Calendar */}
          <RevealView index={3} style={{ marginTop: 10 }}>
            <PillButton
              title="Thêm vào Google Calendar"
              variant="glass"
              leftSlot={<GoogleCalendarLogo size={20} />}
              onPress={handleAddGoogleCalendar}
            />
          </RevealView>

          {/* Diễn biến */}
          <RevealView index={4}>
            <SectionHeader
              title="Diễn biến"
              style={{ marginTop: 24, marginBottom: 12 }}
            />
            <View style={styles.timelineList}>
              {timeline.map((ev) => (
                <View key={ev.id} style={styles.timelineRow}>
                  <View style={{ marginTop: 2 }}>
                    <StatusGlyph
                      type={ev.glyph}
                      size={18}
                      color={ev.dimmed ? colors.fg3 : colors.fg}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.evTitle}>{ev.title}</Text>
                    <Text style={styles.evSub}>{ev.subtitle}</Text>
                  </View>
                  <Text style={styles.evTime}>{ev.time}</Text>
                </View>
              ))}
            </View>
          </RevealView>

          <View style={{ flex: 1, minHeight: 28 }} />

          {/* Đổi giờ / Hủy lịch (tắt nếu trong vòng 24h) */}
          <RevealView index={5} style={styles.bottomActions}>
            <View style={{ flex: 1, opacity: within24Hours ? 0.35 : 1 }}>
              <PillButton
                title="Đổi giờ"
                variant="glass"
                disabled={within24Hours}
                onPress={onOpenReschedule}
              />
            </View>
            <View style={{ flex: 1, opacity: within24Hours ? 0.35 : 1 }}>
              <PillButton
                title="Hủy lịch"
                variant="quiet"
                disabled={within24Hours}
                onPress={onCancelBooking}
              />
            </View>
          </RevealView>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  appHead: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lecHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  avatarLg: {
    width: 64,
    height: 64,
    backgroundColor: colors.s3,
  },
  lightBtn: {
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  lightBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: 15.5,
    letterSpacing: ls(15.5, -0.03),
    color: '#000000',
  },
  timelineList: {
    gap: 14,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  evTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    letterSpacing: ls(14, -0.02),
    color: colors.fg,
  },
  evSub: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.fg3,
    marginTop: 1,
  },
  evTime: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    color: colors.fg3,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
});