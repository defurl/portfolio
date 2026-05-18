// Lighting values for the desk scene. Positions and intensities are tuned for
// the cinematic 3am vibe: warm lamp pool dominates, cool monitor/window fills
// just enough to silhouette objects, ambient is nearly zero.
//
// Reference: design-spec.jsonc `scenes.night_desk.lighting` and Phase 1.2.

export const LAMP_POSITION = [0.9, 1.4, -0.2] as const;
export const LAMP_INTENSITY = 6.5;
export const LAMP_DISTANCE = 4.5;
export const LAMP_DECAY = 1.8;

// Monitor fills sit just in front of each screen, low and small.
export const MONITOR_FILL_POSITIONS = [
  [-0.3, 0.55, -0.15] as const,
  [0.5, 0.55, -0.15] as const,
];
export const MONITOR_FILL_INTENSITY = 0.9;
export const MONITOR_FILL_DISTANCE = 2.2;
export const MONITOR_FILL_DECAY = 2.0;

// Rim from the window — directional, low intensity, cool.
export const WINDOW_RIM_DIRECTION = [3.5, 1.5, -1.2] as const;
export const WINDOW_RIM_INTENSITY = 0.35;

// Door spill — warm pool on the floor camera-left. No geometry, just light.
export const DOOR_SPILL_POSITION = [-2.6, 0.6, 0.8] as const;
export const DOOR_SPILL_INTENSITY = 1.4;
export const DOOR_SPILL_DISTANCE = 3.5;
export const DOOR_SPILL_DECAY = 2.0;

// Ambient — barely there. The room is dark.
export const AMBIENT_INTENSITY = 0.06;
