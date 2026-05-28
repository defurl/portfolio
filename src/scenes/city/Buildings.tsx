import { useMemo, useRef, useEffect } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Billboard, Html, Text } from '@react-three/drei';
import { type MeshStandardMaterial } from 'three';
import { useCityStore } from '../../lib/stores/cityStore';
import labelStyles from '../desk/HoverLabel.module.css';
import {
  BG_PANEL,
  DATA_GREEN,
  INK_MUTED,
  LAMP_WARM,
  SIGNAL_AMBER,
  SIGNAL_AMBER_HOT,
  VOXEL_GLOW,
} from '../../lib/style/colors';
import {
  getCityBuildings,
  styleFor,
  type BuildingData,
  type BuildingStyle,
  type District,
} from '../../lib/content/buildings';
import { directionPulse } from './directionPulse';

// Phase 3B — the buildings, laid out by district from real GitHub repos.
//
// Layout strategy: each district has a fixed center per city-plan.svg. Within
// a district we place buildings on a deterministic grid, sorted by additions
// desc so the tallest sits at the center cell and shorter ones spiral out.
// Per-building jitter (deterministic from id-hash) breaks the grid feel.
//
// Style → silhouette. Same voxel grammar (boxes, no curves), but the box
// proportions, the roof element, and the window grid density vary. See
// `styleFor()` in lib/content/buildings.ts for the language → style mapping.

// ── district geometry ────────────────────────────────────────────────────
interface DistrictDef {
  readonly center: [number, number];
  readonly size: [number, number];
  readonly color: string;
  readonly accent: string;
  readonly label: string;
}

const DISTRICT_DEFS: Record<District, DistrictDef> = {
  trading: {
    center: [-22.5, -22.5],
    size: [30, 30],
    color: SIGNAL_AMBER,
    accent: SIGNAL_AMBER,
    label: '// trading',
  },
  research: {
    center: [22.5, -22.5],
    size: [30, 30],
    color: VOXEL_GLOW,
    accent: VOXEL_GLOW,
    label: '// research',
  },
  infrastructure: {
    center: [-22.5, 22.5],
    size: [30, 30],
    color: DATA_GREEN,
    accent: DATA_GREEN,
    label: '// infrastructure',
  },
  ml: {
    center: [22.5, 22.5],
    size: [30, 30],
    color: SIGNAL_AMBER_HOT,
    accent: LAMP_WARM,
    label: '// ml',
  },
  lab: {
    center: [0, 45],
    size: [30, 15],
    color: INK_MUTED,
    accent: INK_MUTED,
    label: '// lab',
  },
};

// Deterministic hash → [0, 1)
function hash01(s: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1_000_000) / 1_000_000;
}

// Spiral cell order for an N×M grid, starting at the center cell. Returns
// [col, row] pairs in visit order so the first N entries are the most central.
function spiralOrder(cols: number, rows: number): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let c = 0; c < cols; c++)
    for (let r = 0; r < rows; r++) cells.push([c, r]);
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  cells.sort(([a, b], [c, d]) => {
    const da = (a - cx) ** 2 + (b - cy) ** 2;
    const dc = (c - cx) ** 2 + (d - cy) ** 2;
    return da - dc;
  });
  return cells;
}

// ── building geometry from data ──────────────────────────────────────────
interface BuildingGeom {
  readonly width: number;
  readonly depth: number;
  readonly height: number;
  readonly windowDensity: number; // 0..1 across windows that *could* light
  readonly emissiveScale: number; // archived = 0.4
  readonly style: BuildingStyle;
}

function geomFor(b: BuildingData, percentileInDistrict: number): BuildingGeom {
  const height = Math.max(
    4,
    Math.min(30, Math.log10(Math.max(10, b.additions)) * 3.5),
  );
  const wd = Math.max(
    3,
    Math.min(12, Math.sqrt(Math.max(1, b.commits)) * 0.6),
  );
  // Window density: bottom 25% pct → 0.15, top 25% pct → 0.95, linear between.
  const windowDensity = 0.15 + Math.min(1, Math.max(0, percentileInDistrict)) * 0.8;
  return {
    width: wd,
    depth: wd,
    height,
    windowDensity,
    emissiveScale: b.archived ? 0.4 : 1.0,
    style: styleFor(b.primaryLanguage),
  };
}

// ── one building (silhouette + windows + style accent) ───────────────────
interface OneBuildingProps {
  readonly data: BuildingData;
  readonly geom: BuildingGeom;
  readonly position: [number, number, number];
  readonly accentColor: string;
}

function Building({ data, geom, position, accentColor }: OneBuildingProps) {
  const windowsRef = useRef<MeshStandardMaterial>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { width, depth, height, style, emissiveScale, windowDensity } = geom;

  // Hover targetability is gated by city focus mode — only at district zoom.
  const hovered = useCityStore((s) => s.hovered === data.id);
  const focus = useCityStore((s) => s.focus);
  const hoverable = focus.mode === 'district' && focus.district === data.district;
  const showCallout = hovered && hoverable;

  // Pulse: window emissive intensity tracks directionPulse.value × scale.
  // Hover lift adds +20% emissive while hovered (per §3.21).
  useFrame(() => {
    const m = windowsRef.current;
    if (!m) return;
    const base = windowDensity * emissiveScale * directionPulse.value * 1.4;
    m.emissiveIntensity = showCallout ? base * 1.2 : base;
  });

  useEffect(() => () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
  }, []);

  const onEnter = (e: ThreeEvent<PointerEvent>) => {
    if (!hoverable) return;
    e.stopPropagation();
    // 200ms debounce to avoid flicker when traveling past many buildings.
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      useCityStore.getState().setHovered(data.id);
    }, 200);
    document.body.style.cursor = 'pointer';
  };
  const onLeave = (e: ThreeEvent<PointerEvent>) => {
    if (!hoverable) return;
    e.stopPropagation();
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    useCityStore.getState().setHovered(null);
    document.body.style.cursor = 'auto';
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!hoverable) return;
    e.stopPropagation();
    useCityStore.getState().openBuilding(data.id);
  };

  // Style proportions: nudge the canonical (wd, wd, h) shape.
  let w = width;
  let d = depth;
  let h = height;
  switch (style) {
    case 'fortress':
      // Deep base, vertical accent (taller).
      h *= 1.15;
      break;
    case 'distributed':
      // Wide base, low aspect.
      w *= 1.4;
      d *= 1.4;
      h *= 0.6;
      break;
    case 'static':
      // Single-story footprint.
      h = Math.max(2, h * 0.25);
      w *= 1.2;
      d *= 1.2;
      break;
    case 'brutalist':
      w *= 1.1;
      d *= 1.1;
      break;
    case 'asymmetric':
      // Main mass slightly off-square.
      d *= 0.7;
      break;
    case 'container':
      // Layered stack — base same, the stack lives in the roof.
      h *= 0.8;
      break;
  }

  return (
    <group position={position} onPointerOver={onEnter} onPointerOut={onLeave} onClick={onClick}>
      {/* Base block — the visible mass. Color is BG_PANEL with an
          accent-color emissive scaled by window density. A true per-window
          grid would need a custom shader or instanced facade meshes; for
          Checkpoint B we use a single emissive on the base. The look reads
          as "windows lit from inside" rather than discrete window cells, but
          the district color + density still distinguishes builds clearly. */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          ref={windowsRef}
          color={BG_PANEL}
          emissive={accentColor}
          emissiveIntensity={windowDensity * emissiveScale * 1.4}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* Style-specific roof / accent */}
      <RoofAccent style={style} w={w} d={d} h={h} color={accentColor} />

      {showCallout && (
        <Html position={[0, h + 1.5, 0]} center pointerEvents="none" transform={false}>
          <span className={labelStyles.label}>{`// ${data.name}`}</span>
        </Html>
      )}
    </group>
  );
}

function RoofAccent({
  style,
  w,
  d,
  h,
  color,
}: {
  style: BuildingStyle;
  w: number;
  d: number;
  h: number;
  color: string;
}) {
  switch (style) {
    case 'industrial':
    case 'distributed':
    case 'brutalist':
    case 'static':
    case 'default':
      // Flat top — small antenna nub to differentiate from a featureless box.
      return (
        <mesh position={[0, h + 0.15, 0]}>
          <boxGeometry args={[w * 0.15, 0.3, d * 0.15]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} toneMapped={false} />
        </mesh>
      );
    case 'fortress':
      // Vertical column on top.
      return (
        <mesh position={[0, h + 1.2, 0]}>
          <boxGeometry args={[w * 0.25, 2.4, d * 0.25]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} toneMapped={false} />
        </mesh>
      );
    case 'glass':
      // Spire — narrow tall element above.
      return (
        <mesh position={[0, h + 1.5, 0]}>
          <boxGeometry args={[w * 0.18, 3.0, d * 0.18]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} toneMapped={false} />
        </mesh>
      );
    case 'asymmetric':
      // Smaller offset block.
      return (
        <mesh position={[w * 0.25, h + (h * 0.3) / 2, d * 0.2]}>
          <boxGeometry args={[w * 0.45, h * 0.3, d * 0.45]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} toneMapped={false} />
        </mesh>
      );
    case 'hexagonal':
      // Hex prism — 6-sided cylinder accent.
      return (
        <mesh position={[0, h + 0.8, 0]}>
          <cylinderGeometry args={[w * 0.35, w * 0.35, 1.6, 6]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} toneMapped={false} />
        </mesh>
      );
    case 'container':
      // Three stacked smaller boxes.
      return (
        <group position={[0, h, 0]}>
          {[0.4, 1.0, 1.5].map((y, i) => (
            <mesh key={i} position={[0, y, 0]}>
              <boxGeometry args={[w * (0.9 - i * 0.2), 0.4, d * (0.9 - i * 0.2)]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35 + i * 0.1} toneMapped={false} />
            </mesh>
          ))}
        </group>
      );
  }
}

// ── layout: place buildings per district on a sorted-by-additions grid ───
interface PlacedBuilding {
  readonly data: BuildingData;
  readonly geom: BuildingGeom;
  readonly position: [number, number, number];
  readonly accentColor: string;
}

function layoutDistrict(
  district: District,
  buildings: ReadonlyArray<BuildingData>,
): PlacedBuilding[] {
  if (buildings.length === 0) return [];
  const def = DISTRICT_DEFS[district];
  const sorted = [...buildings].sort((a, b) => b.additions - a.additions);

  // Grid sized to fit count, biased toward square.
  const n = sorted.length;
  const cols = Math.min(4, Math.ceil(Math.sqrt(n)));
  const rows = Math.ceil(n / cols);
  const order = spiralOrder(cols, rows);

  // Cell spacing — leave ~2m gap from district edges and between cells.
  const cellW = (def.size[0] - 4) / cols;
  const cellD = (def.size[1] - 4) / rows;
  const startX = def.center[0] - def.size[0] / 2 + 2 + cellW / 2;
  const startZ = def.center[1] - def.size[1] / 2 + 2 + cellD / 2;

  const placed: PlacedBuilding[] = [];
  for (let i = 0; i < n; i++) {
    const [c, r] = order[i]!;
    const data = sorted[i]!;
    const percentile = 1 - i / Math.max(1, n - 1); // 1 = tallest, 0 = shortest
    const geom = geomFor(data, percentile);
    const jx = (hash01(data.id, 1) - 0.5) * Math.min(1.2, cellW * 0.15);
    const jz = (hash01(data.id, 2) - 0.5) * Math.min(1.2, cellD * 0.15);
    placed.push({
      data,
      geom,
      position: [startX + c * cellW + jx, 0, startZ + r * cellD + jz],
      accentColor: def.accent,
    });
  }
  return placed;
}

// ── public component ─────────────────────────────────────────────────────
export function Buildings() {
  const placements = useMemo(() => {
    const manifest = getCityBuildings();
    const byDistrict: Record<District, BuildingData[]> = {
      trading: [],
      research: [],
      infrastructure: [],
      ml: [],
      lab: [],
    };
    for (const b of manifest.buildings) byDistrict[b.district].push(b);
    return (Object.keys(byDistrict) as District[]).flatMap((d) =>
      layoutDistrict(d, byDistrict[d]),
    );
  }, []);

  return (
    <group>
      {placements.map((p) => (
        <Building
          key={p.data.id}
          data={p.data}
          geom={p.geom}
          position={p.position}
          accentColor={p.accentColor}
        />
      ))}
      <DistrictLabels />
    </group>
  );
}

function DistrictLabels() {
  const focus = useCityStore((s) => s.focus);
  return (
    <group>
      {(Object.keys(DISTRICT_DEFS) as District[]).map((d) => {
        const def = DISTRICT_DEFS[d];
        // Spec §3.20: label opacity dims to 0.3 once a district is zoomed.
        const dim =
          focus.mode === 'district' && focus.district === d ? 0.3 : 0.8;
        const onClick = (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (focus.mode === 'overview') {
            useCityStore.getState().zoomDistrict(d);
          }
        };
        const onOver = () => {
          if (focus.mode === 'overview') document.body.style.cursor = 'pointer';
        };
        const onOut = () => {
          document.body.style.cursor = 'auto';
        };
        return (
          <Billboard key={d} position={[def.center[0], 15, def.center[1]]}>
            <Text
              fontSize={1.2}
              color={def.color}
              anchorX="center"
              anchorY="middle"
              fillOpacity={dim}
              onClick={onClick}
              onPointerOver={onOver}
              onPointerOut={onOut}
            >
              {def.label}
            </Text>
          </Billboard>
        );
      })}
    </group>
  );
}
