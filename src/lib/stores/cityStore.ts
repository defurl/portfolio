import { create } from 'zustand';
import { districtOf, type District } from '../content/buildings';

// City interaction state. Three camera modes, plus the currently hovered
// building id (debounced 200ms by the InteractiveBuilding wrapper).

export type CityFocus =
  | { mode: 'overview' }
  | { mode: 'district'; district: District }
  | { mode: 'building'; buildingId: string };

interface CityState {
  focus: CityFocus;
  hovered: string | null;
  setHovered: (id: string | null) => void;
  zoomDistrict: (d: District) => void;
  openBuilding: (id: string) => void;
  backToOverview: () => void;
  backToDistrict: () => void;
}

export const useCityStore = create<CityState>((set, get) => ({
  focus: { mode: 'overview' },
  hovered: null,
  setHovered: (hovered) => set({ hovered }),
  zoomDistrict: (district) => set({ focus: { mode: 'district', district }, hovered: null }),
  openBuilding: (buildingId) => set({ focus: { mode: 'building', buildingId }, hovered: null }),
  backToOverview: () => set({ focus: { mode: 'overview' }, hovered: null }),
  backToDistrict: () => {
    // From building → back to the building's parent district. We look the
    // district up via the placement registry so the store never needs to
    // store district alongside building id.
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
