import { useEffect } from 'react';
import { useAudioStore } from '../lib/stores/audioStore';
import { useSceneStore } from '../lib/stores/sceneStore';
import { useMarketStore, subscribeTickEvent } from '../lib/stores/marketStore';
import { setEnabled, setIndex, setScene, setReducedMotion, pushTick } from '../audio/engine';

// Bridges the audio store + market state to the audio engine (Phase 2C).
// Renders nothing. When `enabled` flips, drives the engine; the first
// flip-to-true happens inside the AudioToggle click handler's call stack, so
// Tone's user-gesture unlock is satisfied. Audio is OFF by default — the
// engine is only ever touched after an explicit toggle.
export function DeskAudio() {
  const enabled = useAudioStore((s) => s.enabled);
  const scene = useAudioStore((s) => s.scene);
  const reduced = useSceneStore((s) => s.prefersReducedMotion);
  const index = useMarketStore((s) => s.index);

  // Enable/disable. After build, fan out current state so the engine is in
  // sync without waiting for the next emission.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await setEnabled(enabled);
      if (cancelled || !enabled) return;
      setReducedMotion(reduced);
      setScene(scene);
      const snap = useMarketStore.getState().index;
      if (snap) setIndex(snap);
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, reduced, scene]);

  // Push index updates so pad mode + bass tempo track the market.
  useEffect(() => {
    if (index) setIndex(index);
  }, [index]);

  // Tick percussion — every tick goes through the engine's volume threshold.
  useEffect(() => subscribeTickEvent(pushTick), []);

  return null;
}
