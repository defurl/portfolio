import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { type Points as ThreePoints, MathUtils } from 'three';
import { useSceneStore } from '../../lib/stores/sceneStore';

// Twinkling Starry Sky Field
// Procedurally distributes 150 glowing star points over the upper hemisphere
// at a radius of 170m, and gently modulates their opacity.

const STAR_COUNT = 150;
const RADIUS = 170;

export function Stars() {
  const pointsRef = useRef<ThreePoints>(null);

  const [positions, phases] = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    const ph = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      // Uniform distribution on upper hemisphere
      const theta = Math.random() * Math.PI * 2; // azimuth
      const phi = Math.acos(Math.random());     // elevation [0 .. PI/2] (upper only)

      pos[i * 3 + 0] = RADIUS * Math.sin(phi) * Math.cos(theta); // x
      pos[i * 3 + 1] = RADIUS * Math.cos(phi);                  // y (always positive)
      pos[i * 3 + 2] = RADIUS * Math.sin(phi) * Math.sin(theta); // z

      ph[i] = Math.random() * Math.PI * 2; // individual phase offset for twinkling
    }

    return [pos, ph];
  }, []);

  useFrame((state) => {
    const points = pointsRef.current;
    if (!points) return;

    const reduced = useSceneStore.getState().prefersReducedMotion;
    if (reduced) return; // freeze twinkling when motion is reduced

    const time = state.clock.getElapsedTime();
    const sizes = points.geometry.attributes.size;
    if (!sizes) return;

    const sizeArray = sizes.array as Float32Array;

    for (let i = 0; i < STAR_COUNT; i++) {
      // Modulate size/opacity of each star individually over time
      sizeArray[i] = 0.5 + Math.sin(time * 2.0 + phases[i]!) * 0.35;
    }

    sizes.needsUpdate = true;
  });

  // Create a float32 array for size attribute so we can update sizes individually
  const initialSizes = useMemo(() => {
    const arr = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) arr[i] = MathUtils.randFloat(0.3, 0.85);
    return arr;
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[initialSizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        color="#EDE6D3" // warm starry ivory
        size={0.6}
        sizeAttenuation
        transparent
        opacity={0.7}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}
