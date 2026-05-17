import { create } from 'zustand';

type SceneKey = 'desk' | 'city' | 'nn';

interface AudioState {
  enabled: boolean;
  scene: SceneKey;
  masterGain: number;
  toggle: () => void;
  setScene: (s: SceneKey) => void;
}

export const useAudioStore = create<AudioState>(set => ({
  enabled: false,
  scene: 'desk',
  masterGain: 0.7,
  toggle: () => set(s => ({ enabled: !s.enabled })),
  setScene: scene => set({ scene }),
}));
