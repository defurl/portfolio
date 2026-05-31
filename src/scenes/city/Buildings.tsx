import { useMemo, useRef, useEffect } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Billboard, Html, Text } from '@react-three/drei';
import { type MeshStandardMaterial } from 'three';
import { useCityStore } from '../../lib/stores/cityStore';
import { useCityToNn } from './useCityToNn';
import { neuralGatewayId } from './nnGateway';
import labelStyles from '../desk/HoverLabel.module.css';
import { BG_PANEL } from '../../lib/style/colors';
import {
  DISTRICT_DEFS,
  getPlacedBuildings,
  type BuildingData,
  type BuildingGeom,
  type BuildingStyle,
  type District,
} from '../../lib/content/buildings';
import { directionPulse } from './directionPulse';

// Phase 3B — the buildings, laid out by district from real GitHub repos.
//
// Layout, district definitions, and per-building geometry math live in
// `lib/content/buildings.ts` so the camera rig and the store navigation
// share the same canonical placement table.
//
// Style → silhouette. Same voxel grammar (boxes, no curves), but the box
// proportions, the roof element, and the window grid density vary. See
// `styleFor()` in lib/content/buildings.ts for the language → style mapping.

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
  const enterNn = useCityToNn();
  const isGateway = data.id === neuralGatewayId();

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
    if (isGateway) {
      enterNn(data.id);
      return;
    }
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

// ── public component ─────────────────────────────────────────────────────
export function Buildings() {
  const placements = useMemo(() => getPlacedBuildings(), []);

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
