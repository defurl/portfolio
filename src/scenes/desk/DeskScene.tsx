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
import { DeskSurface } from './objects/DeskSurface';
import { Monitor } from './objects/Monitor';
import { Keyboard } from './objects/Keyboard';
import { Mug } from './objects/Mug';
import { Plant } from './objects/Plant';
import { Headphones } from './objects/Headphones';
import { Notebook } from './objects/Notebook';
import { Phone } from './objects/Phone';
import { Lamp } from './objects/Lamp';
import { Window } from './objects/Window';
import { BloomLayer } from './postfx/BloomLayer';

// The Night Desk scene root. Camera is positioned in DeskRoute.
//
// Lighting design (Phase 1.2):
// - Key: warm desk lamp (LAMP_WARM) — eye lands here first.
// - Fill: cool monitor glow, two PointLights, low intensity.
// - Rim: cool window light, DirectionalLight, ~15% of key.
// - Ambient: nearly zero — objects defined by key/fill/rim, not flood.
// - Door spill: warm pool on the floor camera-left, hints at the off-frame door.
//
// Object roster (Phase 1.6) — eleven elements, hand-built primitives, no GLB:
// monitors, keyboard, mug, plant, headphones, notebook, phone, lamp, window,
// desk surface, and the door-spill light (no geometry).
export function DeskScene() {
  return (
    <>
      <ambientLight intensity={AMBIENT_INTENSITY} color={BG_NIGHT} />

      {/* Key — warm desk lamp. */}
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

      {/* Rim — cool window light. */}
      <directionalLight
        position={WINDOW_RIM_DIRECTION as unknown as [number, number, number]}
        intensity={WINDOW_RIM_INTENSITY}
        color={VOXEL_GLOW_SOFT}
      />

      {/* Door spill — warm pool on floor camera-left. */}
      <pointLight
        position={DOOR_SPILL_POSITION as unknown as [number, number, number]}
        intensity={DOOR_SPILL_INTENSITY}
        color={LAMP_WARM}
        distance={DOOR_SPILL_DISTANCE}
        decay={DOOR_SPILL_DECAY}
      />

      {/* Floor — receives the door spill and the lamp's long falloff. */}
      <mesh receiveShadow position={[0, -0.02, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color={BG_NIGHT} roughness={0.95} metalness={0.02} />
      </mesh>

      {/* Desk + objects. Positions per Phase 1.6 table — tuned visually. */}
      <DeskSurface />
      <Monitor variant="primary" position={[-0.3, 0.55, -0.4]} />
      <Monitor variant="terminal" position={[0.5, 0.55, -0.4]} width={0.5} height={0.3} />
      <Keyboard position={[0, 0.04, 0.2]} />
      <Mug position={[0.55, 0.06, 0.35]} />
      <Plant position={[-0.7, 0.12, 0.3]} />
      <Headphones position={[0.6, 0.05, 0.05]} />
      <Notebook position={[-0.55, 0.025, 0.1]} />
      <Phone position={[0.7, 0.012, -0.05]} />
      <Lamp position={[0.9, 0, -0.2]} />
      <Window position={[1.2, 1.0, -0.6]} />

      <BloomLayer />
    </>
  );
}
