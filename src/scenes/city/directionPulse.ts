// Shared pulse multiplier driven by `marketStore.index.direction`.
//
// One controller component (PulseController) reads the store inside useFrame
// and lerps `value` toward the per-direction target. Each Building reads
// `value` in its own useFrame and applies it to its window emissive intensity.
//
// Using a module-level mutable ref is intentional: it lets dozens of buildings
// read the latest multiplier without any of them subscribing to Zustand or
// triggering re-renders. The pulse value lives outside React state — pure
// per-frame data.

export const directionPulse = { value: 1 };

// up = +15%, flat = 0, down = -15%. ~3-second lerp.
export const TARGET_BY_DIR: Record<'up' | 'flat' | 'down', number> = {
  up: 1.15,
  flat: 1.0,
  down: 0.85,
};
