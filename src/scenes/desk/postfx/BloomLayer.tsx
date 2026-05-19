import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useSceneStore } from '../../../lib/stores/sceneStore';
import { useAdaptiveFps } from '../../../lib/perf/useAdaptiveFps';

// Phase 1.3 — selective bloom on the lamp bulb + (later) monitor emissives.
//
// Thresholds match the materials in `lighting-plan.svg`:
//   - lamp bulb: MeshBasicMaterial, raw LAMP_WARM, toneMapped:false →
//     linear luminance well above 1.0 → warm bloom (threshold 0.6) catches.
//   - monitor 1 emissive: SIGNAL_AMBER_DIM at intensity 1.2 (added later) →
//     warm bloom catches the warm content tone.
//   - monitor 2 emissive: VOXEL_GLOW_SOFT at intensity 1.0 (added later) →
//     cool bloom (threshold 0.3) catches the cool content tone.
//
// Bloom disabled when prefers-reduced-motion is set OR when adaptive FPS
// detects sustained low frame rate. Both are intentional perf escape hatches.
export function BloomLayer() {
  const reduced = useSceneStore(s => s.prefersReducedMotion);
  const lowFps = useAdaptiveFps(50, 2000);

  if (reduced || lowFps) return null;

  return (
    <EffectComposer>
      {/* Warm bloom — catches the lamp bulb. Wider kernel for the soft halo. */}
      <Bloom
        intensity={1.1}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.25}
        mipmapBlur
      />
      {/* Cool/tight bloom — will catch monitor emissives once they're added. */}
      <Bloom
        intensity={0.45}
        luminanceThreshold={0.3}
        luminanceSmoothing={0.4}
        mipmapBlur
      />
    </EffectComposer>
  );
}
