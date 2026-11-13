import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  useFocusEffect,
  useIsFocused,
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
import { useCampusRooms } from '../../../api/hooks';
import { campus } from '../../../campus/campusData';
import { useLocationConsent } from '../../../campus/consent';
import { locationLabel } from '../../../campus/geo';
import { useCampusLocation } from '../../../campus/location/useCampusLocation';
import { useFloorEstimate } from '../../../campus/location/useFloorEstimate';
import { CampusMapView } from '../../../campus/map/CampusMapView';
import type { MapMarker } from '../../../campus/map/CampusScene';
import { resolveRoomTarget } from '../../../campus/map/mapMath';
import {
  FloorPlan,
  countRooms,
} from '../../../campus/map/components/FloorPlan';
import { LocationSourceLabel } from '../../../campus/map/components/LocationSourceLabel';
import { AppText, Avatar, Button, IconButton } from '../../../components';
import { Glass, useGlass } from '../../../components/motion';
import type { ScreenParams } from '../../../navigation/types';
import { colors, fonts, ls, radius, size, space } from '../../../theme';

type Route = RouteProp<{ CampusMap: ScreenParams['CampusMap'] }, 'CampusMap'>;

/** Screen 20 (and 20b): 3D campus map, destination room, "Vị trí của tôi". */
export function CampusMapScreen() {
  const consentGranted = useLocationConsent().status === 'granted';
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const roomId = useRoute<Route>().params?.roomId;
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();

  // STYLE-MOCHY 4.1: Glass must not blur over the GL canvas. The nav pill is
  // outside this screen, so force the provider to `solid` while we are focused
  // and restore the previous quality on blur. This screen also registers no
  // BlurTarget, and its own cards use Glass level="solid".
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

  // Destination room (from a booking / lecturer detail).
  const roomsQuery = useCampusRooms();
  const target = useMemo(() => {
    if (!roomId) {
      return null;
    }
    const room = roomsQuery.data?.find(r => r.id === roomId);
    return room ? resolveRoomTarget(room, campus.blocks) : null;
  }, [roomId, roomsQuery.data]);

  const [selected, setSelected] = useState<string | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [focus, setFocus] = useState<{ x: number; z: number } | null>(null);

  const targetBlockCode = target?.blockCode ?? null;
  useEffect(() => {
    if (target?.point) {
      setFocus({ x: target.point.x, z: target.point.z });
    }
  }, [target]);

  // My location: consent + screen focus gate the watcher (OS permission and
  // app foreground are checked inside the hook).
  const loc = useCampusLocation({
    enabled: consentGranted && sharing && focused,
  });
  const floorEst = useFloorEstimate(loc.fix?.block ?? null, {
    enabled: sharing && consentGranted && focused,
  });

  const myMarkers = useMemo<MapMarker[]>(
    () =>
      loc.fix
        ? [
            {
              id: 'me',
              x: loc.fix.x,
              z: loc.fix.z,
              acc: loc.fix.acc,
              floor: floorEst.floor,
            },
          ]
        : [],
    [loc.fix, floorEst.floor],
  );

  const gotFix = useRef(false);
  useEffect(() => {
    if (loc.fix && !gotFix.current) {
      gotFix.current = true;
      setFocus({ x: loc.fix.x, z: loc.fix.z });
    }
    if (!loc.fix) {
      gotFix.current = false;
    }
  }, [loc.fix]);

  const onMyLocation = () => {
    if (!consentGranted) {
      navigation.navigate('LocationConsent');
      return;
    }
    setSharing(s => !s);
  };

  // What the bottom card describes.
  const showTarget =
    target != null && (selected == null || selected === targetBlockCode);
  const cardBlockCode = showTarget ? targetBlockCode : selected;
  const cardBlock =
    campus.blocks.find(b => b.code === cardBlockCode) ?? null;

  const myLabel = loc.fix
    ? locationLabel(loc.fix.block, floorEst.floor, floorEst.source)
    : null;

  const statusText =
    sharing && consentGranted
      ? loc.status === 'waiting'
        ? 'Đang tìm vị trí của bạn…'
        : loc.status === 'denied'
        ? 'Chưa được cấp quyền vị trí. Bật lại trong Cài đặt.'
        : loc.status === 'error'
        ? 'Không lấy được vị trí. Thử lại sau ít phút.'
        : null
      : null;
  const roomError =
    roomId && roomsQuery.isError ? errorText(roomsQuery.error) : null;

  const cardBottom = Math.max(insets.bottom, 12) + size.navBar + 36;
  const canGoBack = roomId != null && navigation.canGoBack();

  return (
    <View style={styles.root}>
      <CampusMapView
        targetBlock={targetBlockCode}
        targetFloor={target?.floor ?? null}
        targetPoint={target?.point ?? null}
        selectedBlock={selected}
        markers={myMarkers}
        focus={focus}
        onBlockPress={block => setSelected(block?.code ?? null)}
      />

      <LinearGradient
        pointerEvents="none"
        colors={['#000000', 'rgba(0,0,0,0)']}
        locations={[0.2, 1]}
        style={[styles.fadeTop, { height: 130 + insets.top }]}
      />
      <View style={[styles.top, { top: insets.top + 8 }]}>
        {canGoBack ? (
          <IconButton
            icon={ChevronLeft}
            accessibilityLabel="Quay lại"
            onPress={() => navigation.goBack()}
          />
        ) : null}
        <Glass level="solid" style={styles.titlePill}>
          <Text style={styles.title}>Bản đồ campus</Text>
        </Glass>
      </View>

      <Glass level="solid" style={[styles.card, { bottom: cardBottom }]}>
        {showTarget && target ? (
          <>
            <Text style={styles.cardTitle}>
              {`Phòng ${target.label} · tầng ${target.floor ?? '?'}`}
            </Text>
            <AppText variant="sm">
              {cardBlock
                ? `${cardBlock.name}${
                    target.exactPoint ? '' : ' · vị trí gần đúng theo block'
                  }`
                : 'Không tìm thấy block của phòng này'}
            </AppText>
          </>
        ) : cardBlock ? (
          <>
            <Text style={styles.cardTitle}>{cardBlock.name}</Text>
            <AppText variant="sm">
              {`${cardBlock.floors} tầng · ${countRooms(
                campus.rooms,
                cardBlock.code,
              )} phòng`}
            </AppText>
          </>
        ) : (
          <>
            <Text style={styles.cardTitle}>Campus EIU</Text>
            <AppText variant="sm">
              {roomId && roomsQuery.isLoading
                ? 'Đang tìm phòng…'
                : 'Chạm vào một block để xem thông tin.'}
            </AppText>
          </>
        )}

        {roomError ? (
          <Text style={styles.error} accessibilityRole="alert">
            {roomError}
          </Text>
        ) : null}

        {myLabel && loc.fix ? (
          <View style={styles.who}>
            <Avatar id="me" size={40} />
            <View style={styles.whoText}>
              <Text style={styles.whoName}>Bạn</Text>
              <LocationSourceLabel text={myLabel} source={floorEst.source} />
              {floorEst.barometer === false && floorEst.floor == null ? (
                <AppText variant="xs">Máy không có barometer: Tầng ?</AppText>
              ) : null}
            </View>
          </View>
        ) : null}
        {statusText ? (
          <Text style={styles.status} accessibilityRole="alert">
            {statusText}
          </Text>
        ) : null}

        <View style={styles.acts}>
          <Button
            title="Sơ đồ tầng"
            style={styles.act}
            disabled={!cardBlock}
            onPress={() => setPlanOpen(true)}
          />
          <Button
            variant="quiet"
            title={sharing && consentGranted ? 'Dừng vị trí' : 'Vị trí của tôi'}
            style={styles.act}
            onPress={onMyLocation}
          />
        </View>
      </Glass>

      <Text
        style={[styles.attribution, { bottom: cardBottom - 20 }]}
        pointerEvents="none"
      >
        © OpenStreetMap contributors
      </Text>

      {planOpen && cardBlock ? (
        <FloorPlan
          block={cardBlock}
          rooms={campus.rooms}
          targetCode={
            showTarget && target?.blockCode === cardBlock.code
              ? target.label
              : null
          }
          initialFloor={showTarget ? target?.floor : null}
          onBack={() => setPlanOpen(false)}
        />
      ) : null}
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
  who: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: space.sm,
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
    paddingTop: 4,
  },
  error: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    color: colors.err,
    paddingTop: 4,
  },
  acts: { flexDirection: 'row', gap: 8, marginTop: space.md },
  act: { flex: 1, height: 46 },
  attribution: {
    position: 'absolute',
    left: 16,
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.fg3,
  },
});
