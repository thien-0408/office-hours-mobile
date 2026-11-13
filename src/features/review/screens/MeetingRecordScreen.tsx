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
  Field,
  Screen,
  SectionHeader,
  Seg,
  TopNav,
} from '../../../components';
import { Glow } from '../../../components/motion';
import { useBooking, useUpdateMeetingRecord } from '../../../api/hooks';
import { formatVnDayTime, formatVnTime } from '../../../api/time';
import type { ScreenParams } from '../../../navigation/types';
import { colors, space } from '../../../theme';
import { bookingErrorMessage } from '../../booking/detail';
import { meetingRecordPayload } from '../reviewLogic';

const ATTENDANCE = [
  { value: 'yes', label: 'Có mặt' },
  { value: 'no', label: 'Vắng mặt' },
];

export function MeetingRecordScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { params } = useRoute<RouteProp<ScreenParams, 'MeetingRecord'>>();
  const bookingQ = useBooking(params.bookingId);
  const save = useUpdateMeetingRecord();
  const booking = bookingQ.data;

  // No GET endpoint for an existing record, so the form starts from the booking status.
  const [attended, setAttended] = useState<boolean | null>(null);
  const [notes, setNotes] = useState('');
  const isAttended = attended ?? booking?.status !== 'NO_SHOW';

  const onSave = () =>
    save.mutate(
      {
        id: params.bookingId,
        record: meetingRecordPayload(isAttended, notes),
      },
      {
        onSuccess: () => navigation.goBack(),
        onError: e => Alert.alert('Không lưu được', bookingErrorMessage(e)),
      },
    );

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Glow tone="teal" position="tr" />
      <TopNav onBack={navigation.goBack} title="Biên bản" />
      {bookingQ.isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : booking ? (
        <>
          <View style={styles.party}>
            <Avatar id={booking.studentId} size={64} shape="squircle" />
            <View style={styles.partyText}>
              <AppText variant="t2" numberOfLines={2}>
                {booking.studentName}
              </AppText>
              <AppText variant="sm">
                {`${formatVnDayTime(booking.startAt)} - ${formatVnTime(
                  booking.endAt,
                )}`}
              </AppText>
            </View>
          </View>

          <Seg
            options={ATTENDANCE}
            value={isAttended ? 'yes' : 'no'}
            onChange={v => setAttended(v === 'yes')}
            style={styles.seg}
          />
          <Field
            label="Ghi chú"
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
            inputContainerStyle={styles.notes}
            containerStyle={styles.noteWrap}
          />

          <SectionHeader title="Tóm tắt tự động" style={styles.section} />
          {/* TODO(MO-28): call @react-native-firebase/ai, show the draft, and only copy it into
              the notes when the lecturer taps "Dùng bản tóm tắt". Disabled until then. */}
          <Button
            variant="quiet"
            title="Tóm tắt tự động"
            disabled
            style={styles.auto}
          />
          <AppText variant="xs" style={styles.hint}>
            Sẽ có ở phiên bản sau.
          </AppText>
          <Button
            title="Lưu biên bản"
            onPress={onSave}
            loading={save.isPending}
            style={styles.saveBtn}
          />
        </>
      ) : (
        <AppText center style={styles.loading}>
          {bookingErrorMessage(bookingQ.error)}
        </AppText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  saveBtn: { marginTop: space.xxl },
  loading: { marginTop: space.xxxl },
  party: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.sm },
  partyText: { flex: 1, minWidth: 0, gap: 2 },
  seg: { marginTop: space.xl },
  noteWrap: { marginTop: space.md },
  notes: { minHeight: 140, alignItems: 'flex-start' },
  section: { marginTop: space.xxl, marginBottom: space.sm },
  auto: { alignSelf: 'flex-start', paddingHorizontal: 0 },
  hint: { color: colors.fg3 },
});
