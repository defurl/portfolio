import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useCityStore, type CityFocus } from '../../lib/stores/cityStore';
import { useSceneStore } from '../../lib/stores/sceneStore';
import { getCityBuildings, type District } from '../../lib/content/buildings';

// City camera state machine.
//
// Three modes:
//   - overview: pan with cursor (lookAt = (cursorX*15, 0, cursorY*10)),
//     200ms lerp. Subtle orbital drift adds organic motion when the cursor
//     is still. Camera position trails the target slightly for parallax.
//   - district: glide to a fixed close-up pose over 2.5s.
//   - building: small forward nudge toward the building's position.
//
// Reduced motion: pan disabled, glides become snaps.

const OVERVIEW_POS: [number, number, number] = [0, 20, 35];
const OVERVIEW_TARGET: [number, number, number] = [0, 0, 0];

const PAN_LERP_K = 5;           // ≈ 200ms to settle
const GLIDE_DURATION_S = 2.5;
const DRIFT_PERIOD_S = 6;
const DRIFT_RADIUS = 0.6;

const DISTRICT_CENTER: Record<District, [number, number]> = {
  trading: [-22.5, -22.5],
  research: [22.5, -22.5],
  infrastructure: [-22.5, 22.5],
  ml: [22.5, 22.5],
  lab: [0, 45],
};

function districtPose(d: District): {
  pos: [number, number, number];
  target: [number, number, number];
} {
  const [cx, cz] = DISTRICT_CENTER[d];
  return { pos: [cx, 8, cz + 15], target: [cx, 4, cz] };
}

function buildingPose(buildingId: string): {
  pos: [number, number, number];
  target: [number, number, number];
} {
  const m = getCityBuildings();
  const b = m.buildings.find((x) => x.id === buildingId);
  if (!b) return { pos: OVERVIEW_POS, target: OVERVIEW_TARGET };
  const dPose = districtPose(b.district);
  // Nudge slightly forward toward the district center but a touch lower.
  return { pos: [dPose.pos[0], 6, dPose.pos[2] - 5], target: dPose.target };
}

function targetFor(focus: CityFocus): {
  pos: [number, number, number];
  target: [number, number, number];
} {
  switch (focus.mode) {
    case 'overview':
      return { pos: OVERVIEW_POS, target: OVERVIEW_TARGET };
    case 'district':
      return districtPose(focus.district);
    case 'building':
      return buildingPose(focus.buildingId);
  }
}

export function CityCameraRig() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  // Cursor in normalized [-1, 1] coordinates.
  const cursor = useRef<[number, number]>([0, 0]);

  // Glide state — animates camera pose toward the focus-mode target.
  const fromPos = useRef(new Vector3(...OVERVIEW_POS));
  const fromTgt = useRef(new Vector3(...OVERVIEW_TARGET));
  const toPos = useRef(new Vector3(...OVERVIEW_POS));
  const toTgt = useRef(new Vector3(...OVERVIEW_TARGET));
  const lookAt = useRef(new Vector3(...OVERVIEW_TARGET));
  const glideElapsedS = useRef(GLIDE_DURATION_S); // start "settled"
  const lastFocusKey = useRef<string>('overview');
  const driftT = useRef(0);

  // Cursor tracking — pointermove on the canvas element.
  useFrame((_, dt) => {
    const focus = useCityStore.getState().focus;
    const reduced = useSceneStore.getState().prefersReducedMotion;

    // Detect focus change → kick off a new glide.
    const key =
      focus.mode === 'overview'
        ? 'overview'
        : focus.mode === 'district'
          ? `district:${focus.district}`
          : `building:${focus.buildingId}`;
    if (key !== lastFocusKey.current) {
      lastFocusKey.current = key;
      const dest = targetFor(focus);
      fromPos.current.copy(camera.position);
      fromTgt.current.copy(lookAt.current);
      toPos.current.set(...dest.pos);
      toTgt.current.set(...dest.target);
      glideElapsedS.current = reduced ? GLIDE_DURATION_S : 0;
    }

    // Glide in progress: lerp toward dest.
    if (glideElapsedS.current < GLIDE_DURATION_S) {
      glideElapsedS.current = Math.min(glideElapsedS.current + dt, GLIDE_DURATION_S);
      const t = easeInOutCubic(glideElapsedS.current / GLIDE_DURATION_S);
      camera.position.lerpVectors(fromPos.current, toPos.current, t);
      lookAt.current.lerpVectors(fromTgt.current, toTgt.current, t);
      camera.lookAt(lookAt.current);
      return;
    }

    // Glide settled. Per-mode behaviour:
    if (focus.mode !== 'overview') {
      camera.position.copy(toPos.current);
      lookAt.current.copy(toTgt.current);
      camera.lookAt(lookAt.current);
      return;
    }

    // Overview: cursor pan + drift.
    if (reduced) {
      camera.position.set(...OVERVIEW_POS);
      lookAt.current.set(...OVERVIEW_TARGET);
      camera.lookAt(lookAt.current);
      return;
    }
    driftT.current += dt;
    const driftPhase = (driftT.current / DRIFT_PERIOD_S) * Math.PI * 2;
    const driftX = Math.cos(driftPhase) * DRIFT_RADIUS;
    const driftZ = Math.sin(driftPhase) * DRIFT_RADIUS * 0.4;

    const [cx, cy] = cursor.current;
    const targetX = cx * 15 + driftX;
    const targetZ = cy * 10 + driftZ;

    // Lerp lookAt + camera position with 200ms time-constant.
    const k = Math.min(1, PAN_LERP_K * dt);
    lookAt.current.x += (targetX - lookAt.current.x) * k;
    lookAt.current.z += (targetZ - lookAt.current.z) * k;
    lookAt.current.y += (0 - lookAt.current.y) * k;
    // Camera trails the target slightly — parallax.
    const pTargetX = cx * 2 + driftX * 0.3;
    const pTargetZ = 35 + driftZ * 0.3;
    camera.position.x += (pTargetX - camera.position.x) * k;
    camera.position.z += (pTargetZ - camera.position.z) * k;
    camera.position.y += (20 - camera.position.y) * k;
    camera.lookAt(lookAt.current);
  });

  // Pointer tracking on the canvas DOM element.
  useFrame(() => {
    // (set up once)
    if (!(gl.domElement as HTMLCanvasElement & { __cityCursorBound?: boolean }).__cityCursorBound) {
      const el = gl.domElement;
      const onMove = (e: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        cursor.current = [x, y];
      };
      el.addEventListener('pointermove', onMove);
      (el as HTMLCanvasElement & { __cityCursorBound?: boolean }).__cityCursorBound = true;
    }
  });

  return null;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
