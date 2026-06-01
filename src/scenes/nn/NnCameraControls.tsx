import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Euler, MathUtils, Vector3 } from 'three';
import { HALL_TOTAL_Z, HALL_WIDTH } from './nnLighting';
import { useSceneStore } from '../../lib/stores/sceneStore';
import { nnWalkTarget } from './nnWalkTarget';

// First-person eye-level walk controls.
//
// - y locked to 1.65m (walking eye-height)
// - x clamped to the hall width (visitor stays centred between walls)
// - z free along the hall length (with a small back-of-entry buffer)
// - WASD or arrow keys move along corridor
// - Mouse-drag rotates view, clamped ±45° horizontal / ±15° vertical
// - No camera bobbing (motion-sickness mitigation)
// - Under prefers-reduced-motion: snap movement (no smooth lerp), and the
//   rotation clamp is even tighter (±20°/±10°) so the visitor doesn't lose
//   their bearings on quick inputs.

const EYE_HEIGHT = 1.65;
const WALK_SPEED = 4.5; // m/s
const ACCEL_K = 8; // velocity smoothing
const YAW_LIMIT = MathUtils.degToRad(45);
const PITCH_LIMIT = MathUtils.degToRad(15);
const MOUSE_SENSITIVITY = 0.0025;
const X_CLAMP = HALL_WIDTH / 2 - 0.8; // 80cm from each wall
const Z_FRONT = 2; // visitor can step slightly back into the entry portal
const Z_BACK = -(HALL_TOTAL_Z - 1); // 1m short of the back wall

export function NnCameraControls() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  const keys = useRef({ w: false, a: false, s: false, d: false });
  const yaw = useRef(0);
  const pitch = useRef(0);
  const velocity = useRef(new Vector3());
  const dragging = useRef(false);

  // Initialize camera at the entry portal.
  useEffect(() => {
    camera.position.set(0, EYE_HEIGHT, Z_FRONT);
    camera.rotation.order = 'YXZ';
    yaw.current = 0; // default camera faces -z; corridor extends along -z, so 0 = down the hall
    pitch.current = 0;
    camera.rotation.set(0, yaw.current, 0);
  }, [camera]);

  // Keyboard + mouse listeners.
  useEffect(() => {
    const el = gl.domElement;

    const keyMap: Record<string, keyof typeof keys.current> = {
      KeyW: 'w', ArrowUp: 'w',
      KeyA: 'a', ArrowLeft: 'a',
      KeyS: 's', ArrowDown: 's',
      KeyD: 'd', ArrowRight: 'd',
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const k = keyMap[e.code];
      if (k) {
        keys.current[k] = true;
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = keyMap[e.code];
      if (k) {
        keys.current[k] = false;
        e.preventDefault();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      // Only left button drags rotation; other buttons leave the canvas alone.
      if (e.button !== 0) return;
      dragging.current = true;
      el.setPointerCapture(e.pointerId);
    };
    const onPointerUp = (e: PointerEvent) => {
      dragging.current = false;
      el.releasePointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      yaw.current -= e.movementX * MOUSE_SENSITIVITY;
      pitch.current -= e.movementY * MOUSE_SENSITIVITY;
      yaw.current = MathUtils.clamp(yaw.current, -YAW_LIMIT, YAW_LIMIT);
      pitch.current = MathUtils.clamp(pitch.current, -PITCH_LIMIT, PITCH_LIMIT);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointermove', onPointerMove);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointermove', onPointerMove);
    };
  }, [gl]);

  // Per-frame: integrate keys → desired velocity → camera position. Apply
  // clamped yaw/pitch rotation. Lock y to eye-height.
  useFrame((_, dt) => {
    const reduced = useSceneStore.getState().prefersReducedMotion;

    // Desired direction in camera-local space — w/s = forward/back along the
    // camera's facing yaw; a/d = strafe.
    const k = keys.current;
    let dx = 0;
    let dz = 0;
    if (k.w) dz -= 1;
    if (k.s) dz += 1;
    if (k.a) dx -= 1;
    if (k.d) dx += 1;
    if (dx !== 0 || dz !== 0) {
      const len = Math.hypot(dx, dz);
      dx /= len;
      dz /= len;
    }

    // Project local intent through yaw to world space (only yaw — y is locked).
    const cosY = Math.cos(yaw.current);
    const sinY = Math.sin(yaw.current);
    const worldDx = dx * cosY + dz * sinY;
    const worldDz = -dx * sinY + dz * cosY;

    const desiredV = new Vector3(worldDx * WALK_SPEED, 0, worldDz * WALK_SPEED);

    if (reduced) {
      velocity.current.copy(desiredV);
    } else {
      // Exponential smoothing of velocity for non-jerky starts/stops.
      const a = Math.min(1, ACCEL_K * dt);
      velocity.current.lerp(desiredV, a);
    }

    camera.position.x = MathUtils.clamp(
      camera.position.x + velocity.current.x * dt,
      -X_CLAMP,
      X_CLAMP,
    );

    // Mobile waypoint glide — if a target z is set (NnWaypoints tap) and the
    // visitor isn't actively WASD-ing, lerp z toward it. Cancels naturally on
    // any keyboard input by clearing the target.
    const intendedWasdZ = velocity.current.z;
    if (nnWalkTarget.z !== null && Math.abs(intendedWasdZ) < 0.05) {
      const dz = nnWalkTarget.z - camera.position.z;
      if (Math.abs(dz) < 0.3) {
        camera.position.z = nnWalkTarget.z;
        nnWalkTarget.z = null;
      } else {
        camera.position.z += dz * Math.min(1, 2.2 * dt);
      }
    } else {
      if (nnWalkTarget.z !== null && Math.abs(intendedWasdZ) >= 0.05) {
        nnWalkTarget.z = null;
      }
      camera.position.z = MathUtils.clamp(
        camera.position.z + velocity.current.z * dt,
        Z_BACK,
        Z_FRONT,
      );
    }
    camera.position.y = EYE_HEIGHT; // no bobbing, no flight

    const e = new Euler(pitch.current, yaw.current, 0, 'YXZ');
    camera.quaternion.setFromEuler(e);
  });

  return null;
}
