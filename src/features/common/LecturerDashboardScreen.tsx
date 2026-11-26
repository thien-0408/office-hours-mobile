import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  NavPill,
  NowCard,
  SectionHeader,
  StatRow,
} from '../../components/AppPrimitives';
import { RevealView, StatusPill } from '../../components/AuthPrimitives';
import { GlowBackground } from '../../components/GlowBackground';
import { OhLogo } from '../../components/Icons';
import {
  colors,
  fontFamily,
  ls,
  radius,
  typography,
} from '../../theme/tokens';

export type PresenceStatus = 'AVAILABLE' | 'BUSY' | 'AWAY';

export interface TodayBookingRow {
  id: string;
  studentName: string;
  studentAvatarUrl: string;
  subtitle: string; // VD: "13:00 · Hỏi về điểm giữa kỳ"
  status: 'COMPLETED' | 'CONFIRMED';
  badgeLabel: string; // VD: "Xong" hoặc "14:00"
}

interface LecturerDashboardScreenProps {
  lecturerAvatarUrl?: string;
  initialPresence?: PresenceStatus;
  onChangePresence?: (status: PresenceStatus) => void;
  stats?: { pending: number; todayTotal: number; completed: number };
  todayBookings?: TodayBookingRow[];
  upcomingWithin60Min?: {
    bookingId: string;
    studentName: string;
    studentAvatarUrl: string;
    subtitle: string; // VD: "Bắt đầu sau 12 phút · 306.B11"
  } | null;
  onPressSeeAllBookings?: () => void;
  onPressBookingRow?: (bookingId: string) => void;
  onPressNowChat?: (bookingId: string) => void;
  onSelectTab?: (tab: string) => void;
}

const DEFAULT_TODAY: TodayBookingRow[] = [
  {
    id: 'b1',
    studentName: 'Trần Quang Minh',
    studentAvatarUrl: 'https://i.pravatar.cc/120?img=15',
    subtitle: '13:00 · Hỏi về điểm giữa kỳ',
    status: 'COMPLETED',
    badgeLabel: 'Xong',
  },
  {
    id: 'b2',
    studentName: 'Phạm Ngọc Mai',
    studentAvatarUrl: 'https://i.pravatar.cc/120?img=25',
    subtitle: '14:00 · Đề cương đồ án',
    status: 'CONFIRMED',
    badgeLabel: '14:00',
  },
  {
    id: 'b3',
    studentName: 'Lê Khánh Linh',
    studentAvatarUrl: 'https://i.pravatar.cc/120?img=29',
    subtitle: '14:20 · Thực tập doanh nghiệp',
    status: 'CONFIRMED',
    badgeLabel: '14:20',
  },
];

export function LecturerDashboardScreen({
  lecturerAvatarUrl = 'https://i.pravatar.cc/120?img=11',
  initialPresence = 'AVAILABLE',
  onChangePresence,
  stats = { pending: 4, todayTotal: 6, completed: 2 },
  todayBookings = DEFAULT_TODAY,
  upcomingWithin60Min = {
    bookingId: 'b2',
    studentName: 'Phạm Ngọc Mai',
    studentAvatarUrl: 'https://i.pravatar.cc/120?img=25',
    subtitle: 'Bắt đầu sau 12 phút · 306.B11',
  },
  onPressSeeAllBookings,
  onPressBookingRow,
  onPressNowChat,
  onSelectTab,
}: LecturerDashboardScreenProps) {
  const [presence, setPresence] = useState<PresenceStatus>(initialPresence);

  const handlePresence = (next: PresenceStatus) => {
    setPresence(next);
    onChangePresence?.(next);
  };

  return (
    <View style={styles.root}>
      <GlowBackground tone="teal" position="tr" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            upcomingWithin60Min && { paddingBottom: 185 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* AppHead */}
          <View style={styles.appHead}>
            <OhLogo size={30} color={colors.fg} />
            <Image
              source={{ uri: lecturerAvatarUrl }}
              style={styles.topAvatar}
              contentFit="cover"
            />
          </View>

          <RevealView index={0}>
            <Text style={[typography.h1, { marginTop: 8 }]}>
              {'Chiều nay\ncủa bạn'}
            </Text>
          </RevealView>

          {/* Segmented 3 trạng thái: Có mặt / Đang bận / Vắng */}
          <RevealView index={1} style={styles.seg3}>
            {(
              [
                ['AVAILABLE', 'Có mặt'],
                ['BUSY', 'Đang bận'],
                ['AWAY', 'Vắng'],
              ] as [PresenceStatus, string][]
            ).map(([key, label]) => {
              const isOn = presence === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => handlePresence(key)}
                  style={[styles.segTab, isOn && styles.segTabOn]}
                >
                  <Text
                    style={[styles.segText, isOn && styles.segTextOn]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </RevealView>

          <RevealView index={2}>
            <StatRow
              style={{ marginTop: 20 }}
              items={[
                { value: stats.pending, label: 'chờ duyệt' },
                { value: stats.todayTotal, label: 'buổi hôm nay' },
                { value: stats.completed, label: 'đã xong' },
              ]}
            />
          </RevealView>

          <RevealView index={3}>
            <SectionHeader
              title="Hôm nay"
              showChevron
              onPress={onPressSeeAllBookings}
            />
          </RevealView>

          <RevealView index={4}>
            {todayBookings.map((item, idx) => (
              <React.Fragment key={item.id}>
                {idx > 0 && <View style={styles.rowDivider} />}
                <Pressable
                  onPress={() => onPressBookingRow?.(item.id)}
                  style={({ pressed }) => [
                    styles.bookingRow,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Image
                    source={{ uri: item.studentAvatarUrl }}
                    style={styles.rowAvatar}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={styles.rowTitle}>
                      {item.studentName}
                    </Text>
                    <Text numberOfLines={1} style={styles.rowSub}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <StatusPill
                    glyph={item.status === 'COMPLETED' ? 'done' : 'ok'}
                    label={item.badgeLabel}
                    tone={item.status === 'COMPLETED' ? 'soft' : 'done'}
                  />
                </Pressable>
              </React.Fragment>
            ))}
          </RevealView>
        </ScrollView>
      </SafeAreaView>

      {/* Thẻ buổi hẹn sắp tới nổi trên thanh nav */}
      {upcomingWithin60Min && (
        <NowCard
          avatarUrl={upcomingWithin60Min.studentAvatarUrl}
          name={upcomingWithin60Min.studentName}
          subtitle={upcomingWithin60Min.subtitle}
          onPressChat={() =>
            onPressNowChat?.(upcomingWithin60Min.bookingId)
          }
        />
      )}

      <NavPill
        role="gv"
        activeTab="home"
        badges={{ review: stats.pending }}
        onSelectTab={onSelectTab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 120,
  },
  appHead: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.s3,
  },
  seg3: {
    marginTop: 16,
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  segTab: {
    flex: 1,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segTabOn: {
    backgroundColor: colors.glassHi,
    borderWidth: 1,
    borderColor: colors.glassLine,
  },
  segText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13.5,
    color: colors.fg3,
  },
  segTextOn: {
    color: colors.fg,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.line,
  },
  bookingRow: {
    minHeight: 66,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.s3,
  },
  rowTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    letterSpacing: ls(15, -0.03),
    color: colors.fg,
  },
  rowSub: {
    ...typography.sm,
    fontSize: 12.5,
    marginTop: 2,
  },
});