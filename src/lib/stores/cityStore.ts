import { create } from 'zustand';
import { districtOf, type District } from '../content/buildings';

// City interaction state. Three camera modes, plus the currently hovered
// building id (debounced 200ms by the InteractiveBuilding wrapper).

export type CityFocus =
  | { mode: 'overview' }
  | { mode: 'district'; district: District }
  | { mode: 'building'; buildingId: string };

// How the visitor arrived at /city. `from-window` triggers a south-to-north
// glide-in; `deep-link` mounts directly at overview. The desk's window click
// sets this to 'from-window' before navigating; clearing back to 'deep-link'
// happens after the glide completes so refreshes don't replay the entry.
export type CityEntry = 'deep-link' | 'from-window';
export type NavigationMode = 'orbit' | 'street';

interface CityState {
  focus: CityFocus;
  hovered: string | null;
  entry: CityEntry;
  navigationMode: NavigationMode;
  streetWalkTarget: [number, number, number] | null;
  setHovered: (id: string | null) => void;
  zoomDistrict: (d: District) => void;
  openBuilding: (id: string) => void;
  backToOverview: () => void;
  backToDistrict: () => void;
  setEntry: (e: CityEntry) => void;
  setNavigationMode: (mode: NavigationMode) => void;
  setStreetWalkTarget: (target: [number, number, number] | null) => void;
}

export const useCityStore = create<CityState>((set, get) => ({
  focus: { mode: 'overview' },
  hovered: null,
  entry: 'deep-link',
  navigationMode: 'orbit',
  streetWalkTarget: null,
  setHovered: (hovered) => set({ hovered }),
  setEntry: (entry) => set({ entry }),
  setNavigationMode: (navigationMode) => {
    // Reset focus to overview when entering orbit mode
    if (navigationMode === 'orbit') {
      set({ focus: { mode: 'overview' }, hovered: null, streetWalkTarget: null });
    } else {
      // Placing user on the center avenue street-intersection on entry
      set({ hovered: null, streetWalkTarget: [0, 1.65, 0] });
    }
    set({ navigationMode });
  },
  setStreetWalkTarget: (streetWalkTarget) => set({ streetWalkTarget }),
  zoomDistrict: (district) => set({ focus: { mode: 'district', district }, hovered: null }),
  openBuilding: (buildingId) => set({ focus: { mode: 'building', buildingId }, hovered: null }),
  backToOverview: () => set({ focus: { mode: 'overview' }, hovered: null, navigationMode: 'orbit' }),
  backToDistrict: () => {
    const f = get().focus;
    if (f.mode !== 'building') {
      set({ focus: { mode: 'overview' }, hovered: null });
      return;
    }
    const district = districtOf(f.buildingId);
    if (!district) {
      set({ focus: { mode: 'overview' }, hovered: null });
      return;
    }
    set({ focus: { mode: 'district', district }, hovered: null });
  },
}));

