import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
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

import type { MyWaitlistEntry } from '../../../api/domainTypes';
import { ERR } from '../../../api/errorCodes';
import { ApiError } from '../../../api/errors';
import {
  useAcceptWaitlistOffer,
  useDeclineWaitlistOffer,
  useLeaveWaitlist,
  useMyWaitlist,
} from '../../../api/hooks/waitlist';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { BlurTarget, Glow, Odometer, Skeleton, useTabBarSpace } from '../../../components/motion';
import { SectionHeader } from '../../../components/SectionHeader';
import { StatusPill } from '../../../components/StatusPill';
import { TopNav } from '../../../components/TopNav';
import { colors, fonts, ls, radius, space, text } from '../../../theme';
import { getCountdownState, waitlistStatusLabel } from '../countdown';

export function WaitlistScreen() {
  const navigation = useNavigation();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const isTabRoot = useNavigationState(s => s.type === 'tab');

  // TODO(MO-22): Listen to Firestore users/{uid}/waitlist for realtime position and offers
  const {
    data: entries,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useMyWaitlist();

  const acceptMutation = useAcceptWaitlistOffer();
  const declineMutation = useDeclineWaitlistOffer();
  const leaveMutation = useLeaveWaitlist();

  const offeredEntry = useMemo(
    () => entries?.find(e => e.status === 'OFFERED'),
    [entries],
  );

  const waitingEntries = useMemo(
    () => entries?.filter(e => e.id !== offeredEntry?.id) ?? [],
    [entries, offeredEntry],
  );

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!offeredEntry) {
      return;
    }
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [offeredEntry]);

  const offerExpiresAt =
    offeredEntry?.offeredExpiresAt ??
    (offeredEntry as { offerExpiresAt?: string })?.offerExpiresAt;

  const { secondsRemaining, isExpired } = getCountdownState(
    offerExpiresAt,
    now,
  );

  const handleAcceptOffer = useCallback(
    (entry: MyWaitlistEntry) => {
      acceptMutation.mutate(entry.id, {
        onSuccess: () => {
          Alert.alert('Thành công', 'Bạn đã nhận lịch hẹn thành công!');
        },
        onError: (err: unknown) => {
          if (err instanceof ApiError) {
            if (err.is(409, ERR.WAITLIST_OFFER_EXPIRED)) {
              Alert.alert('Hết hạn', 'Slot đã hết thời gian giữ cho bạn.');
              return;
            }
            if (err.is(422, ERR.BOOKING_STUDENT_CONFLICT)) {
              Alert.alert(
                'Trùng lịch',
                'Bạn có lịch học hoặc lịch hẹn khác trùng với khung giờ này.',
              );
              return;
            }
            if (err.is(409, ERR.WAITLIST_TRANSITION_NOT_ALLOWED)) {
              Alert.alert('Không thể nhận', 'Trạng thái hàng đợi đã thay đổi.');
              return;
            }
          }
          Alert.alert('Lỗi', 'Không thể nhận lịch hẹn. Vui lòng thử lại.');
        },
      });
    },
    [acceptMutation],
  );

  const handleDeclineOffer = useCallback(
    (entry: MyWaitlistEntry) => {
      Alert.alert(
        'Bỏ qua slot',
        'Bạn có chắc muốn bỏ qua cơ hội nhận slot này?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Bỏ qua',
            style: 'destructive',
            onPress: () => {
              declineMutation.mutate(entry.id, {
                onError: () => {
                  Alert.alert('Lỗi', 'Không thể bỏ qua slot. Vui lòng thử lại.');
                },
              });
            },
          },
        ],
      );
    },
    [declineMutation],
  );

  const handleLeaveWaitlist = useCallback(
    (entry: MyWaitlistEntry) => {
      Alert.alert(
        'Rời hàng đợi',
        `Bạn có chắc muốn rời hàng đợi của giảng viên ${entry.lecturerName}?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Rời hàng',
            style: 'destructive',
            onPress: () => {
              leaveMutation.mutate(entry.id, {
                onError: (err: unknown) => {
                  if (
                    err instanceof ApiError &&
                    err.is(404, ERR.WAITLIST_ENTRY_NOT_FOUND)
                  ) {
                    Alert.alert('Thông báo', 'Lượt chờ không còn tồn tại.');
                    return;
                  }
                  Alert.alert('Lỗi', 'Không thể rời hàng đợi. Vui lòng thử lại.');
                },
              });
            },
          },
        ],
      );
    },
    [leaveMutation],
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.skeletonContainer}>
          <Skeleton height={200} borderRadius={radius.card} />
          <Skeleton width="40%" height={20} borderRadius={4} />
          <Skeleton height={64} borderRadius={radius.sm} />
          <Skeleton height={64} borderRadius={radius.sm} />
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Không thể tải danh sách hàng đợi</Text>
          <Button variant="ghost" title="Thử lại" onPress={() => refetch()} />
        </View>
      );
    }

    if (!entries || entries.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Bạn chưa tham gia hàng đợi nào</Text>
        </View>
      );
    }

    const isActionsDisabled =
      isExpired || acceptMutation.isPending || declineMutation.isPending;

    return (
      <View style={styles.contentBody}>
        {offeredEntry ? (
          <View style={styles.offeredSection}>
            <Card style={styles.offeredCard}>
              <View style={styles.offerHeader}>
                <StatusPill status="OFFERED" label="Có slot cho bạn" />
                <View style={styles.odometerWrapper}>
                  <Odometer value={secondsRemaining} format="mm:ss" />
                </View>
              </View>

              <View style={styles.lecturerRow}>
                <Avatar
                  id={offeredEntry.slotId}
                  size={52}
                  shape="round"
                />
                <View style={styles.lecturerInfo}>
                  <Text style={styles.lecturerName} numberOfLines={1}>
                    {offeredEntry.lecturerName}
                  </Text>
                  <Text style={styles.slotLabel} numberOfLines={2}>
                    {offeredEntry.desiredSlotLabel}
                    {offeredEntry.department
                      ? ` · ${offeredEntry.department}`
                      : ''}
                  </Text>
                </View>
              </View>

              <Text style={styles.countdownCaption}>
                {isExpired
                  ? 'Slot đã hết thời gian giữ'
                  : 'Slot được giữ cho bạn trong thời gian trên.'}
              </Text>

              <View style={styles.offerActions}>
                <Button
                  variant="primary"
                  title="Nhận lịch"
                  disabled={isActionsDisabled}
                  loading={acceptMutation.isPending}
                  onPress={() => handleAcceptOffer(offeredEntry)}
                  style={styles.offerButton}
                />
                <Button
                  variant="ghost"
                  title="Bỏ qua"
                  disabled={isActionsDisabled}
                  loading={declineMutation.isPending}
                  onPress={() => handleDeclineOffer(offeredEntry)}
                  style={styles.offerButton}
                />
              </View>
            </Card>
          </View>
        ) : null}

        {waitingEntries.length > 0 ? (
          <View style={styles.waitingSection}>
            <SectionHeader title="Đang chờ" style={styles.sectionHeader} />
            <View style={styles.rowsContainer}>
              {waitingEntries.map(entry => (
                <View key={entry.id} style={styles.waitRow}>
                  <Avatar
                    id={entry.slotId}
                    size={44}
                    shape="round"
                    style={styles.waitAvatar}
                  />
                  <View style={styles.waitInfo}>
                    <Text style={styles.waitName} numberOfLines={1}>
                      {entry.lecturerName}
                    </Text>
                    <Text style={styles.waitSlot} numberOfLines={1}>
                      {entry.desiredSlotLabel}
                    </Text>
                  </View>

                  <View style={styles.waitMeta}>
                    {entry.status === 'WAITING' && entry.position != null ? (
                      <Text style={styles.positionText}>#{entry.position}</Text>
                    ) : null}

                    <StatusPill
                      status={entry.status}
                      label={waitlistStatusLabel(entry.status)}
                    />

                    {entry.status === 'WAITING' ? (
                      <Button
                        variant="quiet"
                        title="Rời hàng"
                        disabled={leaveMutation.isPending}
                        onPress={() => handleLeaveWaitlist(entry)}
                        style={styles.leaveButton}
                        textStyle={styles.leaveButtonText}
                      />
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  const body = (
    <View style={styles.root}>
      <Glow tone="brand" position="c" />
      <TopNav
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: isTabRoot ? tabSpace : insets.bottom + space.xl,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
            }}
            tintColor={colors.fg2}
          />
        }
      >
        <Text style={text.t1}>Hàng đợi</Text>
        {renderContent()}
      </ScrollView>
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
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: space.gutter,
    paddingTop: space.sm,
  },
  contentBody: {
    marginTop: space.lg,
    gap: space.xxl,
  },
  offeredSection: {
    marginBottom: space.sm,
  },
  offeredCard: {
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line2,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.md,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  odometerWrapper: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.s2,
  },
  lecturerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginVertical: space.xs,
  },
  lecturerInfo: {
    flex: 1,
    gap: 2,
  },
  lecturerName: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.fg,
    letterSpacing: ls(18, -0.03),
  },
  slotLabel: {
    fontSize: 13.5,
    fontFamily: fonts.medium,
    color: colors.fg2,
    letterSpacing: ls(13.5, -0.01),
  },
  countdownCaption: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    color: colors.fg3,
    letterSpacing: ls(12.5, -0.01),
  },
  offerActions: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.xs,
  },
  offerButton: {
    flex: 1,
  },
  waitingSection: {
    gap: space.sm,
  },
  sectionHeader: {
    marginTop: 0,
    marginBottom: space.sm,
  },
  rowsContainer: {
    gap: space.sm,
  },
  waitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
    gap: space.md,
  },
  waitAvatar: {
    marginRight: 2,
  },
  waitInfo: {
    flex: 1,
    gap: 3,
  },
  waitName: {
    fontSize: 14.5,
    fontFamily: fonts.bold,
    color: colors.fg,
    letterSpacing: ls(14.5, -0.02),
  },
  waitSlot: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.fg2,
  },
  waitMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  positionText: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.fg,
    letterSpacing: ls(17, -0.03),
  },
  leaveButton: {
    height: 28,
    paddingHorizontal: 8,
  },
  leaveButtonText: {
    fontSize: 12,
    color: colors.err,
  },
  centerContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
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
  },
  skeletonContainer: {
    paddingTop: space.lg,
    gap: space.lg,
  },
});
