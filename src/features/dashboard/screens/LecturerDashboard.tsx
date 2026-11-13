import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  useIsFocused,
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { periodTitle } from '../../../api/bookingTime';
import { errorText } from '../../../api/errorText';
import {
  AppText,
  Button,
  ListRow,
  SectionHeader,
  Seg,
  StatusPill,
} from '../../../components';
import {
  BlurTarget,
  Glow,
  Reveal,
  Skeleton,
  useTabBarSpace,
} from '../../../components/motion';
import { colors, space } from '../../../theme';
import { useSession } from '../../auth/session';
import { AppHeader, StatsRow } from '../components';
import {
  PRESENCE_OPTIONS,
  lecturerTodayStats,
  todayRowPill,
  todayRowSubtitle,
  todayRows,
  type Presence,
} from '../dashboardLogic';
import { useNowTick, usePendingCount, useTodayBookings } from '../hooks';

type Nav = NavigationProp<ParamListBase>;
const go = (nav: Nav, name: string, params?: object) =>
  (nav.navigate as (n: string, p?: object) => void)(name, params);

/** Screen 5b: "Chiều nay của bạn", presence, stats, today's bookings. */
export function LecturerDashboard() {
  const navigation = useNavigation<Nav>();
  const focused = useIsFocused();
  const tabSpace = useTabBarSpace();
  const { user } = useSession();
  const now = useNowTick(60_000);

  // UI state only. TODO(MO-15): write presence to Realtime DB /presence/{uid}.
  const [presence, setPresence] = useState<Presence>('AVAILABLE');

  const pending = usePendingCount();
  const today = useTodayBookings();
  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([pending.refetch(), today.refetch()]);
    setRefreshing(false);
  }, [pending, today]);

  const rows = todayRows(today.data ?? []);
  const stats = lecturerTodayStats(today.data ?? []);
  const statsError = pending.isError || today.isError;

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <BlurTarget active={focused} style={styles.flex}>
        <Glow tone="teal" position="tr" />
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
          <Reveal id="dash-lecturer-head">
            <AppText variant="t1" style={styles.title}>
              {`${periodTitle(now)}\ncủa bạn`}
            </AppText>
            <Seg
              options={PRESENCE_OPTIONS}
              value={presence}
              onChange={v => setPresence(v as Presence)}
              style={styles.seg}
            />
            {statsError ? (
              <AppText variant="sm" color={colors.err}>
                {errorText(pending.error ?? today.error)}
              </AppText>
            ) : (
              <StatsRow
                items={[
                  {
                    value: pending.data ?? 0,
                    label: 'chờ duyệt',
                    onPress: () => go(navigation, 'Review'),
                  },
                  { value: stats.sessions, label: 'buổi hôm nay' },
                  { value: stats.completed, label: 'đã xong' },
                ]}
              />
            )}
          </Reveal>

          <Reveal id="dash-lecturer-today" index={1}>
            <SectionHeader
              title="Hôm nay"
              onPress={() => go(navigation, 'Calendar')}
            />
            {today.isLoading ? (
              <View style={styles.skeletons}>
                <Skeleton height={48} borderRadius={14} />
                <Skeleton height={48} borderRadius={14} />
              </View>
            ) : today.isError ? (
              <View style={styles.msg}>
                <AppText variant="sm">{errorText(today.error)}</AppText>
                <Button
                  variant="ghost"
                  title="Thử lại"
                  onPress={() => today.refetch()}
                />
              </View>
            ) : rows.length === 0 ? (
              <AppText variant="sm">Hôm nay chưa có buổi hẹn nào.</AppText>
            ) : (
              rows.map((b, i) => {
                const pill = todayRowPill(b);
                return (
                  <ListRow
                    key={b.id}
                    title={b.studentName}
                    subtitle={todayRowSubtitle(b)}
                    avatarId={b.studentId}
                    avatarShape="round"
                    divider={i > 0}
                    trailing={<StatusPill status={pill.status} label={pill.label} />}
                    onPress={() =>
                      go(navigation, 'BookingDetail', { bookingId: b.id })
                    }
                  />
                );
              })
            )}
          </Reveal>
        </ScrollView>
      </BlurTarget>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { paddingHorizontal: space.gutter },
  title: { marginTop: space.sm },
  seg: { marginTop: space.lg, marginBottom: space.xl },
  msg: { gap: 4, alignItems: 'flex-start' },
  skeletons: { gap: 12 },
});
