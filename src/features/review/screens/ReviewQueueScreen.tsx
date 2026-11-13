import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import {
  AppText,
  Avatar,
  Button,
  Card,
  Screen,
  Seg,
} from '../../../components';
import { useTabBarSpace } from '../../../components/motion';
import {
  useDeclineBooking,
  useConfirmBooking,
  useLecturerSlotWaitlist,
} from '../../../api/hooks';
import type { Booking, SlotWaitlist } from '../../../api/domainTypes';
import { formatVnDayTime } from '../../../api/time';
import { colors, space } from '../../../theme';
import {
  bookingErrorMessage,
  TextPromptSheet,
  useBookingTabList,
} from '../../booking/detail';
import { queueEntryLabel } from '../reviewLogic';

type Tab = 'pending' | 'queue';

export function ReviewQueueScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const tabSpace = useTabBarSpace();
  const [tab, setTab] = useState<Tab>('pending');
  // Optimistic removal: ids hidden immediately, restored if the call fails.
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [declining, setDeclining] = useState<Booking | null>(null);

  const pendingQ = useBookingTabList('pending');
  const queueQ = useLecturerSlotWaitlist();
  const confirm = useConfirmBooking();
  const decline = useDeclineBooking();

  const hide = (id: string, on: boolean) =>
    setHidden(prev => {
      const next = new Set(prev);
      if (on) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });

  const onError = (id: string) => (e: unknown) => {
    hide(id, false);
    Alert.alert('Không thực hiện được', bookingErrorMessage(e));
    // 409s mean the list is stale (useConfirmBooking already refetches on error; decline
    // does not), so refetch here for both.
    pendingQ.refetch();
  };

  const approve = (b: Booking) => {
    hide(b.id, true);
    confirm.mutate(b.id, { onError: onError(b.id) });
  };

  const items = pendingQ.items.filter(b => !hidden.has(b.id));
  const total =
    pendingQ.total === undefined
      ? undefined
      : Math.max(
          0,
          pendingQ.total - (pendingQ.items.length - items.length),
        );
  const queueCount = queueQ.data?.reduce((n, s) => n + s.entries.length, 0);

  const open = (b: Booking) =>
    (navigation.navigate as (n: string, p: object) => void)('BookingDetail', {
      bookingId: b.id,
    });

  return (
    <Screen>
      <AppText variant="t1" style={styles.title}>
        Duyệt
      </AppText>
      <Seg
        options={[
          {
            value: 'pending',
            label: total != null ? `Chờ duyệt · ${total}` : 'Chờ duyệt',
          },
          {
            value: 'queue',
            label:
              queueCount != null ? `Hàng đợi · ${queueCount}` : 'Hàng đợi',
          },
        ]}
        value={tab}
        onChange={v => setTab(v as Tab)}
        style={styles.seg}
      />

      {tab === 'pending' ? (
        pendingQ.isLoading ? (
          <ActivityIndicator style={styles.loading} />
        ) : pendingQ.isError ? (
          <View style={styles.loading}>
            <AppText center>Không tải được danh sách chờ duyệt.</AppText>
            <Button variant="ghost" title="Thử lại" onPress={() => pendingQ.refetch()} />
          </View>
        ) : (
          <FlashList
            data={items}
            keyExtractor={b => b.id}
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => open(item)}
                  style={styles.head}
                >
                  <Avatar id={item.studentId} size={48} shape="squircle" />
                  <View style={styles.headText}>
                    <AppText variant="t3" numberOfLines={1}>
                      {item.studentName}
                    </AppText>
                    <AppText variant="xs">
                      {formatVnDayTime(item.startAt)}
                    </AppText>
                  </View>
                </Pressable>
                {item.topic ? (
                  <AppText variant="sm" color={colors.fg} style={styles.topic}>
                    {`"${item.topic}"`}
                  </AppText>
                ) : null}
                <View style={styles.actions}>
                  <Button
                    variant="ghost"
                    title="Từ chối"
                    style={styles.grow}
                    onPress={() => setDeclining(item)}
                  />
                  <Button
                    title="Duyệt"
                    style={styles.grow}
                    onPress={() => approve(item)}
                  />
                </View>
              </Card>
            )}
            onEndReached={() => {
              pendingQ.fetchNextPage();
            }}
            onEndReachedThreshold={0.5}
            refreshing={pendingQ.isRefetching && !pendingQ.isFetchingNextPage}
            onRefresh={() => pendingQ.refetch()}
            ListEmptyComponent={
              <AppText center style={styles.empty}>
                Không có yêu cầu nào đang chờ duyệt.
              </AppText>
            }
            contentContainerStyle={{ paddingBottom: tabSpace + space.lg }}
          />
        )
      ) : queueQ.isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : queueQ.isError ? (
        <View style={styles.loading}>
          <AppText center>Không tải được hàng đợi.</AppText>
          <Button variant="ghost" title="Thử lại" onPress={() => queueQ.refetch()} />
        </View>
      ) : (
        <FlashList<SlotWaitlist>
          data={queueQ.data ?? []}
          keyExtractor={s => s.slotId}
          renderItem={({ item }) => (
            <View style={styles.group}>
              <AppText variant="t3">{item.slotLabel}</AppText>
              {item.entries.map(e => (
                <AppText key={e.id} variant="sm">
                  {queueEntryLabel(e)}
                </AppText>
              ))}
            </View>
          )}
          refreshing={queueQ.isRefetching}
          onRefresh={() => queueQ.refetch()}
          ListEmptyComponent={
            <AppText center style={styles.empty}>
              Chưa có sinh viên nào trong hàng đợi.
            </AppText>
          }
          contentContainerStyle={{ paddingBottom: tabSpace + space.lg }}
        />
      )}

      <TextPromptSheet
        visible={declining !== null}
        title="Từ chối yêu cầu"
        label="Lý do (không bắt buộc)"
        multiline
        confirmLabel="Từ chối"
        onClose={() => setDeclining(null)}
        onConfirm={reason => {
          const b = declining;
          setDeclining(null);
          if (!b) {
            return;
          }
          hide(b.id, true);
          decline.mutate(
            { id: b.id, reason: reason || undefined },
            { onError: onError(b.id) },
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: space.md, marginBottom: space.md },
  seg: { marginBottom: space.md },
  loading: { marginTop: space.xxxl, alignItems: 'center', gap: 8 },
  empty: { marginTop: space.xxxl },
  card: { padding: 14, marginBottom: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  headText: { flex: 1, minWidth: 0, gap: 2 },
  topic: { marginTop: space.md },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: 14 },
  grow: { flex: 1 },
  group: {
    backgroundColor: colors.s1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    gap: 4,
  },
});
