import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { type Points as ThreePoints } from 'three';
import {
  BG_PANEL,
  BG_PANEL_2,
  INK_GHOST,
  LAMP_WARM,
} from '../../lib/style/colors';
import { useSceneStore } from '../../lib/stores/sceneStore';
import { DISTRICT_DEFS, type District } from '../../lib/content/buildings';

// Voxel City Streetscape Network
// Builds paved roadways, elevated sidewalks, concrete streetlight posts,
// blocky pixel-art voxel trees, and looping vehicle traffic particles.
// Gives Voxel City a rich, dense, and "lived-in" 3D island aesthetic.

const TRAFFIC_COUNT = 48;

export function CityStreetscape() {
  const trafficRef = useRef<ThreePoints>(null);

  // 1. Sidewalk and Road Coordinates
  const { roads, sidewalks, trees, lanterns } = useMemo(() => {
    const rd: Array<{ pos: [number, number, number]; size: [number, number] }> = [];
    const sd: Array<{ pos: [number, number, number]; size: [number, number] }> = [];
    const tr: Array<[number, number, number]> = [];
    const ln: Array<[number, number, number, boolean]> = []; // [x, y, z, leftSide]

    // Paved North-South Avenues parallel to the river (river is at x=0, width 8m)
    // Left Avenue at x = -7m, Right Avenue at x = 7m (width 4m)
    rd.push({ pos: [-7, 0.01, 0], size: [4, 120] });
    rd.push({ pos: [7, 0.01, 0], size: [4, 120] });

    // Paved East-West Streets connecting districts (at z = -22.5, z = 0, z = 22.5)
    rd.push({ pos: [0, 0.005, -22.5], size: [48, 4] });
    rd.push({ pos: [0, 0.005, 0], size: [48, 4] });
    rd.push({ pos: [0, 0.005, 22.5], size: [48, 4] });

    // Sidewalk slabs surrounding the five district blocks
    const districts = Object.keys(DISTRICT_DEFS) as District[];
    for (const d of districts) {
      const def = DISTRICT_DEFS[d];
      const [cx, cz] = def.center;
      const [sx, sz] = def.size;

      // Elevated sidewalk block (outer frame, slightly larger than size)
      sd.push({ pos: [cx, 0.04, cz], size: [sx + 2, sz + 2] });

      // Deterministic Voxel Trees along the sidewalk perimeter
      const step = 6;
      // North and South perimeters
      for (let x = cx - sx / 2; x <= cx + sx / 2; x += step) {
        tr.push([x, 0.08, cz - sz / 2 - 0.6]);
        tr.push([x, 0.08, cz + sz / 2 + 0.6]);
      }
      // East and West perimeters
      for (let z = cz - sz / 2; z <= cz + sz / 2; z += step) {
        tr.push([cx - sx / 2 - 0.6, 0.08, z]);
        tr.push([cx + sx / 2 + 0.6, 0.08, z]);
      }

      // Voxel Lantern posts placed at corners
      ln.push([cx - sx / 2 - 0.5, 0.08, cz - sz / 2 - 0.5, true]);
      ln.push([cx + sx / 2 + 0.5, 0.08, cz - sz / 2 - 0.5, false]);
      ln.push([cx - sx / 2 - 0.5, 0.08, cz + sz / 2 + 0.5, true]);
      ln.push([cx + sx / 2 + 0.5, 0.08, cz + sz / 2 + 0.5, false]);
    }

    return { roads: rd, sidewalks: sd, trees: tr, lanterns: ln };
  }, []);

  // 2. Loop-Traffic Particles (Headlights & Taillights)
  const [trafficPositions, trafficColors] = useMemo(() => {
    const pos = new Float32Array(TRAFFIC_COUNT * 3);
    const col = new Float32Array(TRAFFIC_COUNT * 3);

    for (let i = 0; i < TRAFFIC_COUNT; i++) {
      // Alternate left avenue (flowing south, red) and right avenue (flowing north, yellow)
      const isRight = i % 2 === 0;
      pos[i * 3 + 0] = isRight ? 7.0 + (Math.random() - 0.5) * 1.5 : -7.0 + (Math.random() - 0.5) * 1.5;
      pos[i * 3 + 1] = 0.12; // slightly elevated above street level
      pos[i * 3 + 2] = (Math.random() - 0.5) * 120.0;

      // Color: Red taillights (flowing south) or Yellow/Amber headlights (flowing north)
      if (isRight) {
        // Yellow/Amber (#FFD27A)
        col[i * 3 + 0] = 1.0;
        col[i * 3 + 1] = 0.82;
        col[i * 3 + 2] = 0.48;
      } else {
        // Red (#F87171)
        col[i * 3 + 0] = 0.97;
        col[i * 3 + 1] = 0.44;
        col[i * 3 + 2] = 0.44;
      }
    }

    return [pos, col];
  }, []);

  // 3. Traffic animation loop
  useFrame((_, dt) => {
    const traffic = trafficRef.current;
    if (!traffic) return;

    const reduced = useSceneStore.getState().prefersReducedMotion;
    if (reduced) return;

    const pos = traffic.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < TRAFFIC_COUNT; i++) {
      const idx = i * 3;
      const isRight = i % 2 === 0;

      // Flowing speed
      const speed = isRight ? 12.0 : -12.0; // m/s
      pos[idx + 2] += speed * dt;

      // Wrap around roads bounds (120m length)
      if (pos[idx + 2] > 60) {
        pos[idx + 2] = -60;
      } else if (pos[idx + 2] < -60) {
        pos[idx + 2] = 60;
      }
    }

    traffic.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group>
      {/* Concrete Road Network */}
      {roads.map((r, i) => (
        <mesh key={`road-${i}`} position={r.pos} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={r.size} />
          <meshStandardMaterial
            color={BG_PANEL} // Concrete slate charcoal
            roughness={0.9}
            metalness={0.0}
          />
        </mesh>
      ))}

      {/* Elevated District Sidewalks */}
      {sidewalks.map((s, i) => (
        <mesh key={`sidewalk-${i}`} position={s.pos} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          {/* Sidewalk is slightly raised plane for aesthetic outline */}
          <planeGeometry args={s.size} />
          <meshStandardMaterial
            color={BG_PANEL_2} // Inset concrete
            roughness={0.85}
            metalness={0.05}
          />
        </mesh>
      ))}

      {/* Voxel Trees along perimeters */}
      {trees.map((t, i) => {
        // Simple pixel-art voxel tree: 1 column trunk + 1 green foliage cube
        return (
          <group key={`tree-${i}`} position={t}>
            {/* Trunk */}
            <mesh position={[0, 0.4, 0]} castShadow>
              <boxGeometry args={[0.25, 0.8, 0.25]} />
              <meshStandardMaterial color="#4A2F13" roughness={0.9} />
            </mesh>
            {/* Foliage */}
            <mesh position={[0, 0.9, 0]} castShadow>
              <boxGeometry args={[0.8, 0.8, 0.8]} />
              <meshStandardMaterial color="#2E6B3E" roughness={0.85} />
            </mesh>
          </group>
        );
      })}

      {/* Concrete Voxel Street Lantern Posts */}
      {lanterns.map((l, i) => {
        const [x, y, z, left] = l;
        const armX = left ? 0.25 : -0.25;
        const bulbX = armX * 1.6;
        return (
          <group key={`lantern-${i}`} position={[x, y, z]}>
            {/* Slim Concrete post */}
            <mesh position={[0, 1.25, 0]} castShadow>
              <boxGeometry args={[0.15, 2.5, 0.15]} />
              <meshStandardMaterial color={INK_GHOST} roughness={0.7} />
            </mesh>
            {/* Lantern arm */}
            <mesh position={[armX, 2.4, 0]}>
              <boxGeometry args={[0.5, 0.1, 0.15]} />
              <meshStandardMaterial color={INK_GHOST} />
            </mesh>
            {/* Glowing amber bulb */}
            <mesh position={[bulbX, 2.25, 0]}>
              <boxGeometry args={[0.2, 0.2, 0.2]} />
              <meshStandardMaterial
                color={LAMP_WARM}
                emissive={LAMP_WARM}
                emissiveIntensity={2.5}
                toneMapped={false}
              />
            </mesh>

            {/* Real pointLight at the bulb position to illuminate concrete post, trees, and ground */}
            <pointLight
              position={[bulbX, 2.2, 0]}
              color={LAMP_WARM}
              intensity={4.5}
              distance={14.0}
              decay={1.8}
            />
          </group>
        );
      })}


      {/* Vehicle Headlights and Taillights looping */}
      <points ref={trafficRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trafficPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[trafficColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.4}
          sizeAttenuation
          transparent
          opacity={0.9}
          vertexColors
          depthWrite={false}
          toneMapped={false}
        />
      </points>
    </group>
  );
}
