import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, MathUtils } from 'three';
import { useCityStore, type CityFocus } from '../../lib/stores/cityStore';
import { useSceneStore } from '../../lib/stores/sceneStore';
import { useTransitionStore } from '../../lib/stores/transitionStore';
import {
  DISTRICT_DEFS,
  findPlaced,
  type District,
} from '../../lib/content/buildings';

// High-Fidelity City Camera Controller Overhaul (Phase 4D / Redesign)
//
// Strips away passive cursor drift to give visitors absolute spatial agency.
// Supports two primary modes governed by `cityStore.navigationMode`:
//
// 1. orbit: Overview skyline perspective.
//    - Left-click dragging rotates the camera orbit around center (0,0,0) in 360° spherical coords.
//    - Pitch is clamped between 10° and 72° to preserve ground floor framing.
//    - Distict/Building zooms trigger the classic smooth 2.5s glides.
//
// 2. street: Walk eye-level Street POV view (Y = 1.65m).
//    - Mouse/touch dragging looks around in a 360-degree first-person view.
//    - Tapping street path waypoints sets a target, gliding the camera smoothly at 15m/s to navigate.
//
// Prefers-reduced-motion: Disables all dragging movement, and snaps focus transitions instantly.

const ORBIT_RADIUS = 46;
const STREET_EYE_HEIGHT = 1.65;
const GLIDE_DURATION_S = 2.5;
const ENTRY_GLIDE_DURATION_S = 2.0;

// High altitude tilted district zoom pose
function districtPose(d: District): {
  pos: [number, number, number];
  target: [number, number, number];
} {
  const [cx, cz] = DISTRICT_DEFS[d].center;
  return { pos: [cx, 18, cz + 32], target: [cx, 1.5, cz] };
}

// Building focus camera pose
function buildingPose(buildingId: string): {
  pos: [number, number, number];
  target: [number, number, number];
} {
  const pb = findPlaced(buildingId);
  if (!pb) return { pos: [0, 20, 35], target: [0, 0, 0] };
  const [bx, , bz] = pb.position;
  const bH = pb.geom.height;
  return {
    pos: [bx, Math.max(6, bH * 0.65 + 3), bz + 10],
    target: [bx, bH * 0.4, bz],
  };
}

function targetFor(focus: CityFocus): {
  pos: [number, number, number];
  target: [number, number, number];
} {
  switch (focus.mode) {
    case 'overview':
      return { pos: [0, 20, 35], target: [0, 0, 0] };
    case 'district':
      return districtPose(focus.district);
    case 'building':
      return buildingPose(focus.buildingId);
  }
}

export function CityCameraRig() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  // 1. Store subscriptions
  const navigationMode = useCityStore((s) => s.navigationMode);
  const streetWalkTarget = useCityStore((s) => s.streetWalkTarget);

  // 2. Camera Drag & Rotation state
  const dragging = useRef(false);

  // Orbit spherical coordinate refs
  const orbitYaw = useRef(0.2); // slight default angle
  const orbitPitch = useRef(0.5); // tilted looking down
  const orbitRadius = useRef(ORBIT_RADIUS); // dynamic zoom radius
  const orbitTargetPos = useRef(new Vector3());

  // Street First-Person Look refs
  const streetYaw = useRef(Math.PI); // face down Z (down the main avenue)
  const streetPitch = useRef(0.0);
  const streetTargetLook = useRef(new Vector3());

  // Glide / Transition refs
  const fromPos = useRef(new Vector3());
  const fromTgt = useRef(new Vector3());
  const toPos = useRef(new Vector3());
  const toTgt = useRef(new Vector3());
  const lookAt = useRef(new Vector3());
  const glideElapsedS = useRef(GLIDE_DURATION_S);
  const glideTotalS = useRef(GLIDE_DURATION_S);
  const lastFocusKey = useRef<string>('overview');

  // Entry handling: glide down from southern sky on Desk arrival
  useEffect(() => {
    const entry = useCityStore.getState().entry;
    const reduced = useSceneStore.getState().prefersReducedMotion;
    const initialPos: [number, number, number] = [0, 32, 95];
    const initialTgt: [number, number, number] = [0, 6, 0];

    if (entry !== 'from-window' || reduced) {
      // Direct positioning
      if (navigationMode === 'orbit') {
        const dest = targetFor(useCityStore.getState().focus);
        camera.position.set(...dest.pos);
        lookAt.current.set(...dest.target);
        camera.lookAt(lookAt.current);
      } else {
        camera.position.set(0, STREET_EYE_HEIGHT, 30);
        streetTargetLook.current.set(0, STREET_EYE_HEIGHT, 0);
        camera.lookAt(streetTargetLook.current);
      }
      return;
    }

    camera.position.set(...initialPos);
    lookAt.current.set(...initialTgt);
    camera.lookAt(lookAt.current);
    fromPos.current.set(...initialPos);
    fromTgt.current.set(...initialTgt);
    toPos.current.set(0, 20, 35);
    toTgt.current.set(0, 0, 0);
    glideElapsedS.current = 0;
    glideTotalS.current = ENTRY_GLIDE_DURATION_S;
    lastFocusKey.current = 'entry';

    requestAnimationFrame(() =>
      useTransitionStore.getState().setPhase('fading-in'),
    );
  }, [camera, navigationMode]);

  // Pointer drag & wheel zoom listener setup
  useEffect(() => {
    const el = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return; // only left click drags
      dragging.current = true;
      el.setPointerCapture(e.pointerId);
    };

    const onPointerUp = (e: PointerEvent) => {
      dragging.current = false;
      el.releasePointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      const reduced = useSceneStore.getState().prefersReducedMotion;
      if (!dragging.current || reduced) return;

      const sensitivity = 0.0035;

      if (navigationMode === 'orbit') {
        // Orbit: drag rotates camera around the city center
        orbitYaw.current -= e.movementX * sensitivity;
        orbitPitch.current += e.movementY * sensitivity;
        // Clamp pitch to prevent going completely under ground or straight overhead
        orbitPitch.current = MathUtils.clamp(
          orbitPitch.current,
          MathUtils.degToRad(8),
          MathUtils.degToRad(70)
        );
      } else {
        // Street POV: drag rotates first-person look direction
        streetYaw.current -= e.movementX * sensitivity;
        streetPitch.current -= e.movementY * sensitivity;
        // Clamp pitch to prevent looking straight up/down
        streetPitch.current = MathUtils.clamp(streetPitch.current, -0.6, 0.65);
      }
    };

    const onWheel = (e: WheelEvent) => {
      const reduced = useSceneStore.getState().prefersReducedMotion;
      if (reduced) return;

      // Prevent page body scrolling when hovering canvas
      e.preventDefault();

      if (navigationMode === 'orbit') {
        const zoomSpeed = 0.03;
        orbitRadius.current += e.deltaY * zoomSpeed;
        // Clamp radius between 16 (close overview) and 70 (far overview)
        orbitRadius.current = MathUtils.clamp(orbitRadius.current, 16, 70);

        // Seamless transition to Street POV if zoomed in extremely close:
        if (orbitRadius.current < 20) {
          // Reset overview radius for when they pull back out later
          orbitRadius.current = 46;
          useCityStore.getState().setNavigationMode('street');
        }
      } else {
        // Zooming out in Street POV pops the camera back up into Orbit Overview:
        if (e.deltaY > 0) {
          useCityStore.getState().setNavigationMode('orbit');
          // Start overview close to ground for seamless zoom-out feel
          orbitRadius.current = 24;
        }
      }
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('wheel', onWheel);
    };
  }, [gl, navigationMode]);

  useFrame((_, dt) => {
    const focus = useCityStore.getState().focus;
    const reduced = useSceneStore.getState().prefersReducedMotion;

    // --- 1. HANDLE DISTRICT/BUILDING GLIDES (Orbit Mode only) ---
    if (navigationMode === 'orbit') {
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
        glideTotalS.current = GLIDE_DURATION_S;
        glideElapsedS.current = reduced ? glideTotalS.current : 0;
      }

      if (glideElapsedS.current < glideTotalS.current) {
        glideElapsedS.current = Math.min(glideElapsedS.current + dt, glideTotalS.current);
        const t = easeInOutCubic(glideElapsedS.current / glideTotalS.current);
        camera.position.lerpVectors(fromPos.current, toPos.current, t);
        lookAt.current.lerpVectors(fromTgt.current, toTgt.current, t);
        camera.lookAt(lookAt.current);
        return;
      }
    }

    // --- 2. ACTIVE NAVIGATION MODES ---
    if (navigationMode === 'orbit') {
      // --- ORBIT MODE OVERVIEW ACTIVE ROTATION ---
      if (focus.mode === 'overview') {
        const radius = ORBIT_RADIUS;
        const cosP = Math.cos(orbitPitch.current);
        const sinP = Math.sin(orbitPitch.current);
        const cosY = Math.cos(orbitYaw.current);
        const sinY = Math.sin(orbitYaw.current);

        // Spherical coordinate position
        orbitTargetPos.current.set(
          radius * cosP * sinY,
          radius * sinP,
          radius * cosP * cosY
        );

        if (reduced) {
          camera.position.copy(orbitTargetPos.current);
          lookAt.current.set(0, 0, 0);
        } else {
          // Smoothly lerp to orbit target position for organic lag feeling
          camera.position.lerp(orbitTargetPos.current, Math.min(1, 4 * dt));
          lookAt.current.lerp(new Vector3(0, 0, 0), Math.min(1, 4 * dt));
        }
        camera.lookAt(lookAt.current);
      } else {
        // District / Building focus mode settled
        const dest = targetFor(focus);
        camera.position.set(...dest.pos);
        lookAt.current.set(...dest.target);
        camera.lookAt(lookAt.current);
      }
    } else {
      // --- STREET POV Eye-Level Traversal ---
      // A. Glide target navigation (tapped waypoints)
      if (streetWalkTarget) {
        const targetVec = new Vector3(...streetWalkTarget);
        targetVec.y = STREET_EYE_HEIGHT; // Lock walking height

        const dist = camera.position.distanceTo(targetVec);
        if (dist < 0.15) {
          camera.position.copy(targetVec);
          useCityStore.getState().setStreetWalkTarget(null);
        } else {
          // Smooth glide down paved streets at 12m/s
          const speed = reduced ? dist : Math.min(1, 4.5 * dt);
          camera.position.lerp(targetVec, speed);
        }
      }

      // B. Drag-to-Look 360° directional projection
      const cosP = Math.cos(streetPitch.current);
      const sinP = Math.sin(streetPitch.current);
      const cosY = Math.cos(streetYaw.current);
      const sinY = Math.sin(streetYaw.current);

      streetTargetLook.current.set(
        camera.position.x + cosP * sinY,
        camera.position.y + sinP,
        camera.position.z + cosP * cosY
      );

      camera.lookAt(streetTargetLook.current);
    }
  });

  return null;
}
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

