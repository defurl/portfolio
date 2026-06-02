import { useMemo, useRef, useEffect } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Billboard, Html, Text } from '@react-three/drei';
import { type MeshStandardMaterial, type Mesh } from 'three';
import { useCityStore } from '../../lib/stores/cityStore';
import { useSceneStore } from '../../lib/stores/sceneStore';
import { useCityToNn } from './useCityToNn';
import { neuralGatewayId } from './nnGateway';
import labelStyles from '../desk/HoverLabel.module.css';
import { BG_PANEL_2, INK_GHOST } from '../../lib/style/colors';

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

function FlashingLight({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<Mesh>(null);
  useFrame((state) => {
    const m = meshRef.current;
    if (!m) return;
    const reduced = useSceneStore.getState().prefersReducedMotion;
    const mat = m.material as MeshStandardMaterial;
    if (reduced) {
      mat.emissiveIntensity = 1.0;
      return;
    }
    // High-speed flashing red warning beacon
    const flash = Math.sin(state.clock.getElapsedTime() * 8) > 0.3 ? 3.5 : 0.2;
    mat.emissiveIntensity = flash;
  });
  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.15, 0.15, 0.15]} />
      <meshStandardMaterial
        color="#FF5555"
        emissive="#FF5555"
        emissiveIntensity={1.0}
        toneMapped={false}
      />
    </mesh>
  );
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
    m.emissiveIntensity = showCallout ? base * 1.25 : base;
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
      h *= 1.15;
      break;
    case 'distributed':
      w *= 1.4;
      d *= 1.4;
      h *= 0.6;
      break;
    case 'static':
      h = Math.max(2, h * 0.25);
      w *= 1.2;
      d *= 1.2;
      break;
    case 'brutalist':
      w *= 1.1;
      d *= 1.1;
      break;
    case 'asymmetric':
      d *= 0.7;
      break;
    case 'container':
      h *= 0.8;
      break;
  }

  // --- High-Fidelity Concrete Frame Grid Overlay ---
  // Renders structural horizontal floor slabs and vertical corner columns wrapping the building core.
  // The gaps between columns and slabs act as natural window slits showing the glowing core!
  const gridElements = useMemo(() => {
    const elems: JSX.Element[] = [];
    const concreteColor = BG_PANEL_2; // raw grey structural concrete

    // Horizontal floor slabs every 3.0m of height
    const slabSpacing = 2.5;
    const slabThickness = 0.15;
    const slabMargin = 0.05; // slightly proud of core to prevent z-fighting

    for (let y = 0; y <= h; y += slabSpacing) {
      elems.push(
        <mesh key={`slab-${y}`} position={[0, y, 0]} castShadow receiveShadow frustumCulled={false}>
          <boxGeometry args={[w + slabMargin, slabThickness, d + slabMargin]} />
          <meshStandardMaterial color={concreteColor} roughness={0.8} metalness={0.05} />
        </mesh>
      );
    }

    // Vertical structural corner columns
    const colSize = 0.15;
    const colOffsetW = w / 2;
    const colOffsetD = d / 2;

    const corners = [
      [-colOffsetW, -colOffsetD],
      [colOffsetW, -colOffsetD],
      [-colOffsetW, colOffsetD],
      [colOffsetW, colOffsetD],
    ];

    corners.forEach(([cx, cz], idx) => {
      elems.push(
        <mesh key={`column-${idx}`} position={[cx, h / 2, cz]} castShadow receiveShadow frustumCulled={false}>
          <boxGeometry args={[colSize, h, colSize]} />
          <meshStandardMaterial color={concreteColor} roughness={0.8} metalness={0.05} />
        </mesh>
      );
    });

    return elems;
  }, [w, h, d]);

  return (
    <group position={position} onPointerOver={onEnter} onPointerOut={onLeave} onClick={onClick}>
      {/* Base block — the glowing interior core representing lit offices */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          ref={windowsRef}
          color="#060912" // Deep dark glass backing
          emissive={accentColor}
          emissiveIntensity={windowDensity * emissiveScale * 1.4}
          roughness={0.15} // high gloss glass reflection
          metalness={0.8}
        />
      </mesh>

      {/* Procedural structural concrete columns and slab grid overlay */}
      {gridElements}

      {/* Style-specific roof / accent details */}
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
      // Flat top with detailed HVAC box, pipe system, and small blinking beacon
      return (
        <group position={[0, h, 0]}>
          {/* Main HVAC cooling tower unit */}
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[w * 0.4, 0.5, d * 0.4]} />
            <meshStandardMaterial color={INK_GHOST} roughness={0.6} metalness={0.4} />
          </mesh>
          {/* Small cooling fan cylinders on top */}
          <mesh position={[0, 0.52, 0]}>
            <cylinderGeometry args={[w * 0.12, w * 0.12, 0.05, 8]} />
            <meshStandardMaterial color="#0A0F1A" roughness={0.9} />
          </mesh>
          {/* Antenna mast with red blinking aviation warning light */}
          <mesh position={[w * 0.2, 0.5, d * 0.2]}>
            <cylinderGeometry args={[0.02, 0.02, 1.0, 6]} />
            <meshStandardMaterial color={INK_GHOST} metalness={0.8} />
          </mesh>
          <FlashingLight position={[w * 0.2, 1.0, d * 0.2]} />
        </group>
      );
    case 'fortress':
      // Massive vertical brick column plus tall glowing rod antenna
      return (
        <group position={[0, h, 0]}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <boxGeometry args={[w * 0.3, 2.4, d * 0.3]} />
            <meshStandardMaterial color={BG_PANEL_2} roughness={0.9} />
          </mesh>
          <mesh position={[0, 2.65, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} toneMapped={false} />
          </mesh>
          <FlashingLight position={[0, 2.9, 0]} />
        </group>
      );
    case 'glass':
      // Sleek architectural spire, decorative roof vents, and blinking beacon
      return (
        <group position={[0, h, 0]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.01, w * 0.12, 3.0, 8]} />
            <meshStandardMaterial color={INK_GHOST} roughness={0.2} metalness={0.9} />
          </mesh>
          <FlashingLight position={[0, 3.0, 0]} />
        </group>
      );
    case 'asymmetric':
      // Smaller offset block + glowing communications satellite dish
      return (
        <group position={[0, h, 0]}>
          <mesh position={[w * 0.2, 0.25, d * 0.2]} castShadow>
            <boxGeometry args={[w * 0.4, 0.5, d * 0.4]} />
            <meshStandardMaterial color={BG_PANEL_2} roughness={0.8} />
          </mesh>
          {/* Dish */}
          <mesh position={[w * 0.2, 0.7, d * 0.2]} rotation={[0.4, 0.6, 0]}>
            <cylinderGeometry args={[0.3, 0.05, 0.15, 12]} />
            <meshStandardMaterial color={INK_GHOST} roughness={0.5} metalness={0.7} />
          </mesh>
          <FlashingLight position={[w * 0.2, 0.9, d * 0.2]} />
        </group>
      );
    case 'hexagonal':
      // Hex prism base + central warning rod
      return (
        <group position={[0, h, 0]}>
          <mesh position={[0, 0.8, 0]} castShadow>
            <cylinderGeometry args={[w * 0.35, w * 0.35, 1.6, 6]} />
            <meshStandardMaterial color={BG_PANEL_2} roughness={0.8} />
          </mesh>
          <FlashingLight position={[0, 1.65, 0]} />
        </group>
      );
    case 'container':
      // Three stacked cargo crates with accent lights and safety warning beacons
      return (
        <group position={[0, h, 0]}>
          {[0.2, 0.6, 1.0].map((y, i) => (
            <group key={i} position={[0, y, 0]}>
              <mesh castShadow>
                <boxGeometry args={[w * (0.85 - i * 0.18), 0.4, d * (0.85 - i * 0.18)]} />
                <meshStandardMaterial color={BG_PANEL_2} roughness={0.7} />
              </mesh>
            </group>
          ))}
          <FlashingLight position={[0, 1.3, 0]} />
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
