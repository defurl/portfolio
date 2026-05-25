import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { type MeshStandardMaterial } from 'three';
import { VOXEL_GLOW_SOFT } from '../../lib/style/colors';
import { useSceneStore } from '../../lib/stores/sceneStore';

// The river — a thin elevated emissive strip at x=0, spanning z = -60..+60,
// 8m wide, 0.1m above ground. Symbolic only; never interactive.
//
// Subtle slow `useFrame` modulation: emissive intensity drifts between 0.5
// and 0.7 over 6 seconds in a sine wave. Holds at 0.6 under reduced motion.

const BASE = 0.6;
const AMP = 0.1;
const PERIOD_S = 6;

export function River() {
  const matRef = useRef<MeshStandardMaterial>(null);
  const t = useRef(0);

  useFrame((_, dt) => {
    const mat = matRef.current;
    if (!mat) return;
    const reduced = useSceneStore.getState().prefersReducedMotion;
    if (reduced) {
      mat.emissiveIntensity = BASE;
      return;
    }
    t.current += dt;
    const phase = (t.current / PERIOD_S) * Math.PI * 2;
    mat.emissiveIntensity = BASE + Math.sin(phase) * AMP;
  });

  return (
    <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[8, 120]} />
      <meshStandardMaterial
        ref={matRef}
        color={VOXEL_GLOW_SOFT}
        emissive={VOXEL_GLOW_SOFT}
        emissiveIntensity={BASE}
        roughness={1}
        metalness={0}
        toneMapped={false}
      />
    </mesh>
  );
}
