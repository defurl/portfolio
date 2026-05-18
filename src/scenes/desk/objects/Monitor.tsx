import { BG_PANEL_2, INK_GHOST, SIGNAL_AMBER_DIM, VOXEL_GLOW_SOFT } from '../../../lib/style/colors';

// Phase 1.6/1.7 — desk monitors.
// Hand-built primitives only: a thin bezel box + a slightly inset emissive
// screen plane + a small stand. Targeting a ~24" monitor for primary, ~22"
// secondary. The screen is the recognizable element; the rest exists to
// silhouette correctly and not steal attention.
//
// Two emissive tints map to the two monitors' roles:
// - Monitor 1 (projects): SIGNAL_AMBER_DIM — hints at the warm content beyond.
// - Monitor 2 (terminal): VOXEL_GLOW_SOFT — colder, more rolling-log coded.

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
  const emissive = variant === 'primary' ? SIGNAL_AMBER_DIM : VOXEL_GLOW_SOFT;
  // Primary monitor is slightly tilted back; secondary sits flatter.
  const tilt = variant === 'primary' ? -0.06 : -0.04;

  return (
    <group position={position} rotation={[tilt, 0, 0]}>
      {/* Bezel / panel housing */}
      <mesh castShadow>
        <boxGeometry args={[width, height, PANEL_DEPTH]} />
        <meshStandardMaterial color={BG_PANEL_2} roughness={0.55} metalness={0.35} />
      </mesh>

      {/* Inset emissive screen — sits ~2mm proud of the bezel front face. */}
      <mesh position={[0, 0, PANEL_DEPTH / 2 + 0.001]}>
        <planeGeometry args={[width - BEZEL_THICKNESS * 2, height - BEZEL_THICKNESS * 2]} />
        <meshStandardMaterial
          color={emissive}
          emissive={emissive}
          emissiveIntensity={variant === 'primary' ? 0.55 : 0.4}
          roughness={1}
          metalness={0}
          toneMapped={false}
        />
      </mesh>

      {/* Stand neck — short cylinder behind/below the bezel. */}
      <mesh position={[0, -height / 2 - 0.06, -0.02]}>
        <cylinderGeometry args={[0.012, 0.014, 0.12, 12]} />
        <meshStandardMaterial color={INK_GHOST} roughness={0.6} metalness={0.5} />
      </mesh>

      {/* Foot — flat disc. */}
      <mesh position={[0, -height / 2 - 0.12, -0.02]}>
        <cylinderGeometry args={[0.09, 0.11, 0.012, 24]} />
        <meshStandardMaterial color={INK_GHOST} roughness={0.5} metalness={0.55} />
      </mesh>
    </group>
  );
}
