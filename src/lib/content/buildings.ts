// Typed accessor for the build-time city-buildings.json plus the canonical
// city spatial layout (district definitions, layout math, placement cache).
//
// The placement table is computed once from the JSON manifest and memoized
// at module scope — every consumer (Buildings.tsx, CityCameraRig.tsx,
// cityStore navigation) reads from the same `getPlacedBuildings()` result.

import manifest from '../../generated/city-buildings.json';
import {
  DATA_GREEN,
  INK_MUTED,
  LAMP_WARM,
  SIGNAL_AMBER,
  SIGNAL_AMBER_HOT,
  VOXEL_GLOW,
} from '../style/colors';

export type District = 'trading' | 'research' | 'infrastructure' | 'ml' | 'lab';
export type BuildingStyle =
  | 'industrial'
  | 'fortress'
  | 'glass'
  | 'distributed'
  | 'asymmetric'
  | 'brutalist'
  | 'hexagonal'
  | 'static'
  | 'container'
  | 'default';

export interface BuildingData {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly url: string;
  readonly district: District;
  readonly primaryLanguage: string;
  readonly additions: number;
  readonly commits: number;
  readonly archived: boolean;
  readonly pushedAt: string;
}

export interface CityBuildingsManifest {
  readonly source: 'github' | 'stub';
  readonly fetchedAt: string;
  readonly buildings: ReadonlyArray<BuildingData>;
  readonly reason?: string;
}

export function getCityBuildings(): CityBuildingsManifest {
  return manifest as unknown as CityBuildingsManifest;
}

// ── language → style ─────────────────────────────────────────────────────
export const LANGUAGE_TO_STYLE: Record<string, BuildingStyle> = {
  Python: 'industrial',
  Rust: 'fortress',
  TypeScript: 'glass',
  JavaScript: 'glass',
  Go: 'distributed',
  'Jupyter Notebook': 'asymmetric',
  C: 'brutalist',
  'C++': 'brutalist',
  Solidity: 'hexagonal',
  HTML: 'static',
  CSS: 'static',
  Shell: 'container',
  Dockerfile: 'container',
};

export function styleFor(language: string): BuildingStyle {
  return LANGUAGE_TO_STYLE[language] ?? 'default';
}

// ── district layout spec ─────────────────────────────────────────────────
export interface DistrictDef {
  readonly center: [number, number];
  readonly size: [number, number];
  readonly color: string;
  readonly accent: string;
  readonly label: string;
}

export const DISTRICT_DEFS: Record<District, DistrictDef> = {
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

// ── per-building geometry from data ──────────────────────────────────────
export interface BuildingGeom {
  readonly width: number;
  readonly depth: number;
  readonly height: number;
  readonly windowDensity: number;
  readonly emissiveScale: number;
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

// ── deterministic helpers ────────────────────────────────────────────────
function hash01(s: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1_000_000) / 1_000_000;
}

// Spiral cell order, center-out.
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

// ── placement (cached at module scope) ───────────────────────────────────
export interface PlacedBuilding {
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

  const n = sorted.length;
  const cols = Math.min(4, Math.ceil(Math.sqrt(n)));
  const rows = Math.ceil(n / cols);
  const order = spiralOrder(cols, rows);

  const cellW = (def.size[0] - 4) / cols;
  const cellD = (def.size[1] - 4) / rows;
  const startX = def.center[0] - def.size[0] / 2 + 2 + cellW / 2;
  const startZ = def.center[1] - def.size[1] / 2 + 2 + cellD / 2;

  const placed: PlacedBuilding[] = [];
  for (let i = 0; i < n; i++) {
    const [c, r] = order[i]!;
    const data = sorted[i]!;
    const percentile = 1 - i / Math.max(1, n - 1);
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

let placedCache: ReadonlyArray<PlacedBuilding> | null = null;
export function getPlacedBuildings(): ReadonlyArray<PlacedBuilding> {
  if (placedCache) return placedCache;
  const manifest = getCityBuildings();
  const byDistrict: Record<District, BuildingData[]> = {
    trading: [],
    research: [],
    infrastructure: [],
    ml: [],
    lab: [],
  };
  for (const b of manifest.buildings) byDistrict[b.district].push(b);
  placedCache = (Object.keys(byDistrict) as District[]).flatMap((d) =>
    layoutDistrict(d, byDistrict[d]),
  );
  return placedCache;
}

export function findPlaced(id: string): PlacedBuilding | undefined {
  return getPlacedBuildings().find((p) => p.data.id === id);
}

export function districtOf(id: string): District | undefined {
  return findPlaced(id)?.data.district;
}
