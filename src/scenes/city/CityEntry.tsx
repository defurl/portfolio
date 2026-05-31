import { useEffect } from 'react';
import { useCityStore } from '../../lib/stores/cityStore';
import { useTransitionStore } from '../../lib/stores/transitionStore';
import { useSceneStore } from '../../lib/stores/sceneStore';

// Manages the transition timeline for both city entry paths.
//
//   'from-window' (desk → /city):
//     - SceneFade is currently 'black' (set by useDeskToCity before navigate).
//     - CityCameraRig's mount-effect set the camera to the south entry pose
//       and queued its own glide to overview over 2s.
//     - This component just times the fade-in (1200ms) and the entry-mode
//       reset (after the glide settles).
//
//   'deep-link' (cold visit to /city):
//     - SceneFade starts 'idle'. We force it to 'black' on mount so the
//       1.2s fade-in is visible.
//     - No camera glide — rig is already at overview.
//     - Per FR-26 / reduced-motion, snap to idle without fade.

const FADE_IN_MS = 1200;
const ENTRY_SETTLE_MS = 2400;

export function CityEntry() {
  useEffect(() => {
    const entry = useCityStore.getState().entry;
    const reduced = useSceneStore.getState().prefersReducedMotion;
    const tx = useTransitionStore.getState();

    if (reduced) {
      tx.setPhase('idle');
      useCityStore.getState().setEntry('deep-link');
      return;
    }

    if (entry === 'deep-link') {
      // Cold visit — set black, then fade in next frame.
      tx.setPhase('black');
      const raf = requestAnimationFrame(() =>
        useTransitionStore.getState().setPhase('fading-in'),
      );
      const t = setTimeout(() => {
        useTransitionStore.getState().setPhase('idle');
      }, FADE_IN_MS + 100);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(t);
      };
    }

    // from-window: the rig already set position; the rig's effect also
    // queued the fade-in. We just clean up entry mode and idle the fade
    // after the glide settles.
    const t = setTimeout(() => {
      useCityStore.getState().setEntry('deep-link');
      useTransitionStore.getState().setPhase('idle');
    }, ENTRY_SETTLE_MS);
    return () => clearTimeout(t);
  }, []);

  return null;
}
