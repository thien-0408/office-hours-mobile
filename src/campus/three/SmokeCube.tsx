import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber/native';
import type { Mesh } from 'three';

function SpinningBox() {
  const mesh = useRef<Mesh>(null);
  useFrame((_state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.x += delta;
      mesh.current.rotation.y += delta * 0.7;
    }
  });
  return (
    <mesh ref={mesh}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4F46E5" />
    </mesh>
  );
}

/**
 * MO-01 smoke test for the 3D stack (r3f native on expo-gl). Not mounted anywhere.
 * Do not put a BlurView over this canvas (STYLE-MOCHY section 4.1).
 */
export function SmokeCube() {
  return (
    <Canvas camera={{ position: [0, 0, 3] }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={1.5} />
      <SpinningBox />
    </Canvas>
  );
}
