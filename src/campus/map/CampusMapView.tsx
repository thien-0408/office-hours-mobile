import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import {
  GestureDetector,
  usePanGesture,
  usePinchGesture,
  useRotationGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import { Canvas } from '@react-three/fiber/native';
import { campus } from '../campusData';
import type { Block, XZ } from '../campusData';
import { createCameraStore } from './cameraStore';
import { CampusScene, MAP_COLORS, type MapMarker } from './CampusScene';
import {
  CAMERA_FOV_DEG,
  boundsOf,
  pickBlock,
  polygonCentroid,
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
};

const DEFAULT_DISTANCE = 340;
const TAP_MAX_DISTANCE = 12;

/**
 * Full-size 3D map: one r3f Canvas (frameloop="demand") plus pinch / pan /
 * rotate / tap gestures that drive a CameraStore.
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
}: CampusMapViewProps) {
  const size = useRef({ width: 1, height: 1 });
  const bounds = useMemo(() => boundsOf(boundary), [boundary]);
  const camera = useMemo(() => {
    const c = polygonCentroid(boundary);
    const initial: CameraState = {
      x: focus?.x ?? c.x,
      z: focus?.z ?? c.z,
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
    size.current = {
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
    };
  }, []);

  const pressRef = useRef(onBlockPress);
  pressRef.current = onBlockPress;
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  // Callbacks run on the JS thread (runOnJS): they only touch the plain-JS
  // camera store, no worklets needed.
  const pan = usePanGesture({
    runOnJS: true,
    minPointers: 1,
    maxPointers: 1,
    onUpdate: e => {
      camera.pan(e.changeX, e.changeY, size.current.height);
    },
  });
  const pinch = usePinchGesture({
    runOnJS: true,
    onUpdate: e => {
      camera.pinch(e.scaleChange);
    },
  });
  const rotation = useRotationGesture({
    runOnJS: true,
    onUpdate: e => {
      camera.rotate(e.rotationChange);
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
  const gesture = useSimultaneousGestures(pan, pinch, rotation, tap);

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.fill} onLayout={onLayout} collapsable={false}>
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
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: MAP_COLORS.background },
  canvas: { flex: 1 },
});
