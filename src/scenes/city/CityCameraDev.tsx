import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useCityStore } from '../../lib/stores/cityStore';
import { getCityBuildings, type District } from '../../lib/content/buildings';

// DEV-only camera override for Phase 3 verification captures. Exposes
// `window.__city.setCamera(pos, target)` so the capture script can frame the
// sky band (which isn't visible at the spec overview camera until buildings
// stick up above the ground plane). Dead-code-eliminated in production.

export function CityCameraDev() {
  const camera = useThree((s) => s.camera);
  const targetRef = useRef<Vector3 | null>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as { __city?: Record<string, unknown> };
    const ns: Record<string, unknown> = w.__city ?? {};
    ns.setCamera = (
      pos: [number, number, number],
      target: [number, number, number],
    ) => {
      camera.position.set(...pos);
      targetRef.current = new Vector3(...target);
      camera.lookAt(targetRef.current);
    };
    // Phase 3C verification hooks — exposed at the top level (window.*) so
    // the capture script can drive the interaction state machine without
    // having to compute on-screen coordinates for ray-cast clicks.
    const top = window as unknown as Record<string, unknown>;
    top.__city_zoomDistrict = (d: District) =>
      useCityStore.getState().zoomDistrict(d);
    top.__city_openBuilding = (id: string) =>
      useCityStore.getState().openBuilding(id);
    top.__city_hoverBuilding = (id: string | null) =>
      useCityStore.getState().setHovered(id);
    top.__city_backToOverview = () =>
      useCityStore.getState().backToOverview();
    top.__city_firstBuildingInDistrict = (d: District) =>
      getCityBuildings().buildings.find((b) => b.district === d)?.id ?? null;
    w.__city = ns;
  }, [camera]);

  useFrame(() => {
    if (targetRef.current) camera.lookAt(targetRef.current);
  });

  return null;
}
