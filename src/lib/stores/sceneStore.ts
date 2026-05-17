import { create } from 'zustand';

type SceneKey = 'desk' | 'city' | 'nn';

interface SceneState {
  current: SceneKey;
  transitioning: boolean;
  prefersReducedMotion: boolean;
  setScene: (s: SceneKey) => void;
  setTransitioning: (t: boolean) => void;
  setPrefersReducedMotion: (r: boolean) => void;
}

export const useSceneStore = create<SceneState>(set => ({
  current: 'desk',
  transitioning: false,
  prefersReducedMotion: false,
  setScene: current => set({ current }),
  setTransitioning: transitioning => set({ transitioning }),
  setPrefersReducedMotion: prefersReducedMotion => set({ prefersReducedMotion }),
}));
