import { BG_NIGHT, BG_VOID, VOXEL_GLOW_SOFT } from '../../lib/style/colors';
import { SkyDome } from './SkyDome';
import { River } from './River';
import { CityBloom } from './postfx/CityBloom';
import { CityCameraDev } from './CityCameraDev';

// Phase 3 Checkpoint A — city foundation. No buildings yet; this is the
// lighting + atmosphere pass. The discipline mirrors Phase 1A: get the
// volumetric depth, the moonlight balance, and the river glow right before
// any geometry lands.
//
// Composition (top → bottom):
//   - SkyDome: large inverted sphere, vertex-position-driven gradient,
//     horizon color tracks marketStore.session, 6s lerp
//   - FogExp2: BG_NIGHT, density 0.012 — fades distant buildings into sky
//   - HemisphereLight: BG_NIGHT top, VOXEL_GLOW_SOFT bottom — ambient haze
//   - DirectionalLight: top-down moonlight, no shadow (geometry cost)
//   - Ground plane: 200×200, BG_NIGHT base, tiny emissive so it's not black
//   - River: thin emissive strip at x=0, z=[-60..+60]
//   - CityBloom postfx: catches river only

export function CityScene() {
  return (
    <>
      <fog attach="fog" args={[BG_NIGHT, 0.012]} />

      <SkyDome />

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

      {/* Ground plane — 200×200, near-black with a sliver of emissive so it
          never reads as pure black even outside the moonlight cone. */}
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

      <River />

      <CityBloom />
      <CityCameraDev />
    </>
  );
}
