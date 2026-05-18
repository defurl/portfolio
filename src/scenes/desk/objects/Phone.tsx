import { BG_VOID, INK_GHOST } from '../../../lib/style/colors';

// Phase 1.6 — phone face-down on the desk. ~150×75mm, very thin.
// Face-down is deliberate per CONTEXT.md: the visitor has to flip it
// (Checkpoint B) to reveal contact. v1 ships the static face-down state
// and the flip animation lives in 1.17.

interface PhoneProps {
  position: [number, number, number];
}

const W = 0.075;
const D = 0.15;
const H = 0.008;

export function Phone({ position }: PhoneProps) {
  return (
    <group position={position} rotation={[0, -0.15, 0]}>
      <mesh castShadow position={[0, H / 2, 0]}>
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial color={BG_VOID} roughness={0.25} metalness={0.5} />
      </mesh>
      {/* Camera bump — small raised square on the back (now facing up). */}
      <mesh position={[W * 0.28, H + 0.002, -D * 0.32]}>
        <boxGeometry args={[0.018, 0.003, 0.018]} />
        <meshStandardMaterial color={INK_GHOST} roughness={0.3} metalness={0.65} />
      </mesh>
    </group>
  );
}
