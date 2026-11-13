import { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useIsFocused,
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { nextConfirmed, givenName } from '../../../api/bookingTime';
import type { Booking, SuggestedSlot } from '../../../api/domainTypes';
import { errorText } from '../../../api/errorText';
import {
  useLecturer,
  useMyWaitlist,
  useSuggestedSlots,
} from '../../../api/hooks';
import { formatVnDayTime } from '../../../api/time';
import {
  AppText,
  Avatar,
  Button,
  SectionHeader,
  StatusPill,
} from '../../../components';
import {
  BlurTarget,
  Glass,
  Glow,
  PressableCard,
  Reveal,
  Skeleton,
  useTabBarSpace,
} from '../../../components/motion';
import { colors, fonts, ls, radius, space } from '../../../theme';
import { useSession } from '../../auth/session';
import { AppHeader, StatsRow } from '../components';
import { studentGreeting, studentStats, suggestionWhen } from '../dashboardLogic';
import { useNowTick, useUpcomingConfirmed, useWeekBookings } from '../hooks';

type Nav = NavigationProp<ParamListBase>;
const go = (nav: Nav, name: string, params?: object) =>
  (nav.navigate as (n: string, p?: object) => void)(name, params);

/** Screen 5a: greeting, three odometer stats, next meeting, suggestions. */
export function StudentDashboard() {
  const navigation = useNavigation<Nav>();
  const focused = useIsFocused();
  const tabSpace = useTabBarSpace();
  const { user } = useSession();
  const now = useNowTick(30_000);

  const week = useWeekBookings();
  const waitlist = useMyWaitlist();
  const upcoming = useUpcomingConfirmed();
  const suggested = useSuggestedSlots('ALL', 6);

  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      week.refetch(),
      waitlist.refetch(),
      upcoming.refetch(),
      suggested.refetch(),
    ]);
    setRefreshing(false);
  }, [week, waitlist, upcoming, suggested]);

  const stats = studentStats(week.data ?? [], waitlist.data ?? []);
  const statsError = week.isError || waitlist.isError;
  const next = nextConfirmed(upcoming.data ?? [], now);

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <BlurTarget active={focused} style={styles.flex}>
        <Glow tone="indigo" position="tl" />
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: tabSpace + space.lg },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.fg2}
            />
          }
        >
          <AppHeader
            userId={user?.id}
            onAvatarPress={() => go(navigation, 'Me')}
          />
          <Reveal id="dash-student-greeting">
            <AppText variant="sm" style={styles.greeting}>
              {studentGreeting(givenName(user?.fullName))}
            </AppText>
            {statsError ? (
              <AppText variant="sm" color={colors.err}>
                {errorText(week.error ?? waitlist.error)}
              </AppText>
            ) : (
              <StatsRow
                items={[
                  { value: stats.bookings, label: 'lịch hẹn' },
                  { value: stats.pending, label: 'đang chờ duyệt' },
                  { value: stats.waitlist, label: 'trong hàng đợi' },
                ]}
              />
            )}
          </Reveal>

          <Reveal id="dash-student-next" index={1}>
            <SectionHeader title="Buổi hẹn tiếp theo" />
            {upcoming.isLoading ? (
              <Skeleton height={236} borderRadius={24} />
            ) : upcoming.isError ? (
              <View style={styles.msg}>
                <AppText variant="sm">{errorText(upcoming.error)}</AppText>
                <Button
                  variant="ghost"
                  title="Thử lại"
                  onPress={() => upcoming.refetch()}
                />
              </View>
            ) : next ? (
              <NextMeetingCard
                booking={next}
                onPress={() =>
                  go(navigation, 'BookingDetail', { bookingId: next.id })
                }
              />
            ) : (
              <View style={styles.msg}>
                <AppText variant="sm">Chưa có buổi hẹn nào sắp tới.</AppText>
                <Button
                  variant="ghost"
                  title="Tìm giảng viên"
                  onPress={() => go(navigation, 'Find')}
                />
              </View>
            )}
          </Reveal>

          <Reveal id="dash-student-suggest" index={2}>
            <SectionHeader
              title="Gợi ý cho bạn"
              onPress={() => go(navigation, 'Find')}
            />
            {suggested.isLoading ? (
              <View style={styles.shelfRow}>
                <Skeleton width={132} height={190} borderRadius={18} />
                <Skeleton width={132} height={190} borderRadius={18} />
              </View>
            ) : suggested.isError ? (
              <View style={styles.msg}>
                <AppText variant="sm">{errorText(suggested.error)}</AppText>
                <Button
                  variant="ghost"
                  title="Thử lại"
                  onPress={() => suggested.refetch()}
                />
              </View>
            ) : (suggested.data ?? []).length === 0 ? (
              <AppText variant="sm">
                Chưa có gợi ý phù hợp với lịch của bạn.
              </AppText>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.shelf}
                contentContainerStyle={styles.shelfRow}
              >
                {(suggested.data ?? []).map(slot => (
                  <SuggestionCard
                    key={slot.id}
                    slot={slot}
                    onPress={() =>
                      go(navigation, 'BookSlot', {
                        lecturerId: slot.lecturerId,
                        slotId: slot.id,
                      })
                    }
                  />
                ))}
              </ScrollView>
            )}
          </Reveal>
        </ScrollView>
      </BlurTarget>
    </SafeAreaView>
  );
}

/** `.feature`: big lecturer photo, status pill on glass, text overlay. */
function NextMeetingCard({
  booking,
  onPress,
}: {
  booking: Booking;
  onPress: () => void;
}) {
  const lecturer = useLecturer(booking.lecturerId);
  const room = lecturer.data?.officeRoom;
  const roomText = (room?.code ?? '').trim() || room?.name.trim() || null;
  const where = booking.meetingUrl ? 'Online' : roomText ?? 'Trực tiếp';
  const topic = booking.topic?.trim();
  return (
    <PressableCard
      onPress={onPress}
      style={styles.feature}
      accessibilityLabel={`Buổi hẹn với ${booking.lecturerName}`}
    >
      <Avatar
        uri={lecturer.data?.photoUrl}
        id={booking.lecturerId}
        shape="squircle"
        style={styles.featureImage}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.9)']}
        locations={[0.25, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Glass style={styles.featurePill}>
        <StatusPill
          status="CONFIRMED"
          label="Đã xác nhận"
          style={styles.pillFlat}
        />
      </Glass>
      <View style={styles.overlay}>
        <Text style={styles.eyebrow}>
          {`${formatVnDayTime(booking.startAt)} · ${where}`}
        </Text>
        <Text style={styles.featureName} numberOfLines={1}>
          {booking.lecturerName}
        </Text>
        {topic ? (
          <Text style={styles.featureTopic} numberOfLines={1}>
            {topic}
          </Text>
        ) : null}
      </View>
    </PressableCard>
  );
}

/** One portrait card of the "Gợi ý cho bạn" shelf. */
function SuggestionCard({
  slot,
  onPress,
}: {
  slot: SuggestedSlot;
  onPress: () => void;
}) {
  return (
    <PressableCard
      onPress={onPress}
      style={styles.card}
      accessibilityLabel={`${slot.lecturerName}, ${suggestionWhen(slot)}`}
    >
      <Avatar
        uri={slot.photoUrl}
        id={slot.lecturerId}
        shape="squircle"
        style={styles.cardImage}
      />
      <Text style={styles.cardName} numberOfLines={1}>
        {slot.lecturerName}
      </Text>
      <Text style={styles.cardWhen} numberOfLines={1}>
        {suggestionWhen(slot)}
      </Text>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { paddingHorizontal: space.gutter },
  greeting: { marginTop: space.sm, marginBottom: space.sm },
  msg: { gap: 4, alignItems: 'flex-start' },
  feature: {
    height: 236,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.s2,
  },
  featureImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    borderRadius: 0,
    borderWidth: 0,
  },
  featurePill: {
    position: 'absolute',
    top: 14,
    right: 14,
    borderRadius: radius.pill,
  },
  pillFlat: { borderWidth: 0, backgroundColor: 'transparent' },
  overlay: { position: 'absolute', left: 18, right: 18, bottom: 16 },
  eyebrow: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    letterSpacing: ls(12, -0.01),
    color: 'rgba(255,255,255,0.75)',
  },
  featureName: {
    marginTop: 4,
    fontSize: 20,
    fontFamily: fonts.bold,
    letterSpacing: ls(20, -0.04),
    color: colors.fg,
  },
  featureTopic: {
    fontSize: 13,
    fontFamily: fonts.medium,
    letterSpacing: ls(13, -0.01),
    color: 'rgba(255,255,255,0.7)',
  },
  shelf: { marginHorizontal: -space.gutter },
  shelfRow: { gap: 12, paddingHorizontal: space.gutter },
  card: { width: 132 },
  cardImage: { width: 132, height: 150, borderRadius: 18 },
  cardName: {
    marginTop: 8,
    fontSize: 13.5,
    fontFamily: fonts.bold,
    letterSpacing: ls(13.5, -0.03),
    color: colors.fg,
  },
  cardWhen: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.fg3,
  },
});
