import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useIsFocused,
  useNavigation,
  useNavigationState,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';

import type { AppNotification } from '../../../api/domainTypes';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../../../api/hooks/notifications';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { BlurTarget, Skeleton, useTabBarSpace } from '../../../components/motion';
import { Seg, type SegOption } from '../../../components/Seg';
import { TopNav } from '../../../components/TopNav';
import { resolveTarget } from '../../../navigation/roleConfig';
import { colors, fonts, ls, space } from '../../../theme';
import { useAppSession } from '../../../navigation/devSession';
import { formatNotificationRelativeTime } from '../notificationTime';

const FILTER_OPTIONS: SegOption[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unread', label: 'Chưa đọc' },
];

export function NotificationsScreen() {
  const navigation = useNavigation();
  const { role } = useAppSession();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const isTabRoot = useNavigationState(s => s.type === 'tab');

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // TODO(MO-20): Listen to Firestore users/{uid}/notifications for realtime updates
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useNotifications({
    unreadOnly: filter === 'unread' ? true : undefined,
  });

  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();

  const notifications = useMemo(
    () => data?.pages.flatMap(p => p.content) ?? [],
    [data],
  );

  const handleNotificationPress = useCallback(
    (item: AppNotification) => {
      if (!item.read) {
        markReadMutation.mutate(item.id);
      }

      const hasWaitlistTarget =
        (item as { waitlistEntryId?: string }).waitlistEntryId ||
        item.type.startsWith('WAITLIST');

      if (item.bookingId && resolveTarget(role, 'BookingDetail')) {
        (navigation.navigate as (name: string, params?: object) => void)(
          'BookingDetail',
          { bookingId: item.bookingId },
        );
      } else if (hasWaitlistTarget && resolveTarget(role, 'Waitlist')) {
        (navigation.navigate as (name: string, params?: object) => void)(
          'Waitlist',
        );
      }
    },
    [markReadMutation, navigation, role],
  );

  const renderItem = useCallback(
    ({ item }: { item: AppNotification }) => {
      const isUnread = !item.read;

      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.title}, ${isUnread ? 'chưa đọc' : 'đã đọc'}`}
          onPress={() => handleNotificationPress(item)}
          style={({ pressed }) => [
            styles.notificationRow,
            pressed && styles.notificationRowPressed,
          ]}
        >
          <Avatar
            id={item.bookingId ?? item.id}
            size={44}
            shape="round"
            style={styles.avatar}
          />
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.title,
                isUnread ? styles.titleUnread : styles.titleRead,
              ]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            {item.body ? (
              <Text
                style={[
                  styles.body,
                  isUnread ? styles.bodyUnread : styles.bodyRead,
                ]}
                numberOfLines={2}
              >
                {item.body}
              </Text>
            ) : null}
          </View>
          <Text style={styles.timeText}>
            {formatNotificationRelativeTime(item.createdAt)}
          </Text>
        </Pressable>
      );
    },
    [handleNotificationPress],
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.skeletonContainer}>
          {[0, 1, 2, 3, 4, 5].map(idx => (
            <View key={idx} style={styles.skeletonRow}>
              <Skeleton width={44} height={44} borderRadius={22} />
              <View style={styles.skeletonTextCol}>
                <Skeleton width="80%" height={14} borderRadius={4} />
                <Skeleton width="55%" height={12} borderRadius={4} />
              </View>
              <Skeleton width={36} height={12} borderRadius={4} />
            </View>
          ))}
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Không thể tải thông báo</Text>
          <Button
            variant="ghost"
            title="Thử lại"
            onPress={() => refetch()}
            style={styles.retryButton}
          />
        </View>
      );
    }

    return (
      <FlashList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              {filter === 'unread'
                ? 'Không có thông báo chưa đọc'
                : 'Chưa có thông báo nào'}
            </Text>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={colors.fg2} size="small" />
            </View>
          ) : null
        }
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: isTabRoot ? tabSpace : insets.bottom + space.xl,
          },
        ]}
      />
    );
  };

  const body = (
    <View style={styles.root}>
      <TopNav
        title="Thông báo"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đọc tất cả"
            disabled={markAllMutation.isPending}
            onPress={() => markAllMutation.mutate()}
            style={({ pressed }) => [
              styles.readAllButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.readAllText}>Đọc tất cả</Text>
          </Pressable>
        }
      />

      <View style={styles.filterContainer}>
        <Seg
          options={FILTER_OPTIONS}
          value={filter}
          onChange={val => setFilter(val as 'all' | 'unread')}
        />
      </View>

      <View style={styles.content}>{renderContent()}</View>
    </View>
  );

  return (
    <View style={styles.root}>
      {isTabRoot ? (
        <BlurTarget active={focused} style={styles.root}>
          {body}
        </BlurTarget>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
  },
  filterContainer: {
    paddingHorizontal: space.gutter,
    paddingBottom: space.md,
  },
  listContent: {
    paddingHorizontal: space.gutter,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    gap: space.md,
  },
  notificationRowPressed: {
    opacity: 0.75,
  },
  avatar: {
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: ls(14, -0.015),
  },
  titleUnread: {
    fontFamily: fonts.bold,
    color: colors.fg, // 100% white
  },
  titleRead: {
    fontFamily: fonts.medium,
    color: colors.fg2, // 62% brightness
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.medium,
    letterSpacing: ls(13, -0.01),
  },
  bodyUnread: {
    color: colors.fg2, // 62%
  },
  bodyRead: {
    color: colors.fg3, // 38%
  },
  timeText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.fg3,
    marginTop: 2,
  },
  readAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  readAllText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.fg,
  },
  pressed: {
    opacity: 0.6,
  },
  centerContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.fg2,
  },
  errorText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.err,
    marginBottom: space.sm,
  },
  retryButton: {
    alignSelf: 'center',
  },
  skeletonContainer: {
    paddingHorizontal: space.gutter,
    paddingTop: space.sm,
    gap: space.lg,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  skeletonTextCol: {
    flex: 1,
    gap: 8,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
