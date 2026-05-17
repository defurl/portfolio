import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { useSceneStore } from '../../lib/stores/sceneStore';
import {
  BG_PANEL,
  INK_PAPER,
  LAMP_WARM,
  VOXEL_GLOW,
  VOXEL_GLOW_SOFT,
} from '../../lib/style/colors';

// Phase 0 placeholder: one rendered cube under the right (warm) lamp.
// Phase 1 replaces this with the full desk: monitors, keyboard, lamp geometry, window.
export function DeskScene() {
  return (
    <>
      <ambientLight intensity={0.04} color={BG_PANEL} />
      {/* Warm desk lamp — key light, right side of frame. */}
      <pointLight position={[1.6, 1.8, 0.6]} intensity={2.2} color={LAMP_WARM} distance={6} decay={2} />
      {/* Cool monitor fill — secondary, left of camera. */}
      <pointLight position={[-1.0, 1.2, 0.6]} intensity={0.6} color={VOXEL_GLOW} distance={4} decay={2} />
      {/* Cool rim from the window. */}
      <directionalLight position={[3, 2, -3]} intensity={0.15} color={VOXEL_GLOW_SOFT} />

      <DeskSurface />
      <PlaceholderCube />
    </>
  );
}

function DeskSurface() {
  return (
    <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[6, 4]} />
      <meshStandardMaterial color={BG_PANEL} roughness={0.85} metalness={0.05} />
    </mesh>
  );
}

// Convention: every useFrame in this project consults sceneStore.prefersReducedMotion.
// We read via getState() so hook order stays stable and the frame loop pays no
// subscription cost.
function PlaceholderCube() {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (useSceneStore.getState().prefersReducedMotion) return;
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.12;
  });
  return (
    <mesh ref={ref} position={[1.0, 0.35, 0.2]} castShadow>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color={INK_PAPER} roughness={0.4} metalness={0.1} />
    </mesh>
  );
}
