import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useSceneStore } from '../../../lib/stores/sceneStore';
import { useAdaptiveFps } from '../../../lib/perf/useAdaptiveFps';

// Phase 3 city bloom. At Checkpoint A the only thing in the city that should
// bloom is the river (emissive 0.5-0.7 toneMapped:false → luminance comfortably
// above the threshold). The ground plane sits at emissive 0.02 — well below.
//
// Disabled under prefers-reduced-motion or sustained low FPS — same escape
// hatches as the desk bloom.
export function CityBloom() {
  const reduced = useSceneStore((s) => s.prefersReducedMotion);
  const isMobile = useSceneStore((s) => s.isMobile);
  const lowFps = useAdaptiveFps(50, 2000);

  if (reduced || lowFps || isMobile) return null;

  return (
    <EffectComposer>
      <Bloom
        intensity={0.7}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.5}
        mipmapBlur
      />
    </EffectComposer>
  );
}
