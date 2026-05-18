import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useSceneStore } from '../../../lib/stores/sceneStore';
import { useAdaptiveFps } from '../../../lib/perf/useAdaptiveFps';

// Phase 1.3 — selective bloom on the lamp bulb + monitor screens.
//
// Single EffectComposer with a wide-kernel warm bloom tuned via
// luminanceThreshold so only the truly bright emissives (the lamp bulb
// and the monitor emissive planes) pass through. A second pass with a
// tighter kernel hugs the monitor screens without washing the desk.
//
// Bloom is disabled when:
//   - prefers-reduced-motion is active (vestibular caution; static bloom
//     is fine in principle but cheap to drop)
//   - sustained FPS drops below 50 for 2s (adaptive perf)
export function BloomLayer() {
  const reduced = useSceneStore(s => s.prefersReducedMotion);
  const lowFps = useAdaptiveFps(50, 2000);

  if (reduced || lowFps) return null;

  return (
    <EffectComposer>
      {/* Warm bloom — luminance threshold tuned so only the lamp bulb passes.
          The lamp bulb's emissiveIntensity is 4 with toneMapped:false, which
          puts its luminance comfortably above 1.0 in linear space. */}
      <Bloom
        intensity={0.85}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.2}
        mipmapBlur
      />
      {/* Cool/tight bloom hugging monitor screens. Lower threshold catches
          the dimmer monitor emissives without picking up the lamp twice. */}
      <Bloom
        intensity={0.35}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.4}
        mipmapBlur
      />
    </EffectComposer>
  );
}
