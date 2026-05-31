import { useMemo, useRef, useEffect } from 'react';
import { Matrix4 } from 'three';
import type { InstancedMesh } from 'three';
import { BG_PANEL, BG_PANEL_2 } from '../../lib/style/colors';
import {
  GAP_LENGTH,
  HALL_HEIGHT,
  HALL_TOTAL_Z,
  HALL_WIDTH,
  LAYER_COUNT,
  LAYER_LENGTH,
} from './nnLighting';

// The concrete hall — Tadao Ando-coded raw concrete corridor. Materials are
// neutral cool gray MeshStandardMaterials with no texture maps; the visual
// weight comes from proportions, fog, and the diagonal light shafts.
//
// Coordinate system:
//   - Hall runs along -z (visitor enters at z=0 and walks toward z=-HALL_TOTAL_Z).
//   - +x is the right wall; the floor sits at y=0; ceiling at y=HALL_HEIGHT.
//   - Each transformer "layer" is a LAYER_LENGTH segment with a GAP_LENGTH
//     light-shaft slot in the ceiling between segments.

// Concrete: cool gray-slate — base reads as bg-panel, columns lifted one
// shade to bg-panel-2 so they catch the directional shaft light distinctly.
const CONCRETE_COLOR = BG_PANEL;
const COLUMN_ACCENT = BG_PANEL_2;

// 4 attention heads per layer × 2 walls × 4 layers = 32 instanced columns
// (or however many you set HEADS_PER_LAYER to).
const HEADS_PER_LAYER = 4;
const COLUMN_RADIUS = 0.18;
const COLUMN_DEPTH = 0.6;

export function NnHall() {
  const columnsRef = useRef<InstancedMesh>(null);

  // Compute per-layer column positions.
  const columnPositions = useMemo(() => {
    const out: Array<[number, number, number]> = [];
    for (let layer = 0; layer < LAYER_COUNT; layer++) {
      const zStart = -(layer * (LAYER_LENGTH + GAP_LENGTH));
      const segSpacing = LAYER_LENGTH / (HEADS_PER_LAYER + 1);
      for (let head = 0; head < HEADS_PER_LAYER; head++) {
        const z = zStart - segSpacing * (head + 1);
        // Both walls.
        out.push([HALL_WIDTH / 2 - COLUMN_DEPTH / 2, HALL_HEIGHT / 2, z]);
        out.push([-(HALL_WIDTH / 2 - COLUMN_DEPTH / 2), HALL_HEIGHT / 2, z]);
      }
    }
    return out;
  }, []);

  useEffect(() => {
    const mesh = columnsRef.current;
    if (!mesh) return;
    const m = new Matrix4();
    for (let i = 0; i < columnPositions.length; i++) {
      m.makeTranslation(...columnPositions[i]!);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [columnPositions]);

  // Each wall segment per-layer; we render four floor+ceiling+wall slabs.
  // Ceiling has GAP_LENGTH slots between layers — that's where the light
  // shafts will enter. Floor is continuous (no walking gaps).
  const segments = useMemo(() => {
    const out: Array<{ zCenter: number; len: number }> = [];
    for (let layer = 0; layer < LAYER_COUNT; layer++) {
      const zStart = -(layer * (LAYER_LENGTH + GAP_LENGTH));
      const zCenter = zStart - LAYER_LENGTH / 2;
      out.push({ zCenter, len: LAYER_LENGTH });
    }
    return out;
  }, []);

  return (
    <group>
      {/* Floor — continuous slab the full hall length. */}
      <mesh
        position={[0, 0, -HALL_TOTAL_Z / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[HALL_WIDTH, HALL_TOTAL_Z]} />
        <meshStandardMaterial color={CONCRETE_COLOR} roughness={0.95} metalness={0.02} />
      </mesh>

      {/* Per-layer wall + ceiling segments (ceiling segmented so the
          GAP_LENGTH between layers reads as a light slot). */}
      {segments.map((s, i) => (
        <group key={i} position={[0, 0, s.zCenter]}>
          {/* Left wall */}
          <mesh position={[-HALL_WIDTH / 2, HALL_HEIGHT / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.4, HALL_HEIGHT, s.len]} />
            <meshStandardMaterial color={CONCRETE_COLOR} roughness={0.9} metalness={0.02} />
          </mesh>
          {/* Right wall */}
          <mesh position={[HALL_WIDTH / 2, HALL_HEIGHT / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.4, HALL_HEIGHT, s.len]} />
            <meshStandardMaterial color={CONCRETE_COLOR} roughness={0.9} metalness={0.02} />
          </mesh>
          {/* Ceiling */}
          <mesh position={[0, HALL_HEIGHT, 0]} receiveShadow>
            <boxGeometry args={[HALL_WIDTH + 0.8, 0.3, s.len]} />
            <meshStandardMaterial color={CONCRETE_COLOR} roughness={0.95} metalness={0.02} />
          </mesh>
        </group>
      ))}

      {/* Instanced concrete columns — attention-head pillars along both
          walls, repeated across all layer segments. */}
      <instancedMesh
        ref={columnsRef}
        args={[undefined, undefined, columnPositions.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[COLUMN_DEPTH, HALL_HEIGHT - 0.6, COLUMN_RADIUS * 4]} />
        <meshStandardMaterial color={COLUMN_ACCENT} roughness={0.92} metalness={0.04} />
      </instancedMesh>
    </group>
  );
}
