import { useEffect } from 'react';
import { useAudioStore } from '../lib/stores/audioStore';
import { setDeskAudio } from '../audio/engine';

// Bridges the audio store to the audio engine (1.18). Renders nothing.
// When `enabled` flips, drives the Tone.js loop. The first flip-to-true
// happens inside the AudioToggle click handler's call stack, so Tone's
// user-gesture unlock is satisfied.
//
// Audio is OFF by default (audioStore initial state) — no autoplay. The
// engine is only ever touched after an explicit toggle.
export function DeskAudio() {
  const enabled = useAudioStore(s => s.enabled);

  useEffect(() => {
    // Skip the initial mount when audio is off — don't import Tone until
    // the visitor actually opts in.
    if (!enabled) {
      void setDeskAudio(false);
      return;
    }
    void setDeskAudio(true);
  }, [enabled]);

  return null;
}
