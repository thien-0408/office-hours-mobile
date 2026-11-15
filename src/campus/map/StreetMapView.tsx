import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import {
  GestureDetector,
  useExclusiveGestures,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { LocateFixed, Minus, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, IconButton } from '../../components';
import { colors, fonts } from '../../theme';
import {
  TILE_USER_AGENT,
  clampZoom,
  fitTwoPoints,
  latLngToScreen,
  metersPerPixel,
  panStreet,
  visibleTiles,
  zoomStreetAt,
  type LatLngPoint,
} from './streetMath';

export type StreetMe = LatLngPoint & { acc?: number | null };

export type StreetMapViewProps = {
  /** The campus (destination) marker. */
  campus: LatLngPoint;
  /** My position; null when unknown. */
  me?: StreetMe | null;
  /** Extra top offset (px) for the controls, below the screen's own header. */
  controlsTop?: number;
};

const TAP_MAX_DISTANCE = 12;
const BUTTON_ZOOM_STEP = 1;
const TILE_HEADERS = { 'User-Agent': TILE_USER_AGENT };

type View2D = { center: LatLngPoint; zoom: number };

/**
 * 2D street map from OpenStreetMap raster tiles (no native map SDK): expo-image
 * tiles in a pannable / pinch-zoomable view, zoom 13..18, my position dot with
 * an accuracy circle and a campus marker. expo-image caches tiles on disk.
 */
export function StreetMapView({
  campus,
  me = null,
  controlsTop = 64,
}: StreetMapViewProps) {
  const insets = useSafeAreaInsets();
  const sizeRef = useRef({ width: 0, height: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [view, setView] = useState<View2D>({ center: campus, zoom: 16 });
  const viewRef = useRef(view);
  viewRef.current = view;

  const apply = useCallback((next: View2D) => {
    viewRef.current = next;
    setView(next);
  }, []);

  const meLat = me?.lat;
  const meLng = me?.lng;
  const campusLat = campus.lat;
  const campusLng = campus.lng;

  /** Show me and the campus together (or just the campus). */
  const fit = useCallback(() => {
    const { width, height } = sizeRef.current;
    if (meLat != null && meLng != null && width > 0) {
      apply(
        fitTwoPoints(
          { lat: meLat, lng: meLng },
          { lat: campusLat, lng: campusLng },
          width,
          height,
        ),
      );
    } else {
      apply({ center: { lat: campusLat, lng: campusLng }, zoom: 16 });
    }
  }, [apply, meLat, meLng, campusLat, campusLng]);

  // Fit once the view is measured, and again the first time a fix arrives.
  const hadMe = useRef(false);
  const measured = size.width > 0;
  useEffect(() => {
    if (!measured) {
      return;
    }
    const hasMe = meLat != null && meLng != null;
    if (!hasMe) {
      hadMe.current = false;
      fit();
    } else if (!hadMe.current) {
      hadMe.current = true;
      fit();
    }
  }, [measured, meLat, meLng, fit]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    sizeRef.current = { width, height };
    setSize({ width, height });
  }, []);

  const zoomAt = (nextZoom: number, px: number, py: number) => {
    const { width, height } = sizeRef.current;
    const v = viewRef.current;
    apply(zoomStreetAt(v.center, v.zoom, nextZoom, px, py, width, height));
  };

  const lastPan = useRef({ x: 0, y: 0 });
  const lastPinch = useRef<{ scale: number; fx: number | null; fy: number }>({
    scale: 1,
    fx: null,
    fy: 0,
  });

  const pan = usePanGesture({
    runOnJS: true,
    minPointers: 1,
    maxPointers: 1,
    minDistance: 4,
    onBegin: () => {
      lastPan.current = { x: 0, y: 0 };
    },
    onUpdate: e => {
      const dx = e.translationX - lastPan.current.x;
      const dy = e.translationY - lastPan.current.y;
      lastPan.current = { x: e.translationX, y: e.translationY };
      const v = viewRef.current;
      apply({ ...v, center: panStreet(v.center, v.zoom, dx, dy) });
    },
    onFinalize: () => {
      lastPan.current = { x: 0, y: 0 };
    },
  });
  const pinch = usePinchGesture({
    runOnJS: true,
    onBegin: () => {
      lastPinch.current = { scale: 1, fx: null, fy: 0 };
    },
    onUpdate: e => {
      const prev = lastPinch.current;
      const factor = e.scale / prev.scale;
      if (Number.isFinite(factor) && factor > 0) {
        const v = viewRef.current;
        zoomAt(v.zoom + Math.log2(factor), e.focalX, e.focalY);
      }
      if (prev.fx != null) {
        const v = viewRef.current;
        apply({
          ...v,
          center: panStreet(
            v.center,
            v.zoom,
            e.focalX - prev.fx,
            e.focalY - prev.fy,
          ),
        });
      }
      lastPinch.current = { scale: e.scale, fx: e.focalX, fy: e.focalY };
    },
    onFinalize: () => {
      lastPinch.current = { scale: 1, fx: null, fy: 0 };
    },
  });
  const doubleTap = useTapGesture({
    runOnJS: true,
    numberOfTaps: 2,
    maxDistance: TAP_MAX_DISTANCE,
    onDeactivate: e => {
      if (!e.canceled) {
        zoomAt(viewRef.current.zoom + 1, e.x, e.y);
      }
    },
  });
  // Single taps do nothing, but the exclusive pair keeps a double tap clean.
  const singleTap = useTapGesture({ runOnJS: true });
  const taps = useExclusiveGestures(doubleTap, singleTap);
  const gesture = useSimultaneousGestures(pan, pinch, taps);

  const tiles = useMemo(
    () =>
      size.width > 0
        ? visibleTiles(view.center, view.zoom, size.width, size.height)
        : [],
    [view, size],
  );

  const zoom = clampZoom(view.zoom);
  const place = (p: LatLngPoint) =>
    latLngToScreen(p, view.center, zoom, size.width, size.height);
  const campusPos = size.width > 0 ? place(campus) : null;
  const mePos = me && size.width > 0 ? place(me) : null;
  const accPx =
    me?.acc != null && Number.isFinite(me.acc) && mePos
      ? Math.max(0, me.acc / metersPerPixel(me.lat, zoom))
      : 0;

  return (
    <View style={styles.fill} onLayout={onLayout}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {tiles.map(t => (
          <Image
            key={t.key}
            source={{ uri: t.url, headers: TILE_HEADERS }}
            cachePolicy="disk"
            transition={0}
            contentFit="fill"
            style={[
              styles.tile,
              {
                left: Math.round(t.left),
                top: Math.round(t.top),
                width: Math.ceil(t.size) + 1,
                height: Math.ceil(t.size) + 1,
              },
            ]}
          />
        ))}
        {/* Dim the bright OSM tiles so the map sits in the dark UI. */}
        <View style={styles.dim} />

        {campusPos ? (
          <View
            style={[
              styles.campusMarker,
              { left: campusPos.x, top: campusPos.y },
            ]}
          >
            <View style={styles.campusDot} />
            <Text style={styles.campusLabel}>EIU</Text>
          </View>
        ) : null}

        {mePos ? (
          <>
            {accPx > 2 ? (
              <View
                style={[
                  styles.acc,
                  {
                    left: mePos.x - accPx,
                    top: mePos.y - accPx,
                    width: accPx * 2,
                    height: accPx * 2,
                    borderRadius: accPx,
                  },
                ]}
              />
            ) : null}
            <View
              style={[styles.me, { left: mePos.x - 17, top: mePos.y - 17 }]}
            >
              <Avatar id="me" size={30} accessibilityLabel="Vị trí của bạn" />
            </View>
          </>
        ) : null}
      </View>

      <GestureDetector gesture={gesture}>
        <View
          style={StyleSheet.absoluteFill}
          collapsable={false}
          testID="street-map-touch"
        />
      </GestureDetector>

      <View
        style={[styles.controls, { top: insets.top + controlsTop }]}
        pointerEvents="box-none"
      >
        <IconButton
          icon={Plus}
          accessibilityLabel="Phóng to"
          onPress={() =>
            zoomAt(
              viewRef.current.zoom + BUTTON_ZOOM_STEP,
              size.width / 2,
              size.height / 2,
            )
          }
        />
        <IconButton
          icon={Minus}
          accessibilityLabel="Thu nhỏ"
          onPress={() =>
            zoomAt(
              viewRef.current.zoom - BUTTON_ZOOM_STEP,
              size.width / 2,
              size.height / 2,
            )
          }
        />
        <IconButton
          icon={LocateFixed}
          accessibilityLabel="Xem vị trí của bạn và campus"
          onPress={fit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#1a1a1a', overflow: 'hidden' },
  tile: { position: 'absolute' },
  dim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  campusMarker: { position: 'absolute', width: 0, height: 0 },
  campusDot: {
    position: 'absolute',
    left: -9,
    top: -9,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#000000',
  },
  campusLabel: {
    position: 'absolute',
    left: -30,
    top: 12,
    width: 60,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#000000',
    textShadowColor: 'rgba(255,255,255,0.9)',
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 0 },
  },
  acc: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  me: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: colors.s3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  controls: {
    position: 'absolute',
    right: 14,
    gap: 8,
    alignItems: 'center',
  },
});
