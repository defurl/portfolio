import { useFrame } from '@react-three/fiber';
import { useMarketStore } from '../../lib/stores/marketStore';
import { useSceneStore } from '../../lib/stores/sceneStore';
import { directionPulse, TARGET_BY_DIR } from './directionPulse';

// Lerps the shared `directionPulse.value` toward the index-direction target.
// Renders nothing. Runs ~3-second time-constant; snaps under reduced motion.
const LERP_K = 0.35;

export function PulseController() {
  useFrame((_, dt) => {
    const dir = useMarketStore.getState().index?.direction ?? 'flat';
    const reduced = useSceneStore.getState().prefersReducedMotion;
    const target = TARGET_BY_DIR[dir];
    if (reduced) {
      directionPulse.value = target;
      return;
    }
    directionPulse.value += (target - directionPulse.value) * Math.min(1, LERP_K * dt);
  });
  return null;
}
