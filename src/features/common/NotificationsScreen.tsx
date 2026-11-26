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
  AppRole,
  NavPill,
  SubLabel,
} from '../../components/AppPrimitives';
import { RevealView } from '../../components/AuthPrimitives';
import {
  colors,
  fontFamily,
  ls,
  radius,
  typography,
} from '../../theme/tokens';

export interface NotificationItem {
  id: string;
  section: 'TODAY' | 'THIS_WEEK';
  actorName: string;
  actorAvatarUrl: string;
  message: string;
  timeAgo: string;
  read: boolean;
  actionLabel?: string; // VD: "Xem slot"
  bookingId?: string;
  waitlistEntryId?: string;
}

interface NotificationsScreenProps {
  role?: AppRole;
  initialItems?: NotificationItem[];
  onPressNotification?: (item: NotificationItem) => void;
  onPressAction?: (item: NotificationItem) => void;
  onReadAll?: () => void;
  onSelectTab?: (tab: string) => void;
}

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    section: 'TODAY',
    actorName: 'TS. Nguyễn Minh Khoa',
    actorAvatarUrl: 'https://i.pravatar.cc/120?img=11',
    message: 'đã xác nhận buổi hẹn Thứ Tư 18/11 lúc 14:00.',
    timeAgo: '5 ph',
    read: false,
    bookingId: 'bk-1',
  },
  {
    id: 'n2',
    section: 'TODAY',
    actorName: 'TS. Trần Thu Hà',
    actorAvatarUrl: 'https://i.pravatar.cc/120?img=47',
    message: 'có slot trống Thứ Năm 09:30. Slot được giữ cho bạn tới 10:15.',
    timeAgo: '40 ph',
    read: false,
    actionLabel: 'Xem slot',
    waitlistEntryId: 'wl-1',
  },
  {
    id: 'n3',
    section: 'THIS_WEEK',
    actorName: 'ThS. Lê Hoàng',
    actorAvatarUrl: 'https://i.pravatar.cc/120?img=12',
    message: 'đã từ chối yêu cầu Thứ Hai: trùng lịch họp khoa.',
    timeAgo: 'T2',
    read: true,
    bookingId: 'bk-2',
  },
  {
    id: 'n4',
    section: 'THIS_WEEK',
    actorName: 'ThS. Phạm Anh Thư',
    actorAvatarUrl: 'https://i.pravatar.cc/120?img=32',
    message: 'đã gửi tóm tắt buổi hẹn.',
    timeAgo: 'CN',
    read: true,
    bookingId: 'bk-3',
  },
];

export function NotificationsScreen({
  role = 'sv',
  initialItems = SAMPLE_NOTIFICATIONS,
  onPressNotification,
  onPressAction,
  onReadAll,
  onSelectTab,
}: NotificationsScreenProps) {
  const [items, setItems] = useState(initialItems);

  const handleReadAll = () => {
    setItems((prev) => prev.map((it) => ({ ...it, read: true })));
    onReadAll?.();
  };

  const todayItems = items.filter((i) => i.section === 'TODAY');
  const weekItems = items.filter((i) => i.section === 'THIS_WEEK');

  const renderGroup = (list: NotificationItem[]) =>
    list.map((item, idx) => (
      <React.Fragment key={item.id}>
        {idx > 0 && <View style={styles.rowDivider} />}
        <Pressable
          onPress={() => onPressNotification?.(item)}
          style={({ pressed }) => [
            styles.notiRow,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Image
            source={{ uri: item.actorAvatarUrl }}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bodyText, item.read && { color: colors.fg2 }]}>
              <Text style={styles.actorBold}>{item.actorName}</Text>{' '}
              {item.message}
            </Text>
            {item.actionLabel && (
              <Pressable
                onPress={() => onPressAction?.(item)}
                style={styles.lightActionBtn}
              >
                <Text style={styles.lightActionText}>{item.actionLabel}</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.timeText}>{item.timeAgo}</Text>
        </Pressable>
      </React.Fragment>
    ));

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.appHead}>
            <RevealView index={0}>
              <Text style={styles.pageTitle}>Thông báo</Text>
            </RevealView>
            <Pressable onPress={handleReadAll} hitSlop={8}>
              <Text style={[typography.sm, styles.readAllLink]}>Đọc hết</Text>
            </Pressable>
          </View>

          {todayItems.length > 0 && (
            <RevealView index={1}>
              <SubLabel style={{ marginTop: 12 }}>Hôm nay</SubLabel>
              {renderGroup(todayItems)}
            </RevealView>
          )}

          {weekItems.length > 0 && (
            <RevealView index={2}>
              <SubLabel>Tuần này</SubLabel>
              {renderGroup(weekItems)}
            </RevealView>
          )}
        </ScrollView>
      </SafeAreaView>

      <NavPill role={role} activeTab="home" onSelectTab={onSelectTab} />
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
  readAllLink: {
    fontFamily: fontFamily.bold,
    color: colors.fg,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.line,
  },
  notiRow: {
    minHeight: 66,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.s3,
  },
  bodyText: {
    fontFamily: fontFamily.medium,
    fontSize: 13.5,
    lineHeight: 19.2,
    letterSpacing: ls(13.5, -0.015),
    color: colors.fg,
  },
  actorBold: {
    fontFamily: fontFamily.bold,
    color: colors.fg,
  },
  timeText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.fg3,
    paddingTop: 2,
  },
  lightActionBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  lightActionText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: '#000000',
  },
});