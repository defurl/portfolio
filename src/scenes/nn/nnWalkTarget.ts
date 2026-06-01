// Phase 4D §4.21 — module-level ref used by NnWaypoints (tap target setter)
// and NnCameraControls (per-frame lerp consumer). Avoids a React-store
// subscription on the camera frame loop.
//
// Value is the target z-position; null means "no waypoint pending — visitor
// is driving via WASD".

export const nnWalkTarget: { z: number | null } = { z: null };

export function setNnWalkTarget(z: number | null): void {
  nnWalkTarget.z = z;
}
