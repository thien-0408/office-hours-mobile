import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type ParamListBase,
  type RouteProp,
} from '@react-navigation/native';
import {
  AppText,
  Avatar,
  Button,
  Screen,
  SectionHeader,
  StatusPill,
  TopNav,
} from '../../../components';
import { Glow } from '../../../components/motion';
import { useAppSession } from '../../../navigation/devSession';
import type { ScreenParams } from '../../../navigation/types';
import {
  useBooking,
  useBookingTimeline,
  useCancelBooking,
  useConfirmBooking,
  useDeclineBooking,
  useUpdateBookingMeetingUrl,
} from '../../../api/hooks/bookings';
import { useLecturer } from '../../../api/hooks/lecturers';
import { space } from '../../../theme';
import {
  AddToCalendarButton,
  bookingActions,
  bookingErrorMessage,
  DateBlock,
  isValidMeetingUrl,
  MeetingLinkButton,
  otherParty,
  STATUS_LABEL,
  TextPromptSheet,
  Timeline,
  useNow,
} from '../detail';

type Sheet = 'decline' | 'link' | null;

export function BookingDetailScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { params } = useRoute<RouteProp<ScreenParams, 'BookingDetail'>>();
  const { role } = useAppSession();
  const now = useNow();
  const [sheet, setSheet] = useState<Sheet>(null);

  const bookingQ = useBooking(params.bookingId);
  const timelineQ = useBookingTimeline(params.bookingId);
  const booking = bookingQ.data;
  const lecturerQ = useLecturer(booking?.lecturerId);

  const cancel = useCancelBooking();
  const confirm = useConfirmBooking();
  const decline = useDeclineBooking();
  const setLink = useUpdateBookingMeetingUrl();

  const go = (name: string, p?: object) =>
    (navigation.navigate as (n: string, p?: object) => void)(name, p);
  const fail = (e: unknown) => Alert.alert('Không thực hiện được', bookingErrorMessage(e));

  if (bookingQ.isLoading) {
    return (
      <Screen>
        <TopNav onBack={navigation.goBack} />
        <ActivityIndicator style={styles.loading} />
      </Screen>
    );
  }
  if (!booking) {
    return (
      <Screen>
        <TopNav onBack={navigation.goBack} />
        <AppText center style={styles.loading}>
          {bookingErrorMessage(bookingQ.error)}
        </AppText>
        <Button variant="ghost" title="Thử lại" onPress={() => bookingQ.refetch()} />
      </Screen>
    );
  }

  const who = otherParty(booking, role);
  const act = bookingActions(booking, role, now);
  const room = lecturerQ.data?.officeRoom;
  const where = booking.meetingUrl
    ? 'online'
    : room
    ? `Phòng ${room.code ?? `${room.name} · ${room.buildingCode}`}`
    : 'trực tiếp';

  const confirmCancel = () =>
    Alert.alert('Hủy lịch hẹn?', 'Yêu cầu này sẽ bị hủy.', [
      { text: 'Giữ lịch', style: 'cancel' },
      {
        text: 'Hủy lịch',
        style: 'destructive',
        onPress: () =>
          cancel.mutate(booking.id, {
            onError: e => fail(e),
          }),
      },
    ]);

  const showPrimaryRow = act.approve || act.decline;

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Glow tone="wine" position="tl" />
      <TopNav onBack={navigation.goBack} />

      <View style={styles.party}>
        <Avatar id={who.id} size={64} shape="squircle" />
        <View style={styles.partyText}>
          <AppText variant="t2" numberOfLines={2}>
            {who.name}
          </AppText>
          {booking.department ? (
            <AppText variant="sm">{booking.department}</AppText>
          ) : null}
        </View>
      </View>

      <View style={styles.block}>
        <DateBlock
          startAt={booking.startAt}
          endAt={booking.endAt}
          where={where}
        />
      </View>

      <View style={styles.statusRow}>
        <StatusPill
          status={booking.status}
          label={STATUS_LABEL[booking.status]}
        />
      </View>

      {booking.topic ? (
        <AppText variant="t3" style={styles.topic}>
          {booking.topic}
        </AppText>
      ) : null}

      <View style={styles.stack}>
        {booking.meetingUrl && booking.status === 'CONFIRMED' ? (
          <MeetingLinkButton url={booking.meetingUrl} />
        ) : null}
        {booking.status === 'CONFIRMED' || booking.status === 'PENDING' ? (
          <AddToCalendarButton booking={booking} />
        ) : null}
        {act.liveMeeting ? (
          <Button
            variant="ghost"
            title="Buổi hẹn trực tiếp"
            onPress={() => go('LiveMeeting', { bookingId: booking.id })}
          />
        ) : null}
        {act.chat ? (
          <Button
            variant="ghost"
            title="Nhắn tin"
            onPress={() => go('Chat', { bookingId: booking.id })}
          />
        ) : null}
        {act.editLink ? (
          <Button
            variant="ghost"
            title={booking.meetingUrl ? 'Sửa link họp' : 'Thêm link họp'}
            onPress={() => setSheet('link')}
          />
        ) : null}
        {act.record ? (
          <Button
            variant="ghost"
            title="Biên bản"
            onPress={() => go('MeetingRecord', { bookingId: booking.id })}
          />
        ) : null}
      </View>

      <SectionHeader title="Diễn biến" style={styles.section} />
      {timelineQ.isLoading ? (
        <ActivityIndicator />
      ) : timelineQ.data ? (
        <Timeline events={timelineQ.data} />
      ) : (
        <AppText variant="sm">Không tải được diễn biến.</AppText>
      )}

      {showPrimaryRow ? (
        <View style={styles.actions}>
          <Button
            variant="ghost"
            title="Từ chối"
            style={styles.grow}
            onPress={() => setSheet('decline')}
          />
          <Button
            title="Duyệt"
            style={styles.grow}
            loading={confirm.isPending}
            onPress={() => confirm.mutate(booking.id, { onError: fail })}
          />
        </View>
      ) : null}
      {act.cancel || act.reschedule ? (
        <View style={styles.actions}>
          {act.reschedule ? (
            <Button
              variant="ghost"
              title="Đổi giờ"
              style={styles.grow}
              onPress={() => go('Reschedule', { bookingId: booking.id })}
            />
          ) : null}
          {act.cancel ? (
            <Button
              variant="quiet"
              title="Hủy lịch"
              style={styles.grow}
              loading={cancel.isPending}
              onPress={confirmCancel}
            />
          ) : null}
        </View>
      ) : null}

      <TextPromptSheet
        visible={sheet === 'decline'}
        title="Từ chối yêu cầu"
        label="Lý do (không bắt buộc)"
        multiline
        confirmLabel="Từ chối"
        busy={decline.isPending}
        onClose={() => setSheet(null)}
        onConfirm={reason =>
          decline.mutate(
            { id: booking.id, reason: reason || undefined },
            {
              onSuccess: () => setSheet(null),
              onError: e => {
                setSheet(null);
                fail(e);
              },
            },
          )
        }
      />
      <TextPromptSheet
        visible={sheet === 'link'}
        title="Link họp"
        label="Link https"
        placeholder="https://meet.google.com/..."
        initialValue={booking.meetingUrl ?? ''}
        confirmLabel="Lưu"
        busy={setLink.isPending}
        validate={v =>
          isValidMeetingUrl(v) ? null : 'Link phải bắt đầu bằng https://'
        }
        onClose={() => setSheet(null)}
        onConfirm={url =>
          setLink.mutate(
            { id: booking.id, meetingUrl: url === '' ? null : url },
            {
              onSuccess: () => setSheet(null),
              onError: e => {
                setSheet(null);
                fail(e);
              },
            },
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: space.xxxl },
  party: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.sm,
  },
  partyText: { flex: 1, minWidth: 0, gap: 2 },
  block: { marginTop: space.xxl },
  statusRow: { marginTop: space.lg },
  topic: { marginTop: space.md },
  stack: { marginTop: space.xl, gap: 10 },
  section: { marginTop: space.xxl, marginBottom: space.md },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.xl },
  grow: { flex: 1 },
});
