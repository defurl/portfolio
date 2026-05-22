import { BG_PANEL_2, BG_VOID, INK_GHOST, SIGNAL_AMBER_DIM, VOXEL_GLOW_SOFT } from '../../../lib/style/colors';

// Phase 1.6/1.7 — desk monitors. Hand-built primitives only.
// Materials per `lighting-plan.svg` MATERIALS section (emissive-flat fix):
//   - Monitor 1 screen: MeshStandardMaterial · emissive SIGNAL_AMBER_DIM ·
//     intensity 1.2 · bloom target.
//   - Monitor 2 screen: MeshStandardMaterial · emissive VOXEL_GLOW_SOFT ·
//     intensity 1.0 · bloom target.
//
// `color` is set to BG_VOID so the unlit base reads dark — the emissive layer
// is what makes the screen "glow." `toneMapped: false` keeps the emissive
// values raw so the bloom layer can catch the luminance.
//
// Contact shadows (no-contact-shadow fix): bezel + stand both castShadow.

export type MonitorVariant = 'primary' | 'terminal';

interface MonitorProps {
  position: [number, number, number];
  variant: MonitorVariant;
  width?: number;
  height?: number;
}

const BEZEL_THICKNESS = 0.012;
const PANEL_DEPTH = 0.024;

export function Monitor({ position, variant, width = 0.62, height = 0.36 }: MonitorProps) {
  const isPrimary = variant === 'primary';
  const emissiveTint = isPrimary ? SIGNAL_AMBER_DIM : VOXEL_GLOW_SOFT;
  const emissiveIntensity = isPrimary ? 1.2 : 1.0;
  const tilt = isPrimary ? -0.06 : -0.04;

  return (
    <group position={position} rotation={[tilt, 0, 0]}>
      {/* Bezel — thin housing around the screen */}
      <mesh castShadow>
        <boxGeometry args={[width, height, PANEL_DEPTH]} />
        <meshStandardMaterial color={BG_PANEL_2} roughness={0.55} metalness={0.35} />
      </mesh>

      {/* Screen — dark base, emissive content tone. Sits 1mm proud of bezel. */}
      <mesh position={[0, 0, PANEL_DEPTH / 2 + 0.001]}>
        <planeGeometry args={[width - BEZEL_THICKNESS * 2, height - BEZEL_THICKNESS * 2]} />
        <meshStandardMaterial
          color={BG_VOID}
          emissive={emissiveTint}
          emissiveIntensity={emissiveIntensity}
          roughness={1}
          metalness={0}
          toneMapped={false}
        />
      </mesh>

      {/* Stand neck */}
      <mesh castShadow position={[0, -height / 2 - 0.06, -0.02]}>
        <cylinderGeometry args={[0.012, 0.014, 0.12, 12]} />
        <meshStandardMaterial color={INK_GHOST} roughness={0.6} metalness={0.5} />
      </mesh>

      {/* Foot */}
      <mesh castShadow position={[0, -height / 2 - 0.12, -0.02]}>
        <cylinderGeometry args={[0.09, 0.11, 0.012, 24]} />
        <meshStandardMaterial color={INK_GHOST} roughness={0.5} metalness={0.55} />
      </mesh>
    </group>
  );
}
