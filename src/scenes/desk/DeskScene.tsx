import { useMemo } from 'react';
import { Object3D } from 'three';
import { BG_NIGHT, BG_PANEL, LAMP_WARM, VOXEL_GLOW, VOXEL_GLOW_SOFT } from '../../lib/style/colors';
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
  WINDOW_RIM_INTENSITY,
  WINDOW_RIM_POSITION,
  WINDOW_RIM_TARGET,
} from './lighting';
import { DeskSurface } from './objects/DeskSurface';
import { Lamp } from './objects/Lamp';
import { BloomLayer } from './postfx/BloomLayer';

// PHASE 1 REVISION — Lighting-only scene per `phase-1-revision-prompt.md`
// "new mandatory gate." Only floor + back wall + desk + lamp + 5 lights +
// bloom. No monitors, no keyboard, no other objects. The five acceptance
// criteria from `lighting-plan.svg` must read TRUE before anything else
// is added — that's the `mood-missing` failure tag's antidote.
//
// All values mirror `lighting-plan.svg` exactly. Colors route through
// `colors.ts` so `lint:colors` stays happy without losing token discipline.
export function DeskScene() {
  // Directional rim light needs a Three.js Object3D as its `.target` so that
  // the light points FROM `position` TOWARD that object. We create it once.
  const rimTarget = useMemo(() => {
    const o = new Object3D();
    o.position.set(...(WINDOW_RIM_TARGET as unknown as [number, number, number]));
    return o;
  }, []);

  return (
    <>
      {/* Ambient — barely there. BG_NIGHT carries the dark-room base tone. */}
      <ambientLight intensity={AMBIENT_INTENSITY} color={BG_NIGHT} />

      {/* KEY — desk lamp. The brightest source and the only shadow-caster
          (no-contact-shadow fix: one shadow caster keeps cost bounded). */}
      <pointLight
        position={LAMP_POSITION as unknown as [number, number, number]}
        color={LAMP_WARM}
        intensity={LAMP_INTENSITY}
        distance={LAMP_DISTANCE}
        decay={LAMP_DECAY}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />

      {/* FILL — cool monitor glow, one per screen. Even though monitors
          aren't placed yet, these lights belong to the lighting baseline. */}
      {MONITOR_FILL_POSITIONS.map((pos, i) => (
        <pointLight
          key={`monitor-fill-${i}`}
          position={pos as unknown as [number, number, number]}
          color={VOXEL_GLOW}
          intensity={MONITOR_FILL_INTENSITY}
          distance={MONITOR_FILL_DISTANCE}
          decay={MONITOR_FILL_DECAY}
        />
      ))}

      {/* RIM — cool window directional. Pointed at world origin so the
          right edge of every object catches the cool cast. */}
      <primitive object={rimTarget} />
      <directionalLight
        position={WINDOW_RIM_POSITION as unknown as [number, number, number]}
        color={VOXEL_GLOW_SOFT}
        intensity={WINDOW_RIM_INTENSITY}
        target={rimTarget}
      />

      {/* DOOR SPILL — off-frame warm. Hint of a corridor that never renders. */}
      <pointLight
        position={DOOR_SPILL_POSITION as unknown as [number, number, number]}
        color={LAMP_WARM}
        intensity={DOOR_SPILL_INTENSITY}
        distance={DOOR_SPILL_DISTANCE}
        decay={DOOR_SPILL_DECAY}
      />

      {/* Floor — 10m × 10m, BG_PANEL, receiveShadow. Closes the void-edge.
          Sits at y=-0.05 (5cm below desk-bottom) so the desk reads as a
          surface sitting above the floor rather than coplanar with it
          (which would z-fight where the desk-top and floor overlap). */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color={BG_PANEL} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Back wall — 3m × 2.5m at z=-1.2. Catches the rim light and stops
          the scene "ending" abruptly. */}
      <mesh receiveShadow position={[0, 1.25, -1.2]}>
        <planeGeometry args={[3, 2.5]} />
        <meshStandardMaterial color={BG_PANEL} roughness={0.85} metalness={0.05} />
      </mesh>

      <DeskSurface />
      {/* Lamp base sits on the FLOOR at y=-0.05 (the lamp is at x=-0.95,
          just past the desk's left edge — see lighting-plan.svg plan view). */}
      <Lamp
        position={[LAMP_POSITION[0], -0.05, LAMP_POSITION[2]]}
        bulbPosition={LAMP_POSITION as unknown as [number, number, number]}
      />

      <BloomLayer />
    </>
  );
}
