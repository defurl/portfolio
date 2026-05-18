import { BG_PANEL, INK_GHOST, LAMP_WARM, SIGNAL_AMBER_HOT } from '../../../lib/style/colors';

// Phase 1.6 — articulated desk lamp. Base + two-segment arm + cylindrical
// shade with an emissive bulb visible through the open bottom.
// The PointLight that drives the scene's key light lives in DeskScene's
// lighting setup; the geometry here is purely visual — the lamp arm
// position and the light position must agree visually (see lighting.ts).

interface LampProps {
  position: [number, number, number]; // base position
}

const BASE_R = 0.07;
const BASE_H = 0.02;
const ARM1_LEN = 0.32;
const ARM2_LEN = 0.28;
const SHADE_TOP_R = 0.05;
const SHADE_BOT_R = 0.075;
const SHADE_H = 0.08;

export function Lamp({ position }: LampProps) {
  return (
    <group position={position}>
      {/* Base — flat disc */}
      <mesh castShadow position={[0, BASE_H / 2, 0]}>
        <cylinderGeometry args={[BASE_R, BASE_R * 1.05, BASE_H, 32]} />
        <meshStandardMaterial color={BG_PANEL} roughness={0.55} metalness={0.45} />
      </mesh>

      {/* Lower arm — angled forward and up. */}
      <group position={[0, BASE_H, 0]} rotation={[0.55, 0, 0]}>
        <mesh castShadow position={[0, ARM1_LEN / 2, 0]}>
          <cylinderGeometry args={[0.009, 0.011, ARM1_LEN, 12]} />
          <meshStandardMaterial color={INK_GHOST} roughness={0.5} metalness={0.6} />
        </mesh>
        {/* Elbow joint */}
        <mesh position={[0, ARM1_LEN, 0]}>
          <sphereGeometry args={[0.014, 16, 16]} />
          <meshStandardMaterial color={INK_GHOST} roughness={0.4} metalness={0.65} />
        </mesh>

        {/* Upper arm — angled forward, slightly downward toward the desk. */}
        <group position={[0, ARM1_LEN, 0]} rotation={[-1.2, 0, 0]}>
          <mesh castShadow position={[0, ARM2_LEN / 2, 0]}>
            <cylinderGeometry args={[0.008, 0.009, ARM2_LEN, 12]} />
            <meshStandardMaterial color={INK_GHOST} roughness={0.5} metalness={0.6} />
          </mesh>

          {/* Shade — narrow opening points down/forward to make a pool on the desk */}
          <group position={[0, ARM2_LEN, 0]} rotation={[0.7, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[SHADE_TOP_R, SHADE_BOT_R, SHADE_H, 24, 1, true]} />
              <meshStandardMaterial
                color={BG_PANEL}
                roughness={0.6}
                metalness={0.35}
                side={2}
              />
            </mesh>
            {/* Top cap so we don't see the bulb from the back */}
            <mesh position={[0, SHADE_H / 2 + 0.001, 0]}>
              <cylinderGeometry args={[SHADE_TOP_R, SHADE_TOP_R, 0.004, 24]} />
              <meshStandardMaterial color={BG_PANEL} roughness={0.6} metalness={0.35} />
            </mesh>
            {/* Bulb — emissive sphere just inside the bottom opening. This is
                the bright source we'll selectively bloom in 1.3. */}
            <mesh position={[0, -SHADE_H / 2 + 0.02, 0]}>
              <sphereGeometry args={[0.022, 16, 16]} />
              <meshStandardMaterial
                color={SIGNAL_AMBER_HOT}
                emissive={LAMP_WARM}
                emissiveIntensity={4}
                toneMapped={false}
              />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
