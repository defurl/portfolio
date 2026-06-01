import { BG_NIGHT, BG_VOID, VOXEL_GLOW_SOFT } from '../../lib/style/colors';
import { SkyDome } from './SkyDome';
import { River } from './River';
import { Buildings } from './Buildings';
import { CityStreetscape } from './CityStreetscape';
import { CityWaypoints } from './CityWaypoints';
import { Stars } from './Stars';
import { PulseController } from './PulseController';
import { CityBloom } from './postfx/CityBloom';
import { CityCameraDev } from './CityCameraDev';


// Phase 3 Checkpoint A — city foundation (High-Fidelity Visual Detailing Overhaul).
//
// Composition (top → bottom):
//   - SkyDome: large inverted sphere, vertex gradient
//   - Stars: Twinkling stellar field over upper hemisphere
//   - FogExp2: BG_NIGHT, density 0.012
//   - HemisphereLight: ambient haze
//   - DirectionalLight: top-down moonlight
//   - Ground plane: 200×200
//   - CityStreetscape: Roads, elevated sidewalks, voxel trees, lanterns, traffic loop
//   - River: elevated emissive strip at x=0
//   - Buildings: procedural Concrete Grid Skyscraper facades & roof assets
//   - CityBloom postfx: catches glow elements

export function CityScene() {
  return (
    <>
      <fog attach="fog" args={[BG_NIGHT, 0.012]} />

      <SkyDome />
      <Stars />

      <hemisphereLight
        color={BG_NIGHT}
        groundColor={VOXEL_GLOW_SOFT}
        intensity={0.35}
      />
      <ambientLight color={BG_VOID} intensity={0.05} />
      <directionalLight
        position={[10, 30, 5]}
        color={VOXEL_GLOW_SOFT}
        intensity={0.4}
        castShadow={false}
      />

      {/* Ground plane — 200×200, near-black with a sliver of emissive */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          color={BG_NIGHT}
          emissive={BG_NIGHT}
          emissiveIntensity={0.02}
          roughness={1}
          metalness={0}
        />
      </mesh>

      <CityStreetscape />
      <CityWaypoints />
      <River />


      <Buildings />
      <PulseController />

      <CityBloom />
      <CityCameraDev />
    </>
  );
}

