import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import type { BookableSlot } from '../../../api/domainTypes';
import {
  useCreateBooking,
  useJoinWaitlist,
  useLecturer,
  useLecturerSlots,
} from '../../../api/hooks';
import { formatVnDayTime } from '../../../api/time';
import {
  AppText,
  Avatar,
  Button,
  Field,
  StatusPill,
} from '../../../components';
import { Skeleton } from '../../../components/motion';
import type {
  ScreenParams,
  StudentStackParamList,
} from '../../../navigation/types';
import { colors, fonts, ls, size } from '../../../theme';
import {
  SheetFrame,
  SlotGrid,
  TOPIC_MAX_LENGTH,
  bookingErrorUi,
  dateBlock,
  dayKey,
  groupSlotsByDay,
  roomLabel,
  slotState,
  useSlot,
  validateTopic,
  waitlistJoinErrorOutcome,
  weekInfo,
  type ActionErrorUi,
} from '../slots';

type Nav = NativeStackNavigationProp<StudentStackParamList>;
type Route = RouteProp<{ BookSlot: ScreenParams['BookSlot'] }, 'BookSlot'>;

/** Screen 12 (+12b): confirm a slot and send the booking request. */
export function BookSlotScreen() {
  const navigation = useNavigation<Nav>();
  const { lecturerId, slotId } = useRoute<Route>().params;
  const lecturer = useLecturer(lecturerId);
  const slot = useSlot(slotId);
  const create = useCreateBooking();
  const join = useJoinWaitlist();

  const [topic, setTopic] = useState('');
  const [error, setError] = useState<ActionErrorUi | null>(null);
  const [joinMessage, setJoinMessage] = useState<string | null>(null);

  const room = lecturer.data?.officeRoom ?? null;
  const label = roomLabel(room);
  const topicError = validateTopic(topic);

  const submit = () => {
    if (!slotId || topicError) {
      return;
    }
    setError(null);
    create.mutate(
      { slotId, topic: topic.trim() },
      {
        onSuccess: booking => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
            () => {},
          );
          // replace: back from the booking goes to the lecturer, not to this sheet
          navigation.replace('BookingDetail', { bookingId: booking.id });
        },
        onError: e => setError(bookingErrorUi(e)),
      },
    );
  };

  const joinWaitlist = () => {
    if (!slotId) {
      return;
    }
    setJoinMessage(null);
    join.mutate(slotId, {
      onSuccess: () => navigation.replace('Waitlist'),
      onError: e => {
        const out = waitlistJoinErrorOutcome(e);
        if (out.kind === 'alreadyJoined') {
          navigation.replace('Waitlist');
          return;
        }
        setJoinMessage(out.message);
      },
    });
  };

  const pickOther = (s: BookableSlot) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setError(null);
    setJoinMessage(null);
    navigation.setParams({ lecturerId, slotId: s.id });
  };

  let body: React.ReactElement;
  if (!slotId) {
    body = (
      <Notice
        title="Chưa chọn giờ"
        message="Hãy chọn một slot trên trang giảng viên."
        action="Chọn giờ"
        onAction={() => navigation.goBack()}
      />
    );
  } else if (slot.isPending) {
    body = (
      <View style={styles.skeleton}>
        <Skeleton width={220} height={48} borderRadius={14} />
        <Skeleton width={160} height={60} borderRadius={14} />
        <Skeleton height={96} borderRadius={18} />
      </View>
    );
  } else if (slot.isError || !slot.data) {
    body = (
      <Notice
        title="Không tải được slot"
        message="Kiểm tra mạng rồi thử lại."
        action="Thử lại"
        onAction={() => slot.refetch()}
      />
    );
  } else if (error?.kind === 'slotTaken') {
    body = (
      <SlotTakenView
        lecturerId={lecturerId}
        slotId={slotId}
        startAt={slot.data.startAt}
        error={error}
        message={joinMessage}
        joining={join.isPending}
        onJoin={joinWaitlist}
        onPick={pickOther}
        onOther={() => navigation.goBack()}
      />
    );
  } else {
    const d = dateBlock(slot.data.startAt, slot.data.endAt);
    body = (
      <>
        <View style={styles.lecturerRow}>
          <Avatar
            uri={lecturer.data?.photoUrl}
            id={lecturerId}
            size={size.rowImage}
            shape="squircle"
          />
          <View style={styles.lecturerText}>
            <Text style={styles.lecturerName} numberOfLines={1}>
              {lecturer.data?.name ?? ' '}
            </Text>
            <Text style={styles.lecturerSub} numberOfLines={1}>
              {label ? `Trực tiếp tại ${label}` : 'Trực tiếp'}
            </Text>
          </View>
        </View>

        <View style={styles.dateBlk}>
          <Text style={styles.dateNum}>{d.day}</Text>
          <View>
            <Text style={styles.dateCaption}>{d.caption}</Text>
            <Text style={styles.dateRange}>{d.range}</Text>
          </View>
        </View>

        <Field
          label="Bạn muốn trao đổi gì?"
          value={topic}
          onChangeText={t => {
            setTopic(t);
            if (error) {
              setError(null);
            }
          }}
          multiline
          maxLength={TOPIC_MAX_LENGTH}
          textAlignVertical="top"
          autoFocus={false}
          containerStyle={styles.field}
          inputContainerStyle={styles.fieldBox}
          style={styles.fieldInput}
          hint={`${topic.trim().length}/${TOPIC_MAX_LENGTH}`}
        />

        {error ? <ErrorBlock error={error} onOpen={id => navigation.replace('BookingDetail', { bookingId: id })} /> : null}

        <Text style={styles.hint}>
          Giảng viên duyệt xong bạn sẽ nhận thông báo. Có thể hủy trước 24 giờ.
        </Text>
        <Button
          title="Gửi yêu cầu"
          loading={create.isPending}
          disabled={!!topicError}
          onPress={submit}
          style={styles.cta}
        />
      </>
    );
  }

  return (
    <SheetFrame
      lecturerId={lecturerId}
      photoUrl={lecturer.data?.photoUrl}
      onBack={() => navigation.goBack()}
    >
      {body}
    </SheetFrame>
  );
}

function Notice({
  title,
  message,
  action,
  onAction,
}: {
  title: string;
  message: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <View>
      <AppText variant="t2">{title}</AppText>
      <AppText variant="sm" style={styles.noticeMsg}>
        {message}
      </AppText>
      <Button title={action} onPress={onAction} style={styles.cta} />
    </View>
  );
}

function ErrorBlock({
  error,
  onOpen,
}: {
  error: ActionErrorUi;
  onOpen: (bookingId: string) => void;
}) {
  return (
    <View style={styles.errBlock}>
      <Text style={styles.errTitle}>{error.title}</Text>
      <Text style={styles.err}>{error.message}</Text>
      {error.kind === 'alreadyRequested' && error.bookingId ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onOpen(error.bookingId as string)}
          hitSlop={8}
        >
          <Text style={styles.link}>Xem lịch hẹn của bạn</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** 12b: the slot was taken between opening the sheet and sending. */
function SlotTakenView({
  lecturerId,
  slotId,
  startAt,
  error,
  message,
  joining,
  onJoin,
  onPick,
  onOther,
}: {
  lecturerId: string;
  slotId: string;
  startAt: string;
  error: ActionErrorUi;
  message: string | null;
  joining: boolean;
  onJoin: () => void;
  onPick: (s: BookableSlot) => void;
  onOther: () => void;
}) {
  const [now] = useState(() => Date.now());
  const week = useMemo(() => weekInfo(new Date(startAt).getTime(), 0), [startAt]);
  const slots = useLecturerSlots(lecturerId, week.week);
  const nearby = useMemo(() => {
    const key = dayKey(startAt);
    const sameDay = groupSlotsByDay(slots.data ?? [])[key] ?? [];
    return sameDay
      .filter(s => s.id !== slotId)
      .map(slot => ({ slot, state: slotState(slot, { now }) }))
      .filter(i => i.state === 'available');
  }, [slots.data, startAt, slotId, now]);

  return (
    <View>
      <StatusPill status="ERROR" label="Slot đã có người" style={styles.pill} />
      <AppText variant="t1">{'Có người vừa\nđặt slot này.'}</AppText>
      <AppText variant="sub" style={styles.takenSub}>
        {error.waitlistAvailable
          ? `${formatVnDayTime(startAt)}. Vào hàng đợi để được mời ngay khi slot trống, hoặc chọn giờ khác.`
          : `${formatVnDayTime(startAt)}. Slot đang được giữ cho người khác. Hãy chọn giờ khác.`}
      </AppText>
      {nearby.length > 0 ? (
        <View style={styles.nearby}>
          <SlotGrid items={nearby.slice(0, 6)} onSelect={onPick} />
        </View>
      ) : null}
      {message ? <Text style={[styles.err, styles.takenMsg]}>{message}</Text> : null}
      {error.waitlistAvailable ? (
        <Button
          title="Vào hàng đợi"
          loading={joining}
          onPress={onJoin}
          style={styles.cta}
        />
      ) : null}
      <Button
        variant="quiet"
        title="Chọn giờ khác"
        onPress={onOther}
        style={styles.quiet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: { gap: 16 },
  lecturerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lecturerText: { flex: 1, minWidth: 0, gap: 2 },
  lecturerName: {
    fontSize: 15,
    fontFamily: fonts.bold,
    letterSpacing: ls(15, -0.03),
    color: colors.fg,
  },
  lecturerSub: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.fg3,
  },
  dateBlk: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  dateNum: {
    fontSize: 60,
    lineHeight: 52,
    fontFamily: fonts.bold,
    letterSpacing: ls(60, -0.06),
    color: colors.fg,
    fontVariant: ['tabular-nums'],
  },
  dateCaption: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    letterSpacing: ls(14, -0.02),
    color: colors.fg2,
  },
  dateRange: {
    fontSize: 14,
    fontFamily: fonts.bold,
    letterSpacing: ls(14, -0.02),
    color: colors.fg,
  },
  field: { marginTop: 20 },
  fieldBox: {
    minHeight: 96,
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  fieldInput: { minHeight: 48, lineHeight: 22 },
  hint: {
    marginTop: 12,
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: fonts.medium,
    color: colors.fg3,
  },
  cta: { marginTop: 20 },
  quiet: { marginTop: 8 },
  errBlock: { marginTop: 12, gap: 4 },
  errTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.err,
  },
  err: {
    fontSize: 13.5,
    lineHeight: 19,
    fontFamily: fonts.medium,
    color: colors.err,
  },
  link: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.fg,
  },
  noticeMsg: { marginTop: 6 },
  pill: { marginBottom: 14 },
  takenSub: { marginTop: 10 },
  nearby: { marginTop: 20 },
  takenMsg: { marginTop: 12 },
});
