import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BookableSlot } from '../../../api/domainTypes';
import { useJoinWaitlist, useLecturer } from '../../../api/hooks';
import { formatVnDayTime } from '../../../api/time';
import { Button, IconButton } from '../../../components';
import { Reveal, Skeleton } from '../../../components/motion';
import type {
  ScreenParams,
  StudentStackParamList,
} from '../../../navigation/types';
import { colors, fonts, ls, space } from '../../../theme';
import {
  COVER_HEIGHT,
  LecturerCover,
  SlotPicker,
  officeRoomText,
  roomLabel,
  waitlistJoinErrorOutcome,
  type SlotState,
} from '../../booking/slots';

type Nav = NativeStackNavigationProp<StudentStackParamList>;
type Route = RouteProp<{ LecturerDetail: ScreenParams['LecturerDetail'] }, 'LecturerDetail'>;

/** Screen 11: cover header, office room, week strip and slot grid of one lecturer. */
export function LecturerDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { lecturerId } = useRoute<Route>().params;
  const qc = useQueryClient();
  const lecturer = useLecturer(lecturerId);
  const join = useJoinWaitlist();

  const [fullSlot, setFullSlot] = useState<BookableSlot | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [joinError, setJoinError] = useState<string | null>(null);

  const data = lecturer.data;
  const room = data?.officeRoom ?? null;
  const label = roomLabel(room);

  const onSelect = (slot: BookableSlot, state: SlotState) => {
    setJoinError(null);
    if (state === 'available') {
      setSelectedId(slot.id);
      setFullSlot(null);
      navigation.navigate('BookSlot', { lecturerId, slotId: slot.id });
    } else if (state === 'full') {
      setSelectedId(slot.id);
      setFullSlot(slot);
    }
  };

  const joinWaitlist = () => {
    if (!fullSlot) {
      return;
    }
    setJoinError(null);
    join.mutate(fullSlot.id, {
      onSuccess: () => navigation.navigate('Waitlist'),
      onError: e => {
        const out = waitlistJoinErrorOutcome(e);
        if (out.kind === 'alreadyJoined') {
          navigation.navigate('Waitlist');
          return;
        }
        if (out.kind === 'notNeeded') {
          qc.invalidateQueries({ queryKey: ['lecturers', 'slots'] });
          setFullSlot(null);
          setSelectedId(undefined);
        }
        setJoinError(out.message);
      },
    });
  };

  const openMap = () => {
    // TODO(F-campus): CampusMap takes { roomId } and is a tab, so go through Tabs.
    (navigation.navigate as (n: string, p: unknown) => void)('Tabs', {
      screen: 'Map',
      params: room ? { roomId: room.id } : undefined,
    });
  };

  return (
    <View style={styles.root}>
      <LecturerCover id={lecturerId} photoUrl={data?.photoUrl} />
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.nav}>
          <IconButton
            icon={ChevronLeft}
            accessibilityLabel="Quay lại"
            onPress={() => navigation.goBack()}
            style={styles.navBtn}
          />
        </View>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ height: COVER_HEIGHT * 0.45 }} />
          {lecturer.isPending ? (
            <View style={styles.skeleton}>
              <Skeleton width={180} height={14} />
              <Skeleton width={260} height={40} borderRadius={12} />
              <Skeleton width={140} height={14} />
            </View>
          ) : lecturer.isError || !data ? (
            <View style={styles.error}>
              <Text style={styles.note}>Không tải được thông tin giảng viên.</Text>
              <Button
                variant="ghost"
                title="Thử lại"
                onPress={() => lecturer.refetch()}
              />
            </View>
          ) : (
            <>
              <Reveal id={`lecturer-head-${data.id}`}>
                <Text style={styles.eyebrow}>
                  {[data.department, label].filter(Boolean).join(' · ')}
                </Text>
                <Text style={styles.name}>{data.name}</Text>
                <View style={styles.roomRow}>
                  <Text style={styles.room}>{officeRoomText(room)}</Text>
                  {room ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={openMap}
                      hitSlop={8}
                    >
                      <Text style={styles.link}>Xem trên bản đồ</Text>
                    </Pressable>
                  ) : null}
                </View>
                {data.blurb ? <Text style={styles.blurb}>{data.blurb}</Text> : null}
              </Reveal>

              <View style={styles.picker}>
                <SlotPicker
                  lecturerId={lecturerId}
                  selectedSlotId={selectedId}
                  onSelect={onSelect}
                />
              </View>

              {fullSlot ? (
                <View style={styles.waitCard}>
                  <Text style={styles.waitTitle}>
                    {formatVnDayTime(fullSlot.startAt)}
                  </Text>
                  <Text style={styles.note}>
                    Slot này đã có người. Vào hàng đợi để được mời ngay khi slot
                    trống.
                  </Text>
                  {joinError ? <Text style={styles.err}>{joinError}</Text> : null}
                  <Button
                    title="Vào hàng đợi"
                    loading={join.isPending}
                    onPress={joinWaitlist}
                  />
                </View>
              ) : joinError ? (
                <Text style={styles.err}>{joinError}</Text>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  nav: { paddingHorizontal: space.gutter, height: 52, justifyContent: 'center' },
  navBtn: { backgroundColor: 'rgba(0,0,0,0.38)' },
  content: { paddingHorizontal: space.gutter, paddingBottom: 48 },
  skeleton: { gap: 12 },
  error: { alignItems: 'center', gap: 8, paddingTop: 40 },
  eyebrow: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    letterSpacing: ls(12, -0.01),
    color: colors.fg2,
  },
  name: {
    marginTop: 8,
    fontSize: 38,
    lineHeight: 40,
    fontFamily: fonts.bold,
    letterSpacing: ls(38, -0.04),
    color: colors.fg,
  },
  roomRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  room: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    letterSpacing: ls(14, -0.012),
    color: colors.fg2,
  },
  link: {
    fontSize: 14,
    fontFamily: fonts.bold,
    letterSpacing: ls(14, -0.02),
    color: colors.fg,
  },
  blurb: {
    marginTop: 10,
    fontSize: 14.5,
    lineHeight: 21,
    fontFamily: fonts.medium,
    letterSpacing: ls(14.5, -0.012),
    color: colors.fg2,
  },
  picker: { marginTop: 24 },
  waitCard: {
    marginTop: 20,
    padding: 16,
    gap: 10,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
  },
  waitTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    letterSpacing: ls(16, -0.03),
    color: colors.fg,
  },
  note: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.medium,
    letterSpacing: ls(14, -0.012),
    color: colors.fg2,
  },
  err: {
    fontSize: 13.5,
    fontFamily: fonts.medium,
    color: colors.err,
  },
});
