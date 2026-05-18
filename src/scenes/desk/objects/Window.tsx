import { BG_NIGHT, BG_PANEL_2, RAIN_STREAK, VOXEL_GLOW_SOFT } from '../../../lib/style/colors';

// Phase 1.6 — window frame to the right of the desk. Tall vertical
// rectangle, dark frame, a single glass plane with a placeholder cool
// tint (rain shader lands in 1.18 of the prompt — Checkpoint B time).
// In Checkpoint A this exists so the rim light has a visual source and
// the right side of the frame reads as "out there is a city."

interface WindowProps {
  position: [number, number, number];
}

const W = 0.7;
const H = 1.0;
const FRAME_T = 0.04;
const DEPTH = 0.06;

export function Window({ position }: WindowProps) {
  return (
    <group position={position} rotation={[0, -Math.PI / 2, 0]}>
      {/* Frame: build as four boxes (top/bottom/left/right) so the
          glass plane sits inside a real opening. */}
      {/* Top */}
      <mesh castShadow position={[0, H / 2 - FRAME_T / 2, 0]}>
        <boxGeometry args={[W, FRAME_T, DEPTH]} />
        <meshStandardMaterial color={BG_PANEL_2} roughness={0.7} metalness={0.15} />
      </mesh>
      {/* Bottom */}
      <mesh castShadow position={[0, -H / 2 + FRAME_T / 2, 0]}>
        <boxGeometry args={[W, FRAME_T, DEPTH]} />
        <meshStandardMaterial color={BG_PANEL_2} roughness={0.7} metalness={0.15} />
      </mesh>
      {/* Left */}
      <mesh castShadow position={[-W / 2 + FRAME_T / 2, 0, 0]}>
        <boxGeometry args={[FRAME_T, H - FRAME_T * 2, DEPTH]} />
        <meshStandardMaterial color={BG_PANEL_2} roughness={0.7} metalness={0.15} />
      </mesh>
      {/* Right */}
      <mesh castShadow position={[W / 2 - FRAME_T / 2, 0, 0]}>
        <boxGeometry args={[FRAME_T, H - FRAME_T * 2, DEPTH]} />
        <meshStandardMaterial color={BG_PANEL_2} roughness={0.7} metalness={0.15} />
      </mesh>
      {/* Center mullion — horizontal divider, classic single-pane sash. */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[W - FRAME_T * 2, FRAME_T * 0.4, DEPTH * 0.6]} />
        <meshStandardMaterial color={BG_PANEL_2} roughness={0.7} metalness={0.15} />
      </mesh>

      {/* Glass — cool-tinted plane suggesting night sky. Rain shader
          replaces this material in Checkpoint B (1.18). */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[W - FRAME_T * 2, H - FRAME_T * 2]} />
        <meshStandardMaterial
          color={VOXEL_GLOW_SOFT}
          emissive={BG_NIGHT}
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Three faint vertical streaks to suggest rain even before the shader.
          Will be removed in Checkpoint B when the real rain shader lands. */}
      {[-0.18, 0.04, 0.21].map((x, i) => (
        <mesh key={`streak-${i}`} position={[x, -0.05 + i * 0.07, 0.003]}>
          <planeGeometry args={[0.004, 0.4]} />
          <meshBasicMaterial color={RAIN_STREAK} transparent opacity={0.35} />
        </mesh>
      ))}
    </group>
  );
}
