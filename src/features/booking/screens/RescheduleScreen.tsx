import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import type { BookableSlot } from '../../../api/domainTypes';
import {
  useBooking,
  useLecturer,
  useRescheduleBooking,
} from '../../../api/hooks';
import { formatVnDayTime } from '../../../api/time';
import { AppText, Button, StatusPill } from '../../../components';
import { Skeleton } from '../../../components/motion';
import type {
  ScreenParams,
  StudentStackParamList,
} from '../../../navigation/types';
import { colors, fonts } from '../../../theme';
import {
  SheetFrame,
  SlotPicker,
  dayTimeShort,
  rescheduleErrorUi,
  weekOffsetBetween,
  type ActionErrorUi,
} from '../slots';

type Nav = NativeStackNavigationProp<StudentStackParamList>;
type Route = RouteProp<{ Reschedule: ScreenParams['Reschedule'] }, 'Reschedule'>;

/** Screen 15: pick another slot of the same lecturer for an existing booking. */
export function RescheduleScreen() {
  const navigation = useNavigation<Nav>();
  const { bookingId } = useRoute<Route>().params;
  const booking = useBooking(bookingId);
  const lecturer = useLecturer(booking.data?.lecturerId);
  const reschedule = useRescheduleBooking();

  const [picked, setPicked] = useState<BookableSlot | null>(null);
  const [error, setError] = useState<ActionErrorUi | null>(null);

  const b = booking.data;
  const canReschedule = !b || b.status === 'PENDING' || b.status === 'CONFIRMED';

  const submit = () => {
    if (!picked) {
      return;
    }
    setError(null);
    reschedule.mutate(
      { id: bookingId, newSlotId: picked.id },
      {
        onSuccess: next => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
            () => {},
          );
          navigation.replace('BookingDetail', { bookingId: next.id });
        },
        onError: e => setError(rescheduleErrorUi(e)),
      },
    );
  };

  let body: React.ReactElement;
  if (booking.isPending) {
    body = (
      <View style={styles.skeleton}>
        <Skeleton width={200} height={26} />
        <Skeleton height={60} borderRadius={18} />
        <Skeleton height={100} borderRadius={20} />
      </View>
    );
  } else if (booking.isError || !b) {
    body = (
      <View>
        <AppText variant="t2">Không tải được lịch hẹn</AppText>
        <Button
          title="Thử lại"
          onPress={() => booking.refetch()}
          style={styles.cta}
        />
      </View>
    );
  } else if (!canReschedule) {
    body = (
      <View>
        <AppText variant="t2">Không đổi giờ được</AppText>
        <AppText variant="sm" style={styles.sub}>
          Lịch hẹn này không còn ở trạng thái cho phép đổi giờ.
        </AppText>
        <Button
          title="Quay lại"
          onPress={() => navigation.goBack()}
          style={styles.cta}
        />
      </View>
    );
  } else {
    body = (
      <>
        <AppText variant="t2">Đổi sang giờ khác</AppText>
        <AppText variant="sm" style={styles.sub}>
          Cùng giảng viên. Giờ mới cần được duyệt lại.
        </AppText>

        <View style={styles.picker}>
          <SlotPicker
            lecturerId={b.lecturerId}
            initialWeekOffset={weekOffsetBetween(Date.now(), b.startAt)}
            selectedSlotId={picked?.id}
            currentSlotId={b.slotId}
            fullSelectable={false}
            onSelect={(slot, state) => {
              if (state === 'available') {
                setPicked(slot);
                setError(null);
              }
            }}
          />
        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            Giờ hiện tại{' '}
            <Text style={styles.noteStrong}>{formatVnDayTime(b.startAt)}</Text>{' '}
            sẽ bị hủy ngay khi bạn đổi. Lịch mới ở trạng thái chờ giảng viên
            duyệt.
          </Text>
          <StatusPill status="PENDING" label="Chờ duyệt" style={styles.pill} />
        </View>

        {error ? (
          <View style={styles.errBlock}>
            <Text style={styles.errTitle}>{error.title}</Text>
            <Text style={styles.err}>{error.message}</Text>
            {error.kind === 'alreadyRequested' && error.bookingId ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() =>
                  navigation.replace('BookingDetail', {
                    bookingId: error.bookingId as string,
                  })
                }
              >
                <Text style={styles.link}>Xem lịch hẹn của bạn</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Button
          title={picked ? `Đổi sang ${dayTimeShort(picked.startAt)}` : 'Chọn giờ mới'}
          disabled={!picked}
          loading={reschedule.isPending}
          onPress={submit}
          style={styles.cta}
        />
      </>
    );
  }

  return (
    <SheetFrame
      lecturerId={b?.lecturerId ?? bookingId}
      photoUrl={lecturer.data?.photoUrl}
      onBack={() => navigation.goBack()}
    >
      {body}
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  skeleton: { gap: 16 },
  sub: { marginTop: 4 },
  picker: { marginTop: 16 },
  note: {
    marginTop: 16,
    padding: 14,
    gap: 10,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.medium,
    color: colors.fg2,
  },
  noteStrong: { fontFamily: fonts.bold, color: colors.fg },
  pill: {},
  cta: { marginTop: 16 },
  errBlock: { marginTop: 12, gap: 4 },
  errTitle: { fontSize: 14, fontFamily: fonts.bold, color: colors.err },
  err: {
    fontSize: 13.5,
    lineHeight: 19,
    fontFamily: fonts.medium,
    color: colors.err,
  },
  link: { marginTop: 6, fontSize: 14, fontFamily: fonts.bold, color: colors.fg },
});
