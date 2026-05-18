import { BG_PANEL_2, DATA_GREEN, INK_GHOST } from '../../../lib/style/colors';

// Phase 1.6 — small desk plant. Cylindrical pot + 5–7 triangulated leaf
// planes radiating from the center with slight Y rotation each, gives a
// recognizable silhouette without going for botanical realism.
// Each leaf is darker on the underside and lighter on top to read with
// the lamp coming from above-right.

interface PlantProps {
  position: [number, number, number];
}

const POT_R_TOP = 0.045;
const POT_R_BOT = 0.038;
const POT_H = 0.07;
const LEAF_COUNT = 6;
const LEAF_LEN = 0.11;
const LEAF_WID = 0.045;

export function Plant({ position }: PlantProps) {
  const leaves: JSX.Element[] = [];
  for (let i = 0; i < LEAF_COUNT; i++) {
    const yaw = (i / LEAF_COUNT) * Math.PI * 2;
    const pitch = -0.55 - (i % 2) * 0.1; // alternating droop
    leaves.push(
      <mesh
        key={`leaf-${i}`}
        position={[
          Math.sin(yaw) * 0.018,
          POT_H + LEAF_LEN * 0.35,
          Math.cos(yaw) * 0.018,
        ]}
        rotation={[pitch, yaw, 0]}
      >
        <planeGeometry args={[LEAF_WID, LEAF_LEN]} />
        <meshStandardMaterial
          color={DATA_GREEN}
          roughness={0.85}
          metalness={0}
          side={2}
        />
      </mesh>,
    );
  }

  return (
    <group position={position}>
      {/* Pot */}
      <mesh castShadow position={[0, POT_H / 2, 0]}>
        <cylinderGeometry args={[POT_R_TOP, POT_R_BOT, POT_H, 24]} />
        <meshStandardMaterial color={BG_PANEL_2} roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Soil — flat dark disc inside the pot rim */}
      <mesh position={[0, POT_H - 0.002, 0]}>
        <cylinderGeometry args={[POT_R_TOP - 0.004, POT_R_TOP - 0.004, 0.004, 24]} />
        <meshStandardMaterial color={INK_GHOST} roughness={1} metalness={0} />
      </mesh>
      {leaves}
    </group>
  );
}
