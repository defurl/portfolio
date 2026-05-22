import { BG_PANEL, INK_GHOST } from '../../../lib/style/colors';

// Phase 1.5 (revised) — actual desk: 2.0m wide × 0.9m deep × 4cm thick top
// elevated 74cm above the floor by four legs. Width bumped to 2.0m (was 1.8m)
// so the lamp at x=-0.95 sits ON the desk per owner intent.
//
// Convention: y=0 is the desk-top surface. Object positions (mug y=0.06,
// notebook y=0.025, etc.) place items above this plane. The floor sits at
// y=-0.74 so the desk reads as a real surface, not a slab on the floor.
//
// Origin is centered on the desk top: x∈[-1.0, 1.0], z∈[-0.45, 0.45].
const WIDTH = 2.0;
const DEPTH = 0.9;
const TOP_THICKNESS = 0.04;
const LEG_RADIUS = 0.025;
const LEG_INSET = 0.06; // distance from desk edge to leg centerline

const FLOOR_Y = -0.74;
const LEG_TOP = -TOP_THICKNESS; // bottom of the desk top
const LEG_BOTTOM = FLOOR_Y;
const LEG_CENTER_Y = (LEG_TOP + LEG_BOTTOM) / 2;
const LEG_LEN = LEG_TOP - LEG_BOTTOM;

const LEG_X = WIDTH / 2 - LEG_INSET; // ±0.94
const LEG_Z_BACK = -DEPTH / 2 + LEG_INSET; // -0.39 — but desk centered at z=-0.15 below
const LEG_Z_FRONT = DEPTH / 2 - LEG_INSET; // +0.39

// Desk top sits centered at z = -0.15 + 0 = -0.15 (top spans z=-0.6..z=0.3).
const TOP_Z = -DEPTH / 2 + 0.3;

export function DeskSurface() {
  return (
    <group>
      {/* Top — flat slab. Receives shadows from objects placed on it. */}
      <mesh
        castShadow
        receiveShadow
        position={[0, -TOP_THICKNESS / 2, TOP_Z]}
      >
        <boxGeometry args={[WIDTH, TOP_THICKNESS, DEPTH]} />
        <meshStandardMaterial color={BG_PANEL} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Four legs — slim cylinders, dark-metal coded, inset from corners.
          Y-centered halfway between the top's underside and the floor. */}
      {[
        [-LEG_X, TOP_Z + LEG_Z_BACK],
        [LEG_X, TOP_Z + LEG_Z_BACK],
        [-LEG_X, TOP_Z + LEG_Z_FRONT],
        [LEG_X, TOP_Z + LEG_Z_FRONT],
      ].map(([x, z], i) => (
        <mesh key={`leg-${i}`} castShadow position={[x, LEG_CENTER_Y, z]}>
          <cylinderGeometry args={[LEG_RADIUS, LEG_RADIUS, LEG_LEN, 16]} />
          <meshStandardMaterial color={INK_GHOST} roughness={0.4} metalness={0.7} />
        </mesh>
      ))}
    </group>
  );
}
