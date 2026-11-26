import React, { useMemo, useState } from 'react';
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
  AppRole,
  NavPill,
  SubLabel,
} from '../../components/AppPrimitives';
import { RevealView, StatusPill } from '../../components/AuthPrimitives';
import { Glass } from '../../components/Glass';
import { Pressable3D } from '../../components/Pressable3D';
import {
  colors,
  fontFamily,
  ls,
  radius,
  squircle,
  typography,
} from '../../theme/tokens';

export type BookingListTab = 'UPCOMING' | 'PENDING' | 'PAST';

export interface BookingRowItem {
  id: string;
  dateGroup: string; // VD: "Thứ Tư 18/11"
  personName: string;
  personAvatarUrl: string;
  subtitle: string; // VD: "14:00 · 306.B11 · Đề cương đồ án"
  status: 'CONFIRMED' | 'PENDING' | 'COMPLETED';
  tab: BookingListTab;
}

const SAMPLE_BOOKINGS: BookingRowItem[] = [
  {
    id: 'bk-1',
    dateGroup: 'Thứ Tư 18/11',
    personName: 'TS. Nguyễn Minh Khoa',
    personAvatarUrl: 'https://i.pravatar.cc/120?img=11',
    subtitle: '14:00 · 306.B11 · Đề cương đồ án',
    status: 'CONFIRMED',
    tab: 'UPCOMING',
  },
  {
    id: 'bk-2',
    dateGroup: 'Thứ Năm 19/11',
    personName: 'TS. Nguyễn Minh Khoa',
    personAvatarUrl: 'https://i.pravatar.cc/120?img=11',
    subtitle: '09:40 · 306.B11 · Thiết kế CSDL',
    status: 'PENDING',
    tab: 'UPCOMING',
  },
  {
    id: 'bk-3',
    dateGroup: 'Thứ Năm 19/11',
    personName: 'ThS. Phạm Anh Thư',
    personAvatarUrl: 'https://i.pravatar.cc/120?img=32',
    subtitle: '15:00 · Google Meet · IELTS Writing',
    status: 'CONFIRMED',
    tab: 'UPCOMING',
  },
  {
    id: 'bk-4',
    dateGroup: 'Thứ Hai 23/11',
    personName: 'TS. Trần Thu Hà',
    personAvatarUrl: 'https://i.pravatar.cc/120?img=47',
    subtitle: '10:00 · B4.110 · Kinh tế vi mô',
    status: 'CONFIRMED',
    tab: 'UPCOMING',
  },
];

interface BookingListScreenProps {
  role?: AppRole;
  bookings?: BookingRowItem[];
  waitlistCount?: number;
  onPressWaitlist?: () => void;
  onPressBooking?: (item: BookingRowItem) => void;
  onSelectTab?: (tab: string) => void;
}

export function BookingListScreen({
  role = 'sv',
  bookings = SAMPLE_BOOKINGS,
  waitlistCount = 2,
  onPressWaitlist,
  onPressBooking,
  onSelectTab,
}: BookingListScreenProps) {
  const [activeTab, setActiveTab] = useState<BookingListTab>('UPCOMING');

  const pendingCount = useMemo(
    () => bookings.filter((b) => b.status === 'PENDING').length,
    [bookings],
  );

  const visibleList = useMemo(() => {
    if (activeTab === 'PENDING') {
      return bookings.filter((b) => b.status === 'PENDING');
    }
    return bookings.filter((b) => b.tab === activeTab);
  }, [bookings, activeTab]);

  // Nhóm theo dateGroup giữ nguyên thứ tự
  const grouped = useMemo(() => {
    const map = new Map<string, BookingRowItem[]>();
    for (const item of visibleList) {
      const arr = map.get(item.dateGroup) ?? [];
      arr.push(item);
      map.set(item.dateGroup, arr);
    }
    return Array.from(map.entries());
  }, [visibleList]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* AppHead */}
          <View style={styles.appHead}>
            <RevealView index={0}>
              <Text style={styles.pageTitle}>Lịch hẹn</Text>
            </RevealView>

            {role === 'sv' && (
              <Pressable3D onPress={onPressWaitlist}>
                <Glass borderRadius={radius.pill} style={styles.waitlistBtn}>
                  <Text style={styles.waitlistText}>
                    Hàng đợi · {waitlistCount}
                  </Text>
                </Glass>
              </Pressable3D>
            )}
          </View>

          {/* Segmented 3 tab */}
          <RevealView index={1} style={styles.seg3}>
            <Pressable
              onPress={() => setActiveTab('UPCOMING')}
              style={[
                styles.segTab,
                activeTab === 'UPCOMING' && styles.segTabOn,
              ]}
            >
              <Text
                style={[
                  styles.segText,
                  activeTab === 'UPCOMING' && styles.segTextOn,
                ]}
              >
                Sắp tới
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('PENDING')}
              style={[
                styles.segTab,
                activeTab === 'PENDING' && styles.segTabOn,
              ]}
            >
              <Text
                style={[
                  styles.segText,
                  activeTab === 'PENDING' && styles.segTextOn,
                ]}
              >
                Chờ duyệt{' '}
                {pendingCount > 0 && (
                  <Text style={{ color: colors.fg3 }}>{pendingCount}</Text>
                )}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('PAST')}
              style={[styles.segTab, activeTab === 'PAST' && styles.segTabOn]}
            >
              <Text
                style={[
                  styles.segText,
                  activeTab === 'PAST' && styles.segTextOn,
                ]}
              >
                Đã qua
              </Text>
            </Pressable>
          </RevealView>

          {/* Danh sách nhóm theo ngày */}
          {grouped.map(([dateLabel, items], gIdx) => (
            <RevealView key={dateLabel} index={gIdx + 2}>
              <SubLabel>{dateLabel}</SubLabel>
              {items.map((item, idx) => (
                <React.Fragment key={item.id}>
                  {idx > 0 && <View style={styles.rowDivider} />}
                  <Pressable
                    onPress={() => onPressBooking?.(item)}
                    style={({ pressed }) => [
                      styles.row,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Image
                      source={{ uri: item.personAvatarUrl }}
                      style={[styles.rowAvatar, squircle(14)]}
                      contentFit="cover"
                    />
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={styles.rowName}>
                        {item.personName}
                      </Text>
                      <Text numberOfLines={1} style={styles.rowSub}>
                        {item.subtitle}
                      </Text>
                    </View>
                    {item.status === 'CONFIRMED' ? (
                      <StatusPill glyph="ok" label="Xác nhận" tone="done" />
                    ) : item.status === 'PENDING' ? (
                      <StatusPill glyph="wait" label="Chờ" tone="soft" />
                    ) : (
                      <StatusPill glyph="done" label="Xong" tone="soft" />
                    )}
                  </Pressable>
                </React.Fragment>
              ))}
            </RevealView>
          ))}
        </ScrollView>
      </SafeAreaView>

      <NavPill role={role} activeTab="book" onSelectTab={onSelectTab} />
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
  pageTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    letterSpacing: ls(28, -0.055),
    color: colors.fg,
  },
  waitlistBtn: {
    height: 42,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitlistText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    letterSpacing: ls(14, -0.03),
    color: colors.fg,
  },
  seg3: {
    marginTop: 8,
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
  row: {
    minHeight: 66,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowAvatar: {
    width: 48,
    height: 48,
    backgroundColor: colors.s3,
  },
  rowName: {
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