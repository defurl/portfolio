import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Matrix4 } from 'three';
import type { InstancedMesh } from 'three';
import { SIGNAL_AMBER, VOXEL_GLOW } from '../../lib/style/colors';
import { useSceneStore } from '../../lib/stores/sceneStore';
import {
  GAP_LENGTH,
  HALL_HEIGHT,
  HALL_WIDTH,
  LAYER_COUNT,
  LAYER_LENGTH,
} from './nnLighting';

// Phase 4B §4.8 — volumetric wall-embedded neuron lights.
//
// Small spheres (radius 0.15m) embedded along both corridor walls at neuron
// positions. Alternating SIGNAL_AMBER / VOXEL_GLOW. MeshBasicMaterial with
// toneMapped:false so the colors register at their raw luminance and feed
// the high-fi bloom pass without being dimmed by tone mapping.
//
// Per-instance breathing: emissive scalar drifts 0.3 → 1.5 over a 4s cycle.
// Each instance has a deterministic phase offset so they don't pulse in
// lockstep. Honors prefers-reduced-motion: holds at 0.8.

const NEURON_RADIUS = 0.2;
const PER_LAYER = 8; // 8 neurons per wall per layer
// Walls span x ∈ [-HALL_WIDTH/2 - 0.2, -HALL_WIDTH/2 + 0.2] (0.4m thick),
// so the corridor-facing surface is at -HALL_WIDTH/2 + 0.2. Place sphere
// centers 0.5m in (0.3m proud of the inside wall surface) so the whole orb
// is in front of the wall and reads from down the corridor.
const WALL_INSET = 0.5;
const Y_MIN = 0.8;
const Y_MAX = HALL_HEIGHT - 0.8;

// Pulse range — spec is 0.3..1.5 but at the corridor's natural distances the
// trough reads as nothing. Lift floor + peak so the rhythm registers and the
// bloom pass picks up the highlights when hi-fi is on.
const BASE = 0.7;
const PEAK = 2.4;
const PERIOD_S = 4;
const REDUCED_INTENSITY = 1.2;

// Hash → [0, 1)
function hash01(i: number, salt = 0): number {
  let h = (i + 1) * 374761393 + salt * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

interface NeuronPlacement {
  pos: [number, number, number];
  color: Color;
  phase: number;
}

const COLOR_AMBER = new Color(SIGNAL_AMBER);
const COLOR_COOL = new Color(VOXEL_GLOW);

export function NeuronLights() {
  const meshRef = useRef<InstancedMesh>(null);

  const placements = useMemo<NeuronPlacement[]>(() => {
    const out: NeuronPlacement[] = [];
    let idx = 0;
    for (let layer = 0; layer < LAYER_COUNT; layer++) {
      const zStart = -(layer * (LAYER_LENGTH + GAP_LENGTH));
      // Distribute PER_LAYER neurons along the segment, on both walls.
      for (let n = 0; n < PER_LAYER; n++) {
        const tz = (n + 0.5) / PER_LAYER;
        const z = zStart - tz * LAYER_LENGTH;
        // Heights vary deterministically.
        const yLeft = Y_MIN + hash01(idx, 1) * (Y_MAX - Y_MIN);
        const yRight = Y_MIN + hash01(idx, 2) * (Y_MAX - Y_MIN);
        const color = n % 2 === 0 ? COLOR_AMBER : COLOR_COOL;
        out.push({
          pos: [-HALL_WIDTH / 2 + WALL_INSET, yLeft, z],
          color,
          phase: hash01(idx, 3) * Math.PI * 2,
        });
        out.push({
          pos: [HALL_WIDTH / 2 - WALL_INSET, yRight, z],
          color,
          phase: hash01(idx, 4) * Math.PI * 2,
        });
        idx += 1;
      }
    }
    return out;
  }, []);

  // Set per-instance matrices + colors once.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const m = new Matrix4();
    for (let i = 0; i < placements.length; i++) {
      m.makeTranslation(...placements[i]!.pos);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, placements[i]!.color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [placements]);

  // Breathing pulse — modulate per-instance vertex color brightness so each
  // sphere reads as a varying "emissive intensity" (MeshBasicMaterial has no
  // emissive channel; the color value IS the unlit output, which feeds bloom
  // when toneMapped is false). Per-instance phase offsets keep them out of
  // lockstep.
  const t = useRef(0);
  const scratch = useRef(new Color());

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const reduced = useSceneStore.getState().prefersReducedMotion;
    if (reduced) {
      for (let i = 0; i < placements.length; i++) {
        scratch.current.copy(placements[i]!.color).multiplyScalar(REDUCED_INTENSITY);
        mesh.setColorAt(i, scratch.current);
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      return;
    }
    t.current += dt;
    for (let i = 0; i < placements.length; i++) {
      const p = placements[i]!;
      const phase = (t.current / PERIOD_S) * Math.PI * 2 + p.phase;
      const pulse = BASE + ((Math.sin(phase) + 1) / 2) * (PEAK - BASE);
      scratch.current.copy(p.color).multiplyScalar(pulse);
      mesh.setColorAt(i, scratch.current);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, placements.length]}
      castShadow={false}
      receiveShadow={false}
    >
      <sphereGeometry args={[NEURON_RADIUS, 12, 8]} />
      <meshBasicMaterial vertexColors toneMapped={false} />
    </instancedMesh>
  );
}

// Compile-time helper: re-export count for the audio engine's traversal mod.
export const NEURON_COUNT_TOTAL = LAYER_COUNT * PER_LAYER * 2;
