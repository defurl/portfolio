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
  MONITOR_FILL_ANGLE,
  MONITOR_FILL_DECAY,
  MONITOR_FILL_DISTANCE,
  MONITOR_FILL_INTENSITY,
  MONITOR_FILL_PENUMBRA,
  MONITOR_FILL_POSITIONS,
  MONITOR_FILL_TARGETS,
  WINDOW_RIM_INTENSITY,
  WINDOW_RIM_POSITION,
  WINDOW_RIM_TARGET,
} from './lighting';
import { DeskSurface } from './objects/DeskSurface';
import { Lamp } from './objects/Lamp';
import { Monitor } from './objects/Monitor';
import { Window } from './objects/Window';
import { Keyboard } from './objects/Keyboard';
import { Mug } from './objects/Mug';
import { Plant } from './objects/Plant';
import { Headphones } from './objects/Headphones';
import { Notebook } from './objects/Notebook';
import { Phone } from './objects/Phone';
import { BloomLayer } from './postfx/BloomLayer';

// The Night Desk scene. All eleven objects (10 visible + door-spill light)
// per the revision prompt order-of-operations §3–§7.
//
// Lighting per `lighting-plan.svg` with revision-tuned values noted in
// `lighting.ts`: KEY at intensity 8, distance 2.8 (was 2.0 — extends pool
// to keyboard zone); FILL ×2 as SpotLights aimed at the keyboard (was
// PointLights, which puddled on the desk); RIM directional; DOOR SPILL
// pulled in to z=+0.5 with intensity 3.5 so it reads as a distinct source
// separated from the lamp's own floor pool.
export function DeskScene() {
  // Directional rim light needs a Three.js Object3D as its `.target`.
  const rimTarget = useMemo(() => {
    const o = new Object3D();
    o.position.set(...(WINDOW_RIM_TARGET as unknown as [number, number, number]));
    return o;
  }, []);

  // SpotLight targets for monitor fills — one per fill, persistent.
  const monitorFillTargets = useMemo(
    () =>
      MONITOR_FILL_TARGETS.map(t => {
        const o = new Object3D();
        o.position.set(...(t as unknown as [number, number, number]));
        return o;
      }),
    [],
  );

  return (
    <>
      {/* Ambient — barely there. BG_NIGHT carries the dark-room base tone. */}
      <ambientLight intensity={AMBIENT_INTENSITY} color={BG_NIGHT} />

      {/* KEY — desk lamp. The brightest source and the only shadow-caster. */}
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

      {/* FILL — cool monitor glow as SpotLights aimed at the keyboard zone.
          The cone (~34°, soft penumbra) drops the cyan onto the front faces
          of objects rather than puddling on the desk surface behind them. */}
      {MONITOR_FILL_POSITIONS.map((pos, i) => (
        <group key={`monitor-fill-${i}`}>
          <primitive object={monitorFillTargets[i]} />
          <spotLight
            position={pos as unknown as [number, number, number]}
            target={monitorFillTargets[i]}
            color={VOXEL_GLOW}
            intensity={MONITOR_FILL_INTENSITY}
            distance={MONITOR_FILL_DISTANCE}
            decay={MONITOR_FILL_DECAY}
            angle={MONITOR_FILL_ANGLE}
            penumbra={MONITOR_FILL_PENUMBRA}
          />
        </group>
      ))}

      {/* RIM — cool window directional. */}
      <primitive object={rimTarget} />
      <directionalLight
        position={WINDOW_RIM_POSITION as unknown as [number, number, number]}
        color={VOXEL_GLOW_SOFT}
        intensity={WINDOW_RIM_INTENSITY}
        target={rimTarget}
      />

      {/* DOOR SPILL — off-frame warm. */}
      <pointLight
        position={DOOR_SPILL_POSITION as unknown as [number, number, number]}
        color={LAMP_WARM}
        intensity={DOOR_SPILL_INTENSITY}
        distance={DOOR_SPILL_DISTANCE}
        decay={DOOR_SPILL_DECAY}
      />

      {/* Floor — 10m × 10m, BG_PANEL, receiveShadow. 74cm below desk top. */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.74, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color={BG_PANEL} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Back wall — built as four segments around the window opening so the
          window reads as a real cutout. The city-beyond plane (inside the
          Window component) sits behind the wall plane and is visible only
          through the gap. Wall: 3m × 2.5m at z=-1.2, centered y=0.51,
          spanning x=-1.5..+1.5 and y=-0.74..+1.76. Window opening: 0.7m × 1m
          centered at (1.0, 1.0), so opening spans x=0.65..1.35, y=0.5..1.5. */}
      {/* Left section — from x=-1.5 to x=0.65 */}
      <mesh receiveShadow position={[-0.425, 0.51, -1.2]}>
        <planeGeometry args={[2.15, 2.5]} />
        <meshStandardMaterial color={BG_PANEL} roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Right section — from x=1.35 to x=1.5 */}
      <mesh receiveShadow position={[1.425, 0.51, -1.2]}>
        <planeGeometry args={[0.15, 2.5]} />
        <meshStandardMaterial color={BG_PANEL} roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Above window — from y=1.5 to y=1.76, across the window's x range */}
      <mesh receiveShadow position={[1.0, 1.63, -1.2]}>
        <planeGeometry args={[0.7, 0.26]} />
        <meshStandardMaterial color={BG_PANEL} roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Below window — from y=-0.74 to y=0.5, across the window's x range */}
      <mesh receiveShadow position={[1.0, -0.12, -1.2]}>
        <planeGeometry args={[0.7, 1.24]} />
        <meshStandardMaterial color={BG_PANEL} roughness={0.85} metalness={0.05} />
      </mesh>

      <DeskSurface />
      <Lamp
        position={[LAMP_POSITION[0], 0, LAMP_POSITION[2]]}
        bulbPosition={LAMP_POSITION as unknown as [number, number, number]}
      />

      {/* Object Y positions are all foot-on-desk — i.e., position.y equals
          the offset from the group origin down to the object's lowest point
          so each base lands on the desk top (y=0). Monitor stand foot sits
          0.306m below its group origin for a 0.36m-tall bezel (foot offset
          = height/2 + 0.12), so Monitor 1 sits at y=0.306; Monitor 2 with
          a 0.3m bezel sits at y=0.27. Keyboard's lower body extends 0.011m
          below the plate's group origin, so y=0.011 puts the keyboard's
          lowest face on the desk. All others (Mug/Phone/Plant/Notebook)
          have group origin = base, so y=0. */}
      <Monitor variant="primary" position={[-0.3, 0.306, -0.4]} />
      <Monitor variant="terminal" position={[0.5, 0.27, -0.4]} width={0.5} height={0.3} />
      {/* Window mounted on the BACK wall (z=-1.18, 2cm in front of the wall
          at z=-1.2 to avoid z-fighting). x=1.0 keeps the 0.7m-wide window
          fully on the 3m-wide back wall (which spans x=-1.5..+1.5).
          No rotation — the window faces the camera. */}
      <Window position={[1.0, 1.0, -1.18]} />

      <Keyboard position={[0, 0.011, 0.2]} />
      {/* Mug pulled from z=0.35 (5cm past desk front edge z=+0.3, hanging
          off the desk) to z=0.15 so it sits fully on the desk top. */}
      <Mug position={[-0.55, 0, 0.15]} />
      {/* Notebook moved from [-0.05, 0.025, 0.4] (off desk front edge at z=0.3,
          0.245m deep — half hung in space) to [-0.4, 0, 0.05] so it sits
          fully on the desk to the camera-left of the keyboard, behind the mug. */}
      <Notebook position={[-0.4, 0, 0.05]} />
      <Plant position={[-0.8, 0, 0.1]} />
      {/* Headphones group rotates by PI/2 around X (cups face camera), so the
          cup radius (0.045) extends downward in world Y after rotation —
          group origin needs to sit one radius above the desk. */}
      <Headphones position={[0.85, 0.045, 0.15]} />
      <Phone position={[1.0, 0, -0.05]} />

      <BloomLayer />
    </>
  );
}
