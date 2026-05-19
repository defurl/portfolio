// Lighting values for the desk scene. EXACT specs from `lighting-plan.svg`.
// Tune only with owner sign-off. The plan is the contract; this file mirrors it.
//
// Color routing: hexes in the SVG map to design-spec tokens from
// `src/lib/style/colors.ts` — those imports stay the single source of truth
// for the palette (also what keeps `pnpm lint:colors` happy).

// ── KEY: lamp ─────────────────────────────────────────────────────────────────
// #FFB661 = LAMP_WARM. Position is the bulb's world coordinate; the lamp's
// arm/shade geometry must agree visually (see `objects/Lamp.tsx`).
export const LAMP_POSITION = [-0.95, 0.35, -0.2] as const;
export const LAMP_INTENSITY = 8.0;
export const LAMP_DISTANCE = 2.0;
export const LAMP_DECAY = 2;

// ── FILL: monitor 1 & 2 ──────────────────────────────────────────────────────
// #5BC8FF = VOXEL_GLOW.
export const MONITOR_FILL_POSITIONS = [
  [-0.3, 0.55, -0.4] as const,
  [0.5, 0.55, -0.4] as const,
];
export const MONITOR_FILL_INTENSITY = 3.2;
export const MONITOR_FILL_DISTANCE = 1.5;
export const MONITOR_FILL_DECAY = 2;

// ── RIM: window directional ──────────────────────────────────────────────────
// #2A6B8A = VOXEL_GLOW_SOFT. Direction is FROM this position TOWARD origin.
export const WINDOW_RIM_POSITION = [1.4, 1.0, -0.6] as const;
export const WINDOW_RIM_TARGET = [0, 0.5, 0] as const;
export const WINDOW_RIM_INTENSITY = 1.2;

// ── DOOR SPILL: off-frame warm ───────────────────────────────────────────────
// #FFB661 = LAMP_WARM (same as the lamp; both warm sources).
// EXACT from lighting-plan. Visibility requires the camera to reach z=+1.0
// floor in its FOV — see camera config in `routes/DeskRoute.tsx`.
export const DOOR_SPILL_POSITION = [-1.8, 0.4, 1.0] as const;
export const DOOR_SPILL_INTENSITY = 2.4;
export const DOOR_SPILL_DISTANCE = 2.5;
export const DOOR_SPILL_DECAY = 2;

// ── AMBIENT ──────────────────────────────────────────────────────────────────
// #0A0F1A = BG_NIGHT.
export const AMBIENT_INTENSITY = 0.15;
