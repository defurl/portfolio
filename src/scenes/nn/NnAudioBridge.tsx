import { useFrame, useThree } from '@react-three/fiber';
import { setNnTraversal } from '../../audio/engine';
import { HALL_TOTAL_Z } from './nnLighting';

// Phase 4D §4.20 — feed camera z-position into the NN audio engine.
// camera.z runs from ~+2 (entry portal) to ~−HALL_TOTAL_Z (back wall);
// map into [0, 1] and forward to engine.setNnTraversal which lifts the
// drone bus's filter cutoff smoothly.
//
// Only emits when the value actually changes by a meaningful amount, to
// keep the Tone.js rampTo schedule clean.
const STEP = 0.02;
let lastEmitted = -1;

export function NnAudioBridge() {
  const camera = useThree((s) => s.camera);
  useFrame(() => {
    const t = Math.max(0, Math.min(1, (2 - camera.position.z) / (HALL_TOTAL_Z + 2)));
    if (Math.abs(t - lastEmitted) < STEP) return;
    lastEmitted = t;
    setNnTraversal(t);
  });
  return null;
}
