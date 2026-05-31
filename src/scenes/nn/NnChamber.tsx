import { useRef, useState, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { type MeshStandardMaterial, type PointLight } from 'three';
import { BG_PANEL, BG_PANEL_2, SIGNAL_AMBER, VOXEL_GLOW } from '../../lib/style/colors';
import { useSceneStore } from '../../lib/stores/sceneStore';
import { HALL_WIDTH } from './nnLighting';
import {
  CHAMBER_DEPTH,
  CHAMBER_HEIGHT,
  CHAMBER_WIDTH,
  ENTRY_TRIGGER_RADIUS,
  type ChamberConfig,
} from './chambers';

// Phase 4C §4.14 — prefab concrete chamber.
//
// Recessed cube branching off the main corridor through a gap-aligned
// doorway. The "neuron activation" flash fires once when the camera first
// enters the trigger zone: a hidden PointLight inside the chamber spikes
// emissive intensity to ~8.0 then decays back to 1.0 over 0.8s. The accent
// material (a back-wall slab) carries the spike.
//
// Under prefers-reduced-motion: the spike is skipped; the slab holds at the
// resting intensity instead.

const ACTIVATION_PEAK = 8.0;
const ACTIVATION_REST = 1.0;
const ACTIVATION_DECAY_S = 0.8;

interface NnChamberProps {
  readonly config: ChamberConfig;
  readonly accentColor?: string;
  readonly children?: ReactNode; // wall-panel content
}

export function NnChamber({ config, accentColor, children }: NnChamberProps) {
  const camera = useThree((s) => s.camera);
  const accentRef = useRef<MeshStandardMaterial>(null);
  const lightRef = useRef<PointLight>(null);
  const [activated, setActivated] = useState(false);
  const decayT = useRef(0);

  // Chamber position: doorway at the corridor wall, room recessed outward.
  // If side = 'right', the chamber extends in +x; 'left' extends in -x.
  const dir = config.side === 'right' ? 1 : -1;
  const doorwayX = (HALL_WIDTH / 2) * dir; // corridor side surface
  const roomCenterX = doorwayX + dir * (CHAMBER_DEPTH / 2);
  const roomCenterZ = config.z;
  const color = accentColor ?? (config.side === 'right' ? VOXEL_GLOW : SIGNAL_AMBER);

  // Entry-trigger detection: each frame check camera distance to doorway in
  // XZ. Fire once on entry.
  useFrame((_, dt) => {
    const dx = camera.position.x - doorwayX;
    const dz = camera.position.z - roomCenterZ;
    const inZone = Math.hypot(dx, dz) < ENTRY_TRIGGER_RADIUS;
    if (inZone && !activated) {
      setActivated(true);
      decayT.current = 0;
    }
    // Activation flash decay.
    const mat = accentRef.current;
    const light = lightRef.current;
    if (!mat || !light) return;
    const reduced = useSceneStore.getState().prefersReducedMotion;
    if (reduced) {
      mat.emissiveIntensity = ACTIVATION_REST;
      light.intensity = ACTIVATION_REST * 0.6;
      return;
    }
    if (activated && decayT.current < ACTIVATION_DECAY_S) {
      decayT.current = Math.min(decayT.current + dt, ACTIVATION_DECAY_S);
      const t = decayT.current / ACTIVATION_DECAY_S;
      // Exponential decay from peak → rest.
      const intensity =
        ACTIVATION_REST + (ACTIVATION_PEAK - ACTIVATION_REST) * Math.exp(-4 * t);
      mat.emissiveIntensity = intensity;
      light.intensity = intensity * 0.6;
    } else if (!activated) {
      // Not yet entered — chamber sits dark.
      mat.emissiveIntensity = 0;
      light.intensity = 0;
    }
  });

  return (
    <group position={[roomCenterX, 0, roomCenterZ]}>
      {/* Back wall — accent slab that carries the activation flash. */}
      <mesh
        position={[(CHAMBER_DEPTH / 2 - 0.1) * dir, CHAMBER_HEIGHT / 2, 0]}
        rotation={[0, dir > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}
      >
        <planeGeometry args={[CHAMBER_WIDTH * 0.8, CHAMBER_HEIGHT * 0.85]} />
        <meshStandardMaterial
          ref={accentRef}
          color={BG_PANEL_2}
          emissive={color}
          emissiveIntensity={0}
          roughness={0.9}
          metalness={0.03}
          toneMapped={false}
        />
      </mesh>

      {/* Side walls (left, right of room — perpendicular to corridor axis) */}
      <mesh position={[0, CHAMBER_HEIGHT / 2, -CHAMBER_WIDTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[CHAMBER_DEPTH, CHAMBER_HEIGHT, 0.3]} />
        <meshStandardMaterial color={BG_PANEL} roughness={0.92} />
      </mesh>
      <mesh position={[0, CHAMBER_HEIGHT / 2, CHAMBER_WIDTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[CHAMBER_DEPTH, CHAMBER_HEIGHT, 0.3]} />
        <meshStandardMaterial color={BG_PANEL} roughness={0.92} />
      </mesh>

      {/* Floor + ceiling */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[CHAMBER_DEPTH, CHAMBER_WIDTH]} />
        <meshStandardMaterial color={BG_PANEL} roughness={0.95} />
      </mesh>
      <mesh position={[0, CHAMBER_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CHAMBER_DEPTH, CHAMBER_WIDTH]} />
        <meshStandardMaterial color={BG_PANEL} roughness={0.95} />
      </mesh>

      {/* Doorway-facing wall — solid above & below the doorway only.
          Doorway itself is the implicit gap by not rendering geometry there. */}
      {/* Above-doorway lintel */}
      <mesh
        position={[
          (-CHAMBER_DEPTH / 2 + 0.15) * dir,
          (CHAMBER_HEIGHT + 2.4) / 2 + 1.2 / 2,
          0,
        ]}
      >
        <boxGeometry args={[0.3, CHAMBER_HEIGHT - 2.4, CHAMBER_WIDTH]} />
        <meshStandardMaterial color={BG_PANEL} roughness={0.92} />
      </mesh>

      {/* Point light (hidden) — backlights the chamber from inside. */}
      <pointLight
        ref={lightRef}
        position={[(-CHAMBER_DEPTH / 2 + 1) * dir, CHAMBER_HEIGHT / 2 + 0.5, 0]}
        color={color}
        intensity={0}
        distance={CHAMBER_DEPTH * 2.5}
        decay={2}
      />

      {/* Slot for wall-panel content (drei <Html> from the parent). */}
      {children}
    </group>
  );
}
