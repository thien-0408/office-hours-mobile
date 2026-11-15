import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber/native';
import {
  LineBasicMaterial,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Group,
} from 'three';
import { DEFAULT_FLOOR_HEIGHT_M } from '../geo';
import type { Block, XZ } from '../campusData';
import type { CameraStore } from './cameraStore';
import {
  createEdgesGeometry,
  createGroundGeometry,
  createOutlineLineGeometry,
  createPrismGeometry,
} from './geometry';
import {
  accuracyRingRadius,
  blockHeight,
  cameraPose,
  dotRadius,
  scaleOutline,
  toWorld,
} from './mapMath';

// STYLE-MOCHY 8.10: every block grey, the destination is the only bright white.
// Readable variant: light-grey tops (sides get darker from the lighting) on a
// slightly lighter ground, crisp dark edge lines, a campus boundary outline.
export const MAP_COLORS = {
  background: '#000000',
  ground: '#1a1a1a',
  boundary: '#5a5a5a',
  block: '#bdbdbd',
  blockSelected: '#e4e4e4',
  edge: '#262626',
  edgeTarget: '#707070',
  target: '#ffffff',
  glow: '#ffffff',
  markerBorder: '#ffffff',
  markerFill: '#cfcfcf',
} as const;

// Shared materials: one instance for every block / line (cheap on the GPU).
const blockMaterial = new MeshStandardMaterial({
  color: MAP_COLORS.block,
  roughness: 0.95,
  metalness: 0,
});
const selectedMaterial = new MeshStandardMaterial({
  color: MAP_COLORS.blockSelected,
  roughness: 0.9,
  metalness: 0,
});
const targetMaterial = new MeshBasicMaterial({ color: MAP_COLORS.target });
const edgeMaterial = new LineBasicMaterial({ color: MAP_COLORS.edge });
const edgeTargetMaterial = new LineBasicMaterial({
  color: MAP_COLORS.edgeTarget,
});
const boundaryMaterial = new LineBasicMaterial({
  color: MAP_COLORS.boundary,
});
const groundMaterial = new MeshStandardMaterial({
  color: MAP_COLORS.ground,
  roughness: 1,
  metalness: 0,
});
const glowMaterialOuter = new MeshBasicMaterial({
  color: MAP_COLORS.glow,
  transparent: true,
  opacity: 0.12,
  depthWrite: false,
});
const glowMaterialInner = new MeshBasicMaterial({
  color: MAP_COLORS.glow,
  transparent: true,
  opacity: 0.24,
  depthWrite: false,
});

/** A person on the map. `acc` draws the accuracy ring, `floor` lifts the dot. */
export type MapMarker = {
  id: string;
  x: number;
  z: number;
  acc?: number | null;
  floor?: number | null;
  /** Dot fill. TODO(textures): replace with the person's photo/memoji texture. */
  fill?: string;
};

export type CampusSceneProps = {
  blocks: readonly Block[];
  boundary: readonly XZ[];
  camera: CameraStore;
  /** Block that holds the destination room (rendered white). */
  targetBlock?: string | null;
  /** Floor of the destination room; when set only that storey is white. */
  targetFloor?: number | null;
  /** Where to put the destination pin (room xM/zM or the block centroid). */
  targetPoint?: { x: number; z: number } | null;
  selectedBlock?: string | null;
  markers?: readonly MapMarker[];
  floorHeightM?: number;
};

/** Applies the camera store to the three camera and asks for a frame. */
function CameraRig({ store }: { store: CameraStore }) {
  const camera = useThree(s => s.camera);
  const invalidate = useThree(s => s.invalidate);
  useEffect(() => {
    const apply = () => {
      const { position, target } = cameraPose(store.get());
      camera.position.set(position[0], position[1], position[2]);
      camera.lookAt(target[0], target[1], target[2]);
      camera.updateMatrixWorld();
      invalidate();
    };
    apply();
    return store.subscribe(apply);
  }, [store, camera, invalidate]);
  return null;
}

function Ground({ boundary }: { boundary: readonly XZ[] }) {
  const geometry = useMemo(() => createGroundGeometry(boundary), [boundary]);
  const line = useMemo(() => createOutlineLineGeometry(boundary), [boundary]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  useEffect(() => () => line?.dispose(), [line]);
  if (!geometry) {
    return null;
  }
  return (
    <>
      <mesh
        geometry={geometry}
        position={[0, -0.05, 0]}
        material={groundMaterial}
      />
      {line ? (
        <lineSegments geometry={line} material={boundaryMaterial} />
      ) : null}
    </>
  );
}

type SliceProps = {
  outline: readonly XZ[];
  y0: number;
  y1: number;
  selected?: boolean;
  /** White, unlit (destination). */
  target?: boolean;
};

function Slice({ outline, y0, y1, selected, target }: SliceProps) {
  const geometry = useMemo(
    () => createPrismGeometry(outline, y0, y1),
    [outline, y0, y1],
  );
  const edges = useMemo(
    () => (geometry ? createEdgesGeometry(geometry) : null),
    [geometry],
  );
  useEffect(() => () => geometry?.dispose(), [geometry]);
  useEffect(() => () => edges?.dispose(), [edges]);
  if (!geometry) {
    return null;
  }
  return (
    <>
      <mesh
        geometry={geometry}
        material={
          target ? targetMaterial : selected ? selectedMaterial : blockMaterial
        }
      />
      {edges ? (
        <lineSegments
          geometry={edges}
          material={target ? edgeTargetMaterial : edgeMaterial}
        />
      ) : null}
    </>
  );
}

/** Soft white halo on the ground around the destination block. */
function Glow({ outline }: { outline: readonly XZ[] }) {
  const outer = useMemo(
    () => createGroundGeometry(scaleOutline(outline, 1.55)),
    [outline],
  );
  const inner = useMemo(
    () => createGroundGeometry(scaleOutline(outline, 1.22)),
    [outline],
  );
  useEffect(() => () => outer?.dispose(), [outer]);
  useEffect(() => () => inner?.dispose(), [inner]);
  return (
    <>
      {outer ? (
        <mesh
          geometry={outer}
          material={glowMaterialOuter}
          position={[0, 0.1, 0]}
          renderOrder={2}
        />
      ) : null}
      {inner ? (
        <mesh
          geometry={inner}
          material={glowMaterialInner}
          position={[0, 0.2, 0]}
          renderOrder={3}
        />
      ) : null}
    </>
  );
}

type BlockMeshProps = {
  block: Block;
  isTarget: boolean;
  isSelected: boolean;
  targetFloor: number | null;
  floorHeightM: number;
};

const BlockMesh = React.memo(function BlockMeshInner({
  block,
  isTarget,
  isSelected,
  targetFloor,
  floorHeightM,
}: BlockMeshProps) {
  const total = blockHeight(block.floors, floorHeightM);

  if (!isTarget) {
    return (
      <Slice outline={block.outline} y0={0} y1={total} selected={isSelected} />
    );
  }
  const floor =
    targetFloor != null && targetFloor >= 1 && targetFloor <= block.floors
      ? targetFloor
      : null;
  if (floor == null) {
    return (
      <>
        <Glow outline={block.outline} />
        <Slice outline={block.outline} y0={0} y1={total} target />
      </>
    );
  }
  // Only the destination storey is white; the rest of the block stays grey.
  const lo = (floor - 1) * floorHeightM;
  const hi = floor * floorHeightM;
  return (
    <>
      <Glow outline={block.outline} />
      {lo > 0 ? <Slice outline={block.outline} y0={0} y1={lo} /> : null}
      <Slice outline={block.outline} y0={lo} y1={hi} target />
      {hi < total ? <Slice outline={block.outline} y0={hi} y1={total} /> : null}
    </>
  );
});

/** Facing-the-camera person dot: white border, fill inside, ring on the ground. */
function PersonMarker({
  marker,
  floorHeightM,
}: {
  marker: MapMarker;
  floorHeightM: number;
}) {
  const outer = useRef<Group>(null);
  const dot = useRef<Group>(null);
  const floorY =
    marker.floor != null && marker.floor >= 1
      ? (marker.floor - 1) * floorHeightM
      : 0;
  const ring = accuracyRingRadius(marker.acc);

  // Keep the dot readable at any zoom and facing the camera. In demand mode
  // this only runs on frames the rig already asked for.
  useFrame(({ camera }) => {
    const g = dot.current;
    const o = outer.current;
    if (!g || !o) {
      return;
    }
    const r = dotRadius(camera.position.distanceTo(o.position));
    g.scale.setScalar(r);
    g.quaternion.copy(camera.quaternion);
  });

  const [wx, , wz] = toWorld(marker.x, marker.z);
  return (
    <group ref={outer} position={[wx, floorY, wz]}>
      {ring > 0 ? (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.2, 0]}
          scale={[ring, ring, 1]}
          renderOrder={10}
        >
          <circleGeometry args={[1, 48]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.08}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      ) : null}
      <group ref={dot} position={[0, 0, 0]} renderOrder={12}>
        <mesh renderOrder={12}>
          <circleGeometry args={[1, 32]} />
          <meshBasicMaterial
            color={MAP_COLORS.markerBorder}
            depthTest={false}
          />
        </mesh>
        <mesh position={[0, 0, 0.01]} renderOrder={13}>
          <circleGeometry args={[0.78, 32]} />
          <meshBasicMaterial
            color={marker.fill ?? MAP_COLORS.markerFill}
            depthTest={false}
          />
        </mesh>
      </group>
    </group>
  );
}

/** Destination pin above the target storey. */
function TargetPin({
  point,
  floor,
  floorHeightM,
}: {
  point: { x: number; z: number };
  floor: number | null;
  floorHeightM: number;
}) {
  const y = (floor ?? 1) * floorHeightM + 5;
  const [wx, , wz] = toWorld(point.x, point.z);
  return (
    <mesh position={[wx, y, wz]} renderOrder={11}>
      <sphereGeometry args={[2.4, 16, 12]} />
      <meshBasicMaterial color={MAP_COLORS.target} depthTest={false} />
    </mesh>
  );
}

/**
 * The 3D campus: grey extruded blocks on a dark ground, one white destination,
 * person dots. Reusable (screen 20 now, screen 22 later); camera is driven by
 * the CameraStore so gestures never re-render React.
 */
export function CampusScene({
  blocks,
  boundary,
  camera,
  targetBlock = null,
  targetFloor = null,
  targetPoint = null,
  selectedBlock = null,
  markers = [],
  floorHeightM = DEFAULT_FLOOR_HEIGHT_M,
}: CampusSceneProps) {
  const invalidate = useThree(s => s.invalidate);
  // Props changed -> draw one more frame (frameloop="demand").
  useEffect(() => {
    invalidate();
  }, [
    invalidate,
    targetBlock,
    targetFloor,
    targetPoint,
    selectedBlock,
    markers,
    blocks,
  ]);

  return (
    <>
      <color attach="background" args={[MAP_COLORS.background]} />
      <hemisphereLight args={['#ffffff', '#3a3a3a', 1.0]} />
      <directionalLight position={[160, 240, 120]} intensity={1.7} />
      <CameraRig store={camera} />
      <Ground boundary={boundary} />
      {blocks.map(block => (
        <BlockMesh
          key={block.code}
          block={block}
          isTarget={block.code === targetBlock}
          isSelected={block.code === selectedBlock}
          targetFloor={targetFloor}
          floorHeightM={floorHeightM}
        />
      ))}
      {targetPoint ? (
        <TargetPin
          point={targetPoint}
          floor={targetFloor}
          floorHeightM={floorHeightM}
        />
      ) : null}
      {markers.map(m => (
        <PersonMarker key={m.id} marker={m} floorHeightM={floorHeightM} />
      ))}
    </>
  );
}
