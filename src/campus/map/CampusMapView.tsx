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
  useRotationGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import { LocateFixed, Minus, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Canvas } from '@react-three/fiber/native';
import { IconButton } from '../../components';
import { fonts } from '../../theme';
import { campus } from '../campusData';
import type { Block, XZ } from '../campusData';
import { createCameraStore, type CameraStore } from './cameraStore';
import { CampusScene, MAP_COLORS, type MapMarker } from './CampusScene';
import {
  CAMERA_FOV_DEG,
  blockHeight,
  boundsOf,
  pickBlock,
  polygonCentroid,
  projectToScreen,
  screenToRay,
  type CameraState,
} from './mapMath';

export type CampusMapViewProps = {
  blocks?: readonly Block[];
  boundary?: readonly XZ[];
  targetBlock?: string | null;
  targetFloor?: number | null;
  targetPoint?: { x: number; z: number } | null;
  selectedBlock?: string | null;
  markers?: readonly MapMarker[];
  /** Camera centre; changing it re-centres the map. Defaults to the campus centre. */
  focus?: { x: number; z: number } | null;
  /** Called with the tapped block, or null when the ground is tapped. */
  onBlockPress?: (block: Block | null) => void;
  /** "+ / −" and recenter buttons (fallback for gestures). Default true. */
  showControls?: boolean;
  /** Extra top offset (px) for the controls, below the screen's own header. */
  controlsTop?: number;
};

const DEFAULT_DISTANCE = 340;
const TAP_MAX_DISTANCE = 12;
const BUTTON_ZOOM = 1.5;
const DOUBLE_TAP_ZOOM = 2;

type Label = { code: string; text: string; x: number; y: number };

function labelText(block: Block): string {
  return block.code === 'CANTEEN' ? 'Căn tin' : block.code;
}

/**
 * 2D block codes pinned to the 3D roofs. Subscribes to the camera store and
 * re-projects at most once per animation frame; the GL canvas never re-renders.
 */
function BlockLabels({
  blocks,
  camera,
  width,
  height,
  targetBlock,
  selectedBlock,
}: {
  blocks: readonly Block[];
  camera: CameraStore;
  width: number;
  height: number;
  targetBlock: string | null;
  selectedBlock: string | null;
}) {
  const anchors = useMemo(
    () =>
      blocks.map(b => {
        const c = polygonCentroid(b.outline);
        return {
          code: b.code,
          text: labelText(b),
          x: c.x,
          z: c.z,
          y: blockHeight(b.floors),
        };
      }),
    [blocks],
  );
  const [labels, setLabels] = useState<Label[]>([]);

  useEffect(() => {
    let frame: number | null = null;
    const compute = () => {
      frame = null;
      const s = camera.get();
      const out: Label[] = [];
      for (const a of anchors) {
        const p = projectToScreen(a.x, a.z, a.y, width, height, s);
        if (
          !p ||
          p.x < -40 ||
          p.x > width + 40 ||
          p.y < -20 ||
          p.y > height + 20
        ) {
          continue;
        }
        out.push({ code: a.code, text: a.text, x: p.x, y: p.y });
      }
      setLabels(out);
    };
    const schedule = () => {
      if (frame == null) {
        frame = requestAnimationFrame(compute);
      }
    };
    compute();
    const unsub = camera.subscribe(schedule);
    return () => {
      unsub();
      if (frame != null) {
        cancelAnimationFrame(frame);
      }
    };
  }, [anchors, camera, width, height]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {labels.map(l => {
        const hot = l.code === targetBlock || l.code === selectedBlock;
        return (
          <Text
            key={l.code}
            style={[
              styles.label,
              hot && styles.labelHot,
              { left: l.x - 40, top: l.y - 8 },
            ]}
            numberOfLines={1}
          >
            {l.text}
          </Text>
        );
      })}
    </View>
  );
}

/**
 * Full-size 3D map: one r3f Canvas (frameloop="demand") plus pan / pinch /
 * rotate / tap gestures that drive a CameraStore.
 * The GestureDetector wraps a transparent overlay that sits above the canvas,
 * so touches never depend on the GL view's own touch handling.
 * Never put a BlurView over this canvas (STYLE-MOCHY 4.1).
 */
export function CampusMapView({
  blocks = campus.blocks,
  boundary = campus.boundary,
  targetBlock = null,
  targetFloor = null,
  targetPoint = null,
  selectedBlock = null,
  markers = [],
  focus = null,
  onBlockPress,
  showControls = true,
  controlsTop = 64,
}: CampusMapViewProps) {
  const insets = useSafeAreaInsets();
  const size = useRef({ width: 1, height: 1 });
  const [viewSize, setViewSize] = useState({ width: 1, height: 1 });
  const bounds = useMemo(() => boundsOf(boundary), [boundary]);
  const centre = useMemo(() => polygonCentroid(boundary), [boundary]);
  const camera = useMemo(() => {
    const initial: CameraState = {
      x: focus?.x ?? centre.x,
      z: focus?.z ?? centre.z,
      yaw: 0,
      distance: DEFAULT_DISTANCE,
    };
    return createCameraStore(initial, bounds);
    // Created once per boundary; `focus` changes go through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundary, bounds]);

  const focusX = focus?.x;
  const focusZ = focus?.z;
  useEffect(() => {
    if (focusX == null || focusZ == null) {
      return;
    }
    camera.set({ ...camera.get(), x: focusX, z: focusZ });
  }, [camera, focusX, focusZ]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    size.current = { width, height };
    setViewSize({ width, height });
  }, []);

  const pressRef = useRef(onBlockPress);
  pressRef.current = onBlockPress;
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  // Gesture callbacks run on the JS thread (runOnJS) and only touch the
  // plain-JS camera store. Each handler derives its delta from the absolute
  // translation / scale / rotation, so a missing "change" field cannot poison
  // the camera (the store also rejects non-finite states).
  const lastPan = useRef({ x: 0, y: 0 });
  const lastPinch = useRef<{ scale: number; fx: number | null; fy: number }>({
    scale: 1,
    fx: null,
    fy: 0,
  });
  const lastRotation = useRef(0);

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
      camera.pan(dx, dy, size.current.height);
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
      const { width, height } = size.current;
      camera.zoomAt(factor, e.focalX, e.focalY, width, height);
      if (prev.fx != null) {
        // Two-finger drag moves the map too.
        camera.pan(e.focalX - prev.fx, e.focalY - prev.fy, height);
      }
      lastPinch.current = { scale: e.scale, fx: e.focalX, fy: e.focalY };
    },
    onFinalize: () => {
      lastPinch.current = { scale: 1, fx: null, fy: 0 };
    },
  });
  const rotation = useRotationGesture({
    runOnJS: true,
    onBegin: () => {
      lastRotation.current = 0;
    },
    onUpdate: e => {
      const d = e.rotation - lastRotation.current;
      lastRotation.current = e.rotation;
      camera.rotate(d);
    },
    onFinalize: () => {
      lastRotation.current = 0;
    },
  });
  const doubleTap = useTapGesture({
    runOnJS: true,
    numberOfTaps: 2,
    maxDistance: TAP_MAX_DISTANCE,
    onDeactivate: e => {
      if (e.canceled) {
        return;
      }
      const { width, height } = size.current;
      camera.zoomAt(DOUBLE_TAP_ZOOM, e.x, e.y, width, height);
    },
  });
  const tap = useTapGesture({
    runOnJS: true,
    maxDistance: TAP_MAX_DISTANCE,
    onDeactivate: e => {
      if (e.canceled) {
        return;
      }
      const { width, height } = size.current;
      const ray = screenToRay(e.x, e.y, width, height, camera.get());
      pressRef.current?.(pickBlock(ray, blocksRef.current));
    },
  });
  const taps = useExclusiveGestures(doubleTap, tap);
  const gesture = useSimultaneousGestures(pan, pinch, rotation, taps);

  const zoomBy = (factor: number) => {
    const { width, height } = size.current;
    camera.zoomAt(factor, width / 2, height / 2, width, height);
  };
  const recenter = () => {
    camera.set({
      x: focus?.x ?? centre.x,
      z: focus?.z ?? centre.z,
      yaw: 0,
      distance: DEFAULT_DISTANCE,
    });
  };

  return (
    <View style={styles.fill} onLayout={onLayout}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Canvas
          frameloop="demand"
          camera={{ fov: CAMERA_FOV_DEG, near: 5, far: 4000 }}
          style={styles.canvas}
        >
          <CampusScene
            blocks={blocks}
            boundary={boundary}
            camera={camera}
            targetBlock={targetBlock}
            targetFloor={targetFloor}
            targetPoint={targetPoint}
            selectedBlock={selectedBlock}
            markers={markers}
          />
        </Canvas>
      </View>

      <BlockLabels
        blocks={blocks}
        camera={camera}
        width={viewSize.width}
        height={viewSize.height}
        targetBlock={targetBlock}
        selectedBlock={selectedBlock}
      />

      <GestureDetector gesture={gesture}>
        <View
          style={StyleSheet.absoluteFill}
          collapsable={false}
          testID="campus-map-touch"
        />
      </GestureDetector>

      {showControls ? (
        <View
          style={[styles.controls, { top: insets.top + controlsTop }]}
          pointerEvents="box-none"
        >
          <IconButton
            icon={Plus}
            accessibilityLabel="Phóng to"
            onPress={() => zoomBy(BUTTON_ZOOM)}
          />
          <IconButton
            icon={Minus}
            accessibilityLabel="Thu nhỏ"
            onPress={() => zoomBy(1 / BUTTON_ZOOM)}
          />
          <IconButton
            icon={LocateFixed}
            accessibilityLabel="Về giữa bản đồ"
            onPress={recenter}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: MAP_COLORS.background },
  canvas: { flex: 1 },
  label: {
    position: 'absolute',
    width: 80,
    textAlign: 'center',
    fontSize: 10.5,
    fontFamily: fonts.bold,
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  labelHot: { fontSize: 12.5 },
  controls: {
    position: 'absolute',
    right: 14,
    gap: 8,
    alignItems: 'center',
  },
});
