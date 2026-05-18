import { BG_PANEL } from '../../../lib/style/colors';

// Phase 1.5 — the desktop.
// Targeting ~1.8m × 0.9m of matte dark wood. Uses a thin box (not a plane)
// so the front edge catches the lamp's rim and reads as a real surface
// rather than a cardboard cutout. Procedural noise is skipped for v1 (P2
// candidate; the lamp falloff alone gives plenty of variation in tone).
//
// Origin sits at the top-front edge of the desk so child objects can be
// positioned at `y ≈ 0` and sit naturally on the surface.
const WIDTH = 1.8;
const DEPTH = 0.9;
const THICKNESS = 0.04;

export function DeskSurface() {
  return (
    <mesh
      castShadow
      receiveShadow
      position={[0, -THICKNESS / 2, -DEPTH / 2 + 0.3]}
    >
      <boxGeometry args={[WIDTH, THICKNESS, DEPTH]} />
      <meshStandardMaterial color={BG_PANEL} roughness={0.85} metalness={0.04} />
    </mesh>
  );
}
