import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import { AppText, Button, Screen, Seg } from '../../../components';
import { useTabBarSpace } from '../../../components/motion';
import { useAppSession } from '../../../navigation/devSession';
import { colors, space } from '../../../theme';
import type { Booking } from '../../../api/domainTypes';
import {
  BOOKING_TABS,
  BookingRow,
  useBookingTabList,
  type BookingTab,
} from '../detail';

const EMPTY_TEXT: Record<BookingTab, string> = {
  upcoming: 'Chưa có lịch hẹn sắp tới.',
  pending: 'Không có yêu cầu nào đang chờ duyệt.',
  past: 'Chưa có buổi hẹn nào đã qua.',
  cancelled: 'Không có lịch hẹn nào bị hủy hoặc từ chối.',
};

export function BookingListScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { role } = useAppSession();
  const tabSpace = useTabBarSpace();
  const [tab, setTab] = useState<BookingTab>('upcoming');
  const list = useBookingTabList(tab);

  const open = (b: Booking) =>
    (navigation.navigate as (n: string, p: object) => void)('BookingDetail', {
      bookingId: b.id,
    });

  return (
    <Screen>
      <AppText variant="t1" style={styles.title}>
        Lịch hẹn
      </AppText>
      <Seg
        options={BOOKING_TABS}
        value={tab}
        onChange={v => setTab(v as BookingTab)}
        style={styles.seg}
      />
      {list.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.fg2} />
        </View>
      ) : list.isError ? (
        <View style={styles.center}>
          <AppText center>Không tải được danh sách lịch hẹn.</AppText>
          <Button variant="ghost" title="Thử lại" onPress={() => list.refetch()} />
        </View>
      ) : (
        <FlashList
          data={list.items}
          keyExtractor={b => b.id}
          renderItem={({ item, index }) => (
            <BookingRow
              booking={item}
              role={role}
              divider={index > 0}
              onPress={() => open(item)}
            />
          )}
          onEndReached={() => {
            if (list.hasNextPage) {
              list.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          refreshing={list.isRefetching}
          onRefresh={() => list.refetch()}
          ListEmptyComponent={
            <AppText center style={styles.empty}>
              {EMPTY_TEXT[tab]}
            </AppText>
          }
          ListFooterComponent={
            list.isFetchingNextPage ? (
              <ActivityIndicator color={colors.fg2} style={styles.footer} />
            ) : null
          }
          contentContainerStyle={{ paddingBottom: tabSpace + space.lg }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: space.md, marginBottom: space.md },
  seg: { marginBottom: space.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  empty: { marginTop: space.xxxl },
  footer: { paddingVertical: space.lg },
});
