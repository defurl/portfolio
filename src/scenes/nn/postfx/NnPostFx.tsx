import { EffectComposer, Bloom, N8AO } from '@react-three/postprocessing';
import { useNnSettingsStore } from '../../../lib/stores/nnSettingsStore';
import { useSceneStore } from '../../../lib/stores/sceneStore';
import { useAdaptiveFps } from '../../../lib/perf/useAdaptiveFps';
import { BG_VOID } from '../../../lib/style/colors';

// NN postfx stack — N8AO (ambient occlusion) + Bloom, in one EffectComposer.
//
// N8AO grounds the concrete corridor: wall/floor seams, column-base contacts,
// and ceiling-corner shadows that the flat directional shafts can't produce.
// This is the single biggest "boxes → real image" lift before PBR textures
// land, because it transforms ambient-lit corners from flat grey to occluded.
//
// Both effects gated by hi-fi (default off), prefers-reduced-motion, mobile,
// and adaptive-fps drop. Same gate set as the original NnBloom — the AO cost
// is roughly equivalent to Bloom on a corridor this size, so the perf budget
// is unchanged from the Phase 4B baseline.
export function NnPostFx() {
  const highFi = useNnSettingsStore((s) => s.highFi);
  const reduced = useSceneStore((s) => s.prefersReducedMotion);
  const isMobile = useSceneStore((s) => s.isMobile);
  const lowFps = useAdaptiveFps(50, 2000);

  if (!highFi || reduced || lowFps || isMobile) return null;

  return (
    <EffectComposer>
      <N8AO
        aoRadius={1.5}
        distanceFalloff={0.5}
        intensity={2.2}
        quality="medium"
        color={BG_VOID}
        halfRes={false}
      />
      <Bloom
        intensity={1.1}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.4}
        mipmapBlur
      />
    </EffectComposer>
  );
}
