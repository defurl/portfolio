import { BG_NIGHT, LAMP_WARM, VOXEL_GLOW, VOXEL_GLOW_SOFT } from '../../lib/style/colors';
import {
  AMBIENT_INTENSITY,
  DOOR_SPILL_DECAY,
  DOOR_SPILL_DISTANCE,
  DOOR_SPILL_INTENSITY,
  DOOR_SPILL_POSITION,
  LAMP_DECAY,
  LAMP_DISTANCE,
  LAMP_INTENSITY,
  LAMP_POSITION,
  MONITOR_FILL_DECAY,
  MONITOR_FILL_DISTANCE,
  MONITOR_FILL_INTENSITY,
  MONITOR_FILL_POSITIONS,
  WINDOW_RIM_DIRECTION,
  WINDOW_RIM_INTENSITY,
} from './lighting';

// The Night Desk scene root. Camera is positioned in DeskRoute; this component
// owns the lights and (in subsequent fixes) the desk surface + eleven objects.
//
// Lighting design (Phase 1.2):
// - Key: warm desk lamp (LAMP_WARM) — the eye should land here first.
// - Fill: cool monitor glow, two PointLights, low intensity.
// - Rim: cool window light, DirectionalLight, ~15% of key.
// - Ambient: nearly zero — objects defined by key/fill/rim, not flood.
// - Door spill: warm pool on the floor camera-left, hints at the off-frame door.
export function DeskScene() {
  return (
    <>
      <ambientLight intensity={AMBIENT_INTENSITY} color={BG_NIGHT} />

      {/* Key — warm desk lamp. The soul of the scene. */}
      <pointLight
        position={LAMP_POSITION as unknown as [number, number, number]}
        intensity={LAMP_INTENSITY}
        color={LAMP_WARM}
        distance={LAMP_DISTANCE}
        decay={LAMP_DECAY}
        castShadow
      />

      {/* Fill — cool monitor glow, one per screen. */}
      {MONITOR_FILL_POSITIONS.map((pos, i) => (
        <pointLight
          key={`monitor-fill-${i}`}
          position={pos as unknown as [number, number, number]}
          intensity={MONITOR_FILL_INTENSITY}
          color={VOXEL_GLOW}
          distance={MONITOR_FILL_DISTANCE}
          decay={MONITOR_FILL_DECAY}
        />
      ))}

      {/* Rim — cool window light, from camera-right and slightly behind. */}
      <directionalLight
        position={WINDOW_RIM_DIRECTION as unknown as [number, number, number]}
        intensity={WINDOW_RIM_INTENSITY}
        color={VOXEL_GLOW_SOFT}
      />

      {/* Door spill — warm pool on floor camera-left. No door geometry in v1;
          this light alone tells the user there's something off-frame. */}
      <pointLight
        position={DOOR_SPILL_POSITION as unknown as [number, number, number]}
        intensity={DOOR_SPILL_INTENSITY}
        color={LAMP_WARM}
        distance={DOOR_SPILL_DISTANCE}
        decay={DOOR_SPILL_DECAY}
      />

      {/* Floor — receives the door spill and the lamp's longest falloff.
          Sits below the desk; objects don't cast onto it yet (perf). */}
      <mesh receiveShadow position={[0, -0.02, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color={BG_NIGHT} roughness={0.95} metalness={0.02} />
      </mesh>
    </>
  );
}
