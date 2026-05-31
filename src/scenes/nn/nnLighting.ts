// Phase 4A — Tadao Ando concrete-hall lighting constants.
//
// The composition: low cold ambient to preserve shadow depth, plus a small
// number of directional "ceiling-gap" shafts cutting diagonally across the
// hall. No fill lights — Ando-coded contrast comes from the high ratio
// between the lit slabs and the deep-shadow concrete corners.

export const HEMISPHERE_INTENSITY = 0.18;

// Diagonal light shafts cast from above through ceiling gaps. Positions are
// in world space along the corridor (z-axis). The hall runs along -z; +x is
// the right wall. Shafts are placed at the gap-midpoints between layers.
export const SHAFT_POSITIONS: ReadonlyArray<[number, number, number]> = [
  [3, 14, -2],
  [-3, 14, -17],
  [3, 14, -32],
  [-3, 14, -47],
];
export const SHAFT_TARGETS: ReadonlyArray<[number, number, number]> = [
  [-1, 0, -2],
  [1, 0, -17],
  [-1, 0, -32],
  [1, 0, -47],
];
export const SHAFT_INTENSITY = 3.5;

// Hall geometry — keep canonical so geometry + camera + controls + audio all
// agree on bounds. Values in metres.
export const HALL_WIDTH = 6;
export const HALL_HEIGHT = 10;
export const LAYER_LENGTH = 15; // each transformer layer's corridor segment
export const LAYER_COUNT = 4;
export const GAP_LENGTH = 1.5; // ceiling gap between layers (light-shaft slot)
export const HALL_TOTAL_Z = LAYER_COUNT * LAYER_LENGTH + (LAYER_COUNT - 1) * GAP_LENGTH;
