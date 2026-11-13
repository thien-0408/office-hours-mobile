import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type ParamListBase,
  type RouteProp,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import {
  AppText,
  Avatar,
  Button,
  Icon,
  IconButton,
  Screen,
  TopNav,
} from '../../../components';
import { useBooking, useCompleteBooking, useMarkNoShow } from '../../../api/hooks/bookings';
import { useLecturer } from '../../../api/hooks/lecturers';
import { formatVnDayTime, formatVnTime } from '../../../api/time';
import { useAppSession } from '../../../navigation/devSession';
import { useSession } from '../../auth/session/SessionProvider';
import type { ScreenParams } from '../../../navigation/types';
import { bookingErrorMessage, otherParty, useNow } from '../../booking/detail';
import { colors, fonts, space } from '../../../theme';
import {
  buildListItems,
  closedNotice,
  isRoomClosed,
  showActionBar,
  type ListItem,
} from '../logic';
import { useChatRoom } from '../useChatRoom';

const MAX_LEN = 2000;

export function ChatScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { params } = useRoute<RouteProp<ScreenParams, 'Chat'>>();
  const { role } = useAppSession();
  const { user } = useSession();
  const selfId = user?.id ?? null;
  const now = useNow(15_000);
  const insets = useSafeAreaInsets();

  const bookingQ = useBooking(params.bookingId);
  const booking = bookingQ.data;
  const who = booking ? otherParty(booking, role) : null;
  const lecturerQ = useLecturer(
    booking && role !== 'LECTURER' ? booking.lecturerId : undefined,
  );

  const complete = useCompleteBooking();
  const noShow = useMarkNoShow();

  // Closed by status is known only once the booking loaded; a frame closes it at once.
  const [text, setText] = useState('');
  const room = useChatRoom(
    params.bookingId,
    selfId,
    booking?.status === 'CONFIRMED',
  );
  const closed = isRoomClosed(booking?.status, room.closedFrame);
  const canType = !closed && !!booking;

  const [kbOpen, setKbOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKbOpen(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKbOpen(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const items = useMemo(
    () => buildListItems(room.messages, selfId, now),
    [room.messages, selfId, now],
  );

  const actionBar = showActionBar({
    role,
    status: booking?.status,
    startAt: booking?.startAt,
    now,
    closedFrame: room.closedFrame,
  });

  const act = (kind: 'complete' | 'noShow') => {
    if (!booking) {
      return;
    }
    const isDone = kind === 'complete';
    Alert.alert(
      isDone ? 'Đánh dấu đã gặp?' : 'Đánh dấu vắng mặt?',
      isDone
        ? 'Buổi hẹn sẽ chuyển sang hoàn thành và phòng chat đóng lại.'
        : 'Sinh viên sẽ bị ghi nhận vắng mặt và phòng chat đóng lại.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: isDone ? 'Đã gặp' : 'Vắng mặt',
          style: isDone ? 'default' : 'destructive',
          onPress: () =>
            (isDone ? complete : noShow).mutate(booking.id, {
              onError: e => Alert.alert('Không thực hiện được', bookingErrorMessage(e)),
            }),
        },
      ],
    );
  };

  const submit = () => {
    const body = text.trim();
    if (!body || !canType) {
      return;
    }
    room.stopTyping();
    room.send(body);
    setText('');
  };

  const header = (
    <View style={styles.header}>
      <TopNav onBack={navigation.goBack} title={undefined} style={styles.nav} />
      <View style={styles.who}>
        {who ? (
          <Avatar
            id={who.id}
            size={38}
            uri={role === 'LECTURER' ? null : lecturerQ.data?.photoUrl}
          />
        ) : null}
        <View style={styles.whoText}>
          <AppText variant="t3" numberOfLines={1}>
            {who?.name ?? ' '}
          </AppText>
          {booking ? (
            <AppText variant="xs" numberOfLines={1}>
              {booking.topic
                ? `${formatVnTime(booking.startAt)} · ${booking.topic}`
                : formatVnDayTime(booking.startAt)}
            </AppText>
          ) : null}
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.kind === 'day') {
      return (
        <AppText variant="sm" center style={styles.sys}>
          {item.label}
        </AppText>
      );
    }
    if (item.kind === 'system') {
      return (
        <AppText variant="sm" center style={styles.sys}>
          {item.text}
        </AppText>
      );
    }
    const m = item.message;
    const failed = m.status === 'failed';
    return (
      <View style={item.mine ? styles.rowMine : styles.rowThem}>
        <Pressable
          disabled={!failed}
          onPress={() => m.clientMessageId && room.retry(m.clientMessageId)}
          accessibilityRole={failed ? 'button' : undefined}
          accessibilityLabel={failed ? 'Gửi lại tin nhắn' : undefined}
          style={[
            styles.bub,
            item.mine ? styles.bubMine : styles.bubThem,
            m.status === 'pending' && styles.pending,
          ]}
        >
          <AppText
            variant="sub"
            color={item.mine ? colors.onPrimary : colors.fg}
            style={styles.bubText}
          >
            {m.body}
          </AppText>
        </Pressable>
        {item.meta ? (
          <AppText
            variant="xs"
            color={failed ? colors.err : undefined}
            style={[styles.meta, item.mine && styles.metaMine]}
          >
            {failed ? `${item.meta} Chạm để gửi lại.` : item.meta}
          </AppText>
        ) : null}
      </View>
    );
  };

  const body = (() => {
    if (room.loading && room.messages.length === 0) {
      return <ActivityIndicator style={styles.center} />;
    }
    if (room.loadError && room.messages.length === 0) {
      return (
        <View style={styles.center}>
          <AppText center>Không tải được tin nhắn.</AppText>
          <Button variant="ghost" title="Thử lại" onPress={room.reload} />
        </View>
      );
    }
    return (
      <FlashList
        data={items}
        renderItem={renderItem}
        keyExtractor={i => i.key}
        getItemType={i => i.kind}
        inverted
        keyboardShouldPersistTaps="handled"
        onEndReached={room.loadOlder}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          room.otherTyping ? (
            <View style={styles.typing}>
              <AppText variant="sm">đang nhập…</AppText>
            </View>
          ) : null
        }
        ListFooterComponent={
          room.loadingOlder ? <ActivityIndicator style={styles.older} /> : null
        }
        ListEmptyComponent={
          <AppText variant="sm" center style={styles.sys}>
            Chưa có tin nhắn nào.
          </AppText>
        }
      />
    );
  })();

  return (
    <Screen edges={['top']} contentContainerStyle={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {header}
        {actionBar ? (
          <View style={styles.actbar}>
            <AppText variant="sm" color={colors.fg} style={styles.flex}>
              Đã tới giờ hẹn
            </AppText>
            <Button
              variant="ghost"
              title="Vắng mặt"
              style={styles.actBtn}
              disabled={complete.isPending || noShow.isPending}
              onPress={() => act('noShow')}
            />
            <Button
              title="Đã gặp"
              style={styles.actBtn}
              loading={complete.isPending}
              disabled={noShow.isPending}
              onPress={() => act('complete')}
            />
          </View>
        ) : null}
        {!room.connected && !room.loading ? (
          <AppText variant="xs" center style={styles.offline}>
            Đang kết nối lại…
          </AppText>
        ) : null}
        <View style={styles.flex}>{body}</View>
        {closed && booking ? (
          <View
            style={[styles.closed, { paddingBottom: Math.max(insets.bottom, space.md) }]}
          >
            <AppText variant="sm" center>
              {closedNotice(booking.status)}
            </AppText>
          </View>
        ) : (
          <View
            style={[
              styles.composer,
              { paddingBottom: kbOpen ? space.sm : Math.max(insets.bottom, space.md) },
            ]}
          >
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={t => {
                setText(t);
                if (t) {
                  room.notifyTyping();
                } else {
                  room.stopTyping();
                }
              }}
              onBlur={room.stopTyping}
              placeholder={who ? `Nhắn cho ${who.name}…` : 'Nhắn tin…'}
              placeholderTextColor={colors.fg3}
              multiline
              maxLength={MAX_LEN}
              editable={canType}
              accessibilityLabel="Nội dung tin nhắn"
            />
            <IconButton
              accessibilityLabel="Gửi"
              size={50}
              disabled={!text.trim() || !canType}
              onPress={submit}
              style={styles.send}
            >
              <Icon as={Send} size={20} level="active" color={colors.onPrimary} />
            </IconButton>
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { paddingHorizontal: 0 },
  header: { paddingHorizontal: space.gutter },
  nav: { position: 'absolute', left: 0, top: 0, zIndex: 1 },
  who: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 48,
  },
  whoText: { flex: 1 },
  actbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: space.md,
    marginBottom: space.sm,
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: 22,
    backgroundColor: 'rgba(19,19,19,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  actBtn: { height: 38, paddingHorizontal: 14 },
  offline: { paddingVertical: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: space.gutter, paddingVertical: space.md },
  older: { paddingVertical: space.md },
  sys: { marginVertical: 8 },
  rowMine: { alignItems: 'flex-end', marginTop: 5 },
  rowThem: { alignItems: 'flex-start', marginTop: 5 },
  bub: {
    maxWidth: '80%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  bubMine: { backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  bubThem: { backgroundColor: colors.s2, borderBottomLeftRadius: 6 },
  pending: { opacity: 0.6 },
  bubText: { fontFamily: fonts.medium },
  meta: { marginTop: 1, marginHorizontal: 6 },
  metaMine: { textAlign: 'right' },
  typing: {
    alignSelf: 'flex-start',
    marginTop: 5,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.s2,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: space.sm,
  },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 120,
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: colors.s2,
    color: colors.fg,
    fontSize: 15,
    fontFamily: fonts.medium,
  },
  send: { backgroundColor: colors.fg, borderColor: colors.fg },
  closed: { paddingHorizontal: space.gutter, paddingTop: space.md },
});
