import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, Color, Matrix4, Vector3 } from 'three';
import type { InstancedMesh } from 'three';
import { SIGNAL_AMBER, VOXEL_GLOW } from '../../lib/style/colors';
import { useSceneStore } from '../../lib/stores/sceneStore';
import { useNnSettingsStore } from '../../lib/stores/nnSettingsStore';
import {
  GAP_LENGTH,
  HALL_HEIGHT,
  HALL_TOTAL_Z,
  HALL_WIDTH,
  LAYER_COUNT,
  LAYER_LENGTH,
} from './nnLighting';

// Phase 4B §4.9 — token-path particle splines.
//
// 3D CatmullRom curves wind down each corridor segment, weaving past the
// attention-head columns. Particles (small instanced points) travel along
// the curves to visualize a forward pass through the transformer.
//
// Performance:
//   - Particle pool sized for the highest-density mode, count gated by
//     U20 high-fi setting (Standard: 25%, High-Fi: 100%).
//   - Single instancedMesh draw call.
//   - Particles loop along the curve; no allocation per frame.
//
// Reduced motion (§4.11): particles freeze in place — we still render them
// at their last computed position so the visual presence remains, but
// nothing moves frame-to-frame.

const SPLINES_PER_LAYER = 2; // one curve per wall-row
const POOL_PER_SPLINE_HIFI = 80;
const POOL_PER_SPLINE_STANDARD = 20;
const PARTICLE_RADIUS = 0.1;
const PARTICLE_SPEED = 6.5; // m/s along curve length (approx)
const PARTICLE_BRIGHTNESS = 1.8; // multiplier on the base district color

function buildCurves(): CatmullRomCurve3[] {
  const out: CatmullRomCurve3[] = [];
  for (let layer = 0; layer < LAYER_COUNT; layer++) {
    const zStart = -(layer * (LAYER_LENGTH + GAP_LENGTH));
    const zEnd = zStart - LAYER_LENGTH;
    for (let r = 0; r < SPLINES_PER_LAYER; r++) {
      // Two splines offset in y; weave gently in x to flow past columns.
      const yBase = r === 0 ? HALL_HEIGHT * 0.35 : HALL_HEIGHT * 0.65;
      const points = [
        new Vector3(0, yBase, zStart - 0.5),
        new Vector3(HALL_WIDTH * 0.18 * (r === 0 ? 1 : -1), yBase + 0.3, zStart - LAYER_LENGTH * 0.25),
        new Vector3(0, yBase, zStart - LAYER_LENGTH * 0.5),
        new Vector3(HALL_WIDTH * 0.18 * (r === 0 ? -1 : 1), yBase - 0.3, zStart - LAYER_LENGTH * 0.75),
        new Vector3(0, yBase, zEnd + 0.5),
      ];
      out.push(new CatmullRomCurve3(points, false, 'catmullrom', 0.35));
    }
  }
  return out;
}

const COLOR_AMBER = new Color(SIGNAL_AMBER);
const COLOR_COOL = new Color(VOXEL_GLOW);

export function TokenSplines() {
  const meshRef = useRef<InstancedMesh>(null);
  const highFi = useNnSettingsStore((s) => s.highFi);

  const curves = useMemo(() => buildCurves(), []);
  const poolPerSpline = highFi ? POOL_PER_SPLINE_HIFI : POOL_PER_SPLINE_STANDARD;
  const totalCount = curves.length * poolPerSpline;

  // Per-particle state. `progress` is the curve parameter [0, 1).
  const particles = useMemo(() => {
    const arr: Array<{ curveIndex: number; progress: number; color: Color }> = [];
    for (let c = 0; c < curves.length; c++) {
      for (let p = 0; p < poolPerSpline; p++) {
        arr.push({
          curveIndex: c,
          progress: p / poolPerSpline, // evenly distribute initially
          color: c % 2 === 0 ? COLOR_AMBER : COLOR_COOL,
        });
      }
    }
    return arr;
  }, [curves, poolPerSpline]);

  // Pre-cache curve lengths (rough — CatmullRomCurve3.getLength).
  const curveLengths = useMemo(() => curves.map((c) => c.getLength()), [curves]);

  // Set base colors once on mount/highfi-change. Pre-multiply by the
  // brightness factor so the particles read as glowing rather than dim
  // matte spheres against the concrete.
  const colorScratch = useRef(new Color());
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < particles.length; i++) {
      colorScratch.current.copy(particles[i]!.color).multiplyScalar(PARTICLE_BRIGHTNESS);
      mesh.setColorAt(i, colorScratch.current);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [particles]);

  // Per-frame: integrate progress along curve, write transform matrix.
  const matScratch = useRef(new Matrix4());
  const posScratch = useRef(new Vector3());

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const reduced = useSceneStore.getState().prefersReducedMotion;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]!;
      if (!reduced) {
        const len = curveLengths[p.curveIndex] || LAYER_LENGTH;
        p.progress += (dt * PARTICLE_SPEED) / Math.max(1, len);
        if (p.progress >= 1) p.progress -= 1;
      }
      curves[p.curveIndex]!.getPointAt(p.progress, posScratch.current);
      matScratch.current.makeTranslation(
        posScratch.current.x,
        posScratch.current.y,
        posScratch.current.z,
      );
      mesh.setMatrixAt(i, matScratch.current);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, totalCount]}
      key={totalCount /* force remount on density change */}
    >
      <sphereGeometry args={[PARTICLE_RADIUS, 6, 4]} />
      <meshBasicMaterial vertexColors toneMapped={false} />
    </instancedMesh>
  );
}

// Compile-time guard — keep silently for later use (TS doesn't complain).
export const _SPLINE_CONSTANT_REF = HALL_TOTAL_Z;
