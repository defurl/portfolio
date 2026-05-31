import { create } from 'zustand';

// Phase 4B U20 — high-fidelity vs standard rendering toggle.
//
// Standard (default):
//   - Volumetric postfx bloom disabled
//   - Particle counts on token splines reduced to 25%
//   - No dynamic shadows on wall neuron lights
//
// High-Fi:
//   - Full bloom enabled
//   - 100% particle density + noise turbulence on splines
//   - Dynamic shadows enabled
//
// Lives outside sceneStore so City/Desk routes don't subscribe to NN-only
// settings. Persists only for the session — no localStorage, intentional:
// returning visitors get the perf-safe default.

interface NnSettingsState {
  highFi: boolean;
  toggleHighFi: () => void;
  setHighFi: (v: boolean) => void;
}

export const useNnSettingsStore = create<NnSettingsState>((set) => ({
  highFi: false,
  toggleHighFi: () => set((s) => ({ highFi: !s.highFi })),
  setHighFi: (highFi) => set({ highFi }),
}));
