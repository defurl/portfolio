// Phase 4C chamber configuration.
//
// Each project gets a recessed concrete chamber off the main hall. Chambers
// sit at the GAP_LENGTH slots between the four transformer layers — the same
// gaps that currently let the directional light shafts through. Inference
// chamber sits at the end of the hall.
//
// Each chamber:
//   - z: corridor z-position of its doorway centerline
//   - side: 'left' (-x) or 'right' (+x)
//   - projectId: matches content/projects.json id
//
// The inference chamber is special-cased: its id is 'inference' and it
// renders the U24 attention-head visualization instead of a project panel.

import { GAP_LENGTH, HALL_TOTAL_Z, LAYER_LENGTH } from './nnLighting';

export type ChamberSide = 'left' | 'right';

export interface ChamberConfig {
  readonly id: string;
  readonly projectId: string | null; // null = inference chamber
  readonly z: number;
  readonly side: ChamberSide;
  readonly label: string;
}

// Gap z-centers: layer N segment runs from z = -N*(LAYER+GAP) to that minus
// LAYER_LENGTH. The gap after layer N is at z = layerEnd - GAP/2.
function gapZ(layerIndex: number): number {
  const layerEndZ = -(layerIndex * (LAYER_LENGTH + GAP_LENGTH) + LAYER_LENGTH);
  return layerEndZ - GAP_LENGTH / 2;
}

export const CHAMBERS: ReadonlyArray<ChamberConfig> = [
  // Gap 1 (after layer 0) — ML project on the left
  {
    id: 'chamber-ml',
    projectId: 'svi-vol-surface',
    z: gapZ(0),
    side: 'left',
    label: '// ml',
  },
  // Gap 2 (after layer 1) — software project on the right
  {
    id: 'chamber-softwares',
    projectId: 'execution-sim',
    z: gapZ(1),
    side: 'right',
    label: '// softwares',
  },
  // Gap 3 (after layer 2) — coursework project on the left
  {
    id: 'chamber-coursework',
    projectId: 'feature-store',
    z: gapZ(2),
    side: 'left',
    label: '// coursework',
  },
  // End of hall — inference chamber, centered behind the back wall
  {
    id: 'chamber-inference',
    projectId: null,
    z: -HALL_TOTAL_Z - 0.01, // just past the back of the corridor
    side: 'right', // arbitrary; rendered centered
    label: '// inference',
  },
];

// Geometry constants used by NnChamber and NnScene.
export const CHAMBER_WIDTH = 5;
export const CHAMBER_DEPTH = 5;
export const CHAMBER_HEIGHT = 6;
export const CHAMBER_DOORWAY_WIDTH = 1.5;
export const CHAMBER_DOORWAY_HEIGHT = 2.4;

// Trigger zone radius — when the camera enters this XZ radius of the
// chamber's doorway, the "neuron activation" flash fires.
export const ENTRY_TRIGGER_RADIUS = 3.5;
