import { create } from 'zustand';

// Cross-scene fade transitions. Phase 3D — the desk→city window-glide and
// the /city deep-link fade-in both run through this single store so there is
// one canonical timeline component (`<SceneFade>` at App root).
//
//   'idle'        — fully transparent, no-op
//   'fading-out'  — going to black (300ms)
//   'black'       — fully opaque, blocking input
//   'fading-in'   — coming back from black (1200ms)

export type FadePhase = 'idle' | 'fading-out' | 'black' | 'fading-in';

interface TransitionState {
  phase: FadePhase;
  setPhase: (p: FadePhase) => void;
}

export const useTransitionStore = create<TransitionState>((set) => ({
  phase: 'idle',
  setPhase: (phase) => set({ phase }),
}));
