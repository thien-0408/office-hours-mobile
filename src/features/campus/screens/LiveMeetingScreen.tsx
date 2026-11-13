import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type NavigationProp,
  type ParamListBase,
  type RouteProp,
} from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { errorText } from '../../../api';
import { useBooking, useLecturer } from '../../../api/hooks';
import { formatVnTimeRange } from '../../../api/time';
import { campus } from '../../../campus/campusData';
import { CampusMapView } from '../../../campus/map/CampusMapView';
import type { MapMarker } from '../../../campus/map/CampusScene';
import { resolveRoomTarget } from '../../../campus/map/mapMath';
import { LocationSourceLabel } from '../../../campus/map/components/LocationSourceLabel';
import { AppText, Avatar, Button, IconButton, Seg } from '../../../components';
import { Glass, useGlass } from '../../../components/motion';
import { useAppSession } from '../../../navigation/devSession';
import type { ScreenParams } from '../../../navigation/types';
import {
  freshnessText,
  isAtRoom,
  isStale,
  OUTSIDE_BUILDING,
  peerLocationText,
  sharingWindowText,
  useLiveLocationSharing,
  type LiveFloorSource,
} from '../../../realtime/location';
import { colors, fonts, ls, radius, space } from '../../../theme';
import { useNow } from '../../booking/detail';

type Route = RouteProp<ScreenParams, 'LiveMeeting'>;

const TOGGLE = [
  { value: 'on', label: 'Bật' },
  { value: 'off', label: 'Tắt' },
];

/** Screen 22: live location of both sides of a booking. */
export function LiveMeetingScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { bookingId } = useRoute<Route>().params;
  const insets = useSafeAreaInsets();
  const { role } = useAppSession();
  const now = useNow(1000);

  // STYLE-MOCHY 4.1: no Glass blur over the GL canvas; force `solid` while focused.
  const glassCtx = useGlass();
  const qualityRef = useRef(glassCtx.quality);
  qualityRef.current = glassCtx.quality;
  const { setQuality } = glassCtx;
  useFocusEffect(
    useCallback(() => {
      const previous = qualityRef.current;
      setQuality('solid');
      return () => setQuality(previous);
    }, [setQuality]),
  );

  const bookingQ = useBooking(bookingId);
  const booking = bookingQ.data;
  const lecturerQ = useLecturer(booking?.lecturerId);

  // The booking DTO has no room: the lecturer's office room is the destination
  // for in-person bookings (same source as BookingDetail / FloatingMeeting).
  const officeRoom = lecturerQ.data?.officeRoom;
  const target = useMemo(
    () =>
      officeRoom && booking && !booking.meetingUrl
        ? resolveRoomTarget(officeRoom, campus.blocks)
        : null,
    [officeRoom, booking],
  );

  const isLecturer = role === 'LECTURER';
  const me = booking
    ? isLecturer
      ? { id: booking.lecturerId, name: booking.lecturerName }
      : { id: booking.studentId, name: booking.studentName }
    : null;
  const other = booking
    ? isLecturer
      ? { id: booking.studentId, name: booking.studentName }
      : { id: booking.lecturerId, name: booking.lecturerName }
    : null;

  const [userEnabled, setUserEnabled] = useState(false);
  const live = useLiveLocationSharing(booking, {
    myUid: me?.id ?? null,
    userEnabled,
    now,
  });
  const { gate } = live;
  const sharing = gate.allowed;

  const [focus, setFocus] = useState<{ x: number; z: number } | null>(null);
  useEffect(() => {
    if (target?.point) {
      setFocus({ x: target.point.x, z: target.point.z });
    }
  }, [target]);

  const otherPeer = other ? live.peers[other.id] : undefined;

  const markers = useMemo<MapMarker[]>(() => {
    const out: MapMarker[] = [];
    if (live.fix) {
      out.push({
        id: 'me',
        x: live.fix.x,
        z: live.fix.z,
        acc: live.fix.acc,
        floor: live.floor,
      });
    }
    for (const [uid, p] of Object.entries(live.peers)) {
      out.push({ id: uid, x: p.x, z: p.z, acc: p.acc, floor: p.floor });
    }
    return out;
  }, [live.fix, live.floor, live.peers]);

  const myWhere = live.fix
    ? {
        building: live.fix.block ?? OUTSIDE_BUILDING,
        floor: live.floor,
        floorSource: live.floorSource as LiveFloorSource | null,
      }
    : null;

  const statusText = sharing
    ? live.locationStatus === 'waiting'
      ? 'Đang tìm vị trí của bạn…'
      : live.locationStatus === 'denied'
      ? 'Chưa được cấp quyền vị trí. Bật lại trong Cài đặt.'
      : live.locationStatus === 'error'
      ? 'Không lấy được vị trí. Thử lại sau ít phút.'
      : null
    : null;

  const loadError = bookingQ.isError ? errorText(bookingQ.error) : null;
  const bottom = Math.max(insets.bottom, 12) + 12;

  return (
    <View style={styles.root}>
      <CampusMapView
        targetBlock={target?.blockCode ?? null}
        targetFloor={target?.floor ?? null}
        targetPoint={target?.point ?? null}
        markers={markers}
        focus={focus}
      />

      <LinearGradient
        pointerEvents="none"
        colors={['#000000', 'rgba(0,0,0,0)']}
        locations={[0.2, 1]}
        style={[styles.fadeTop, { height: 130 + insets.top }]}
      />
      <View style={[styles.top, { top: insets.top + 8 }]}>
        <IconButton
          icon={ChevronLeft}
          accessibilityLabel="Quay lại"
          onPress={() => navigation.goBack()}
        />
        <Glass level="solid" style={styles.titlePill}>
          <Text style={styles.title}>Buổi hẹn đang diễn ra</Text>
        </Glass>
      </View>

      <Glass level="solid" style={[styles.card, { bottom }]}>
        {!booking ? (
          loadError ? (
            <Text style={styles.error} accessibilityRole="alert">
              {loadError}
            </Text>
          ) : (
            <ActivityIndicator />
          )
        ) : (
          <>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {booking.topic || `Buổi hẹn với ${other?.name ?? ''}`}
            </Text>
            <AppText variant="sm">
              {[
                formatVnTimeRange(booking.startAt, booking.endAt),
                booking.meetingUrl
                  ? 'Online'
                  : target
                  ? `Phòng ${target.label}`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </AppText>

            {gate.reason === 'no-consent' ? (
              <View style={styles.block}>
                <AppText variant="sm">
                  Bạn chưa đồng ý chia sẻ vị trí. Vị trí chỉ được gửi cho người
                  trong buổi hẹn này, khi app đang mở và trong giờ hẹn.
                </AppText>
                <Button
                  title="Xem quyền riêng tư"
                  style={styles.act}
                  onPress={() => navigation.navigate('LocationConsent')}
                />
              </View>
            ) : gate.reason === 'outside-window' ? (
              <View style={styles.block}>
                <AppText variant="sm">{sharingWindowText(booking)}</AppText>
              </View>
            ) : (
              <View style={styles.block}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Chia sẻ vị trí</Text>
                  <Seg
                    options={TOGGLE}
                    value={userEnabled ? 'on' : 'off'}
                    onChange={v => setUserEnabled(v === 'on')}
                    style={styles.seg}
                  />
                </View>

                {sharing && me && other ? (
                  <>
                    <Row
                      id={me.id}
                      name="Bạn"
                      text={myWhere ? peerLocationText(myWhere, target) : null}
                      source={
                        myWhere && isAtRoom(myWhere, target)
                          ? 'room'
                          : live.floorSource
                      }
                      meta={null}
                      fallback="Đang tìm vị trí…"
                    />
                    <Row
                      id={other.id}
                      name={other.name}
                      text={
                        otherPeer ? peerLocationText(otherPeer, target) : null
                      }
                      source={
                        otherPeer && isAtRoom(otherPeer, target)
                          ? 'room'
                          : otherPeer?.floorSource
                      }
                      meta={otherPeer ? freshnessText(otherPeer, now) : null}
                      stale={otherPeer ? isStale(otherPeer, now) : false}
                      fallback={`Đang chờ ${other.name} bật chia sẻ`}
                    />
                  </>
                ) : (
                  <AppText variant="sm">
                    {`Bật chia sẻ để thấy vị trí của ${other?.name ?? ''}.`}
                  </AppText>
                )}

                {statusText ? (
                  <Text style={styles.status} accessibilityRole="alert">
                    {statusText}
                  </Text>
                ) : null}

                {sharing ? (
                  <Button
                    variant="quiet"
                    title="Dừng chia sẻ"
                    style={styles.act}
                    onPress={() => setUserEnabled(false)}
                  />
                ) : null}
              </View>
            )}
          </>
        )}
      </Glass>
    </View>
  );
}

type RowProps = {
  id: string;
  name: string;
  text: string | null;
  source: LiveFloorSource | null | undefined;
  meta: string | null;
  stale?: boolean;
  fallback: string;
};

function Row({ id, name, text, source, meta, stale, fallback }: RowProps) {
  return (
    <View style={styles.who}>
      <Avatar id={id} size={40} />
      <View style={styles.whoText}>
        <Text style={styles.whoName} numberOfLines={1}>
          {name}
        </Text>
        {text ? (
          <LocationSourceLabel text={text} source={source ?? null} />
        ) : (
          <AppText variant="xs">{fallback}</AppText>
        )}
        {meta ? (
          <AppText variant="xs" color={stale ? colors.err : undefined}>
            {meta}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  fadeTop: { position: 'absolute', top: 0, left: 0, right: 0 },
  top: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titlePill: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.bold,
    letterSpacing: ls(16, -0.03),
    color: colors.fg,
  },
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: radius.sheet,
    padding: 14,
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    letterSpacing: ls(18, -0.035),
    color: colors.fg,
  },
  block: { gap: space.sm, marginTop: space.sm },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 14.5,
    fontFamily: fonts.semibold,
    letterSpacing: ls(14.5, -0.03),
    color: colors.fg,
  },
  seg: { width: 140 },
  who: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  whoText: { flex: 1, gap: 3 },
  whoName: {
    fontSize: 14.5,
    fontFamily: fonts.semibold,
    letterSpacing: ls(14.5, -0.03),
    color: colors.fg,
  },
  status: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    color: colors.fg2,
  },
  error: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    color: colors.err,
  },
  act: { height: 46 },
});
