import { create } from 'zustand';

type SceneKey = 'desk' | 'city' | 'nn';

interface AudioState {
  enabled: boolean;
  scene: SceneKey;
  masterGain: number;
  toggle: () => void;
  setScene: (s: SceneKey) => void;
}

const getInitialEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem('audio-enabled');
    return stored === 'true';
  } catch {
    return false;
  }
};

export const useAudioStore = create<AudioState>(set => ({
  enabled: getInitialEnabled(),
  scene: 'desk',
  masterGain: 0.7,
  toggle: () => set(s => {
    const nextVal = !s.enabled;
    try {
      localStorage.setItem('audio-enabled', String(nextVal));
    } catch {
      // ignore sandbox / quota errors
    }
    return { enabled: nextVal };
  }),
  setScene: scene => set({ scene }),
}));

