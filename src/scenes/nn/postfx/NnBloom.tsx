import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useNnSettingsStore } from '../../../lib/stores/nnSettingsStore';
import { useSceneStore } from '../../../lib/stores/sceneStore';
import { useAdaptiveFps } from '../../../lib/perf/useAdaptiveFps';

// Phase 4B §4.10 — high-fi bloom catches the wall neuron lights and the
// token-path particles (both MeshBasicMaterial with toneMapped:false so
// their luminance reads above the bloom threshold).
//
// Disabled when:
//   - Standard mode (default — perf-safe)
//   - prefers-reduced-motion
//   - Adaptive FPS drops sustained low
//   - Mobile (per §4.21 future-work)
export function NnBloom() {
  const highFi = useNnSettingsStore((s) => s.highFi);
  const reduced = useSceneStore((s) => s.prefersReducedMotion);
  const isMobile = useSceneStore((s) => s.isMobile);
  const lowFps = useAdaptiveFps(50, 2000);

  if (!highFi || reduced || lowFps || isMobile) return null;

  return (
    <EffectComposer>
      <Bloom
        intensity={1.1}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.4}
        mipmapBlur
      />
    </EffectComposer>
  );
}
