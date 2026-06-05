import { useTexture } from '@react-three/drei';
import { useMemo } from 'react';
import { RepeatWrapping, type Texture } from 'three';
import { useSceneStore } from '../../lib/stores/sceneStore';

// PBR concrete material for the NN hall. Loads normal + roughness maps from
// Concrete033 (CC0, ambientcg.com) and tints them with the existing palette
// color so the macro mood stays Ando-dark while micro-surface detail comes
// alive under the diagonal shafts.
//
// We deliberately do not load the diffuse (color) map — the existing
// CONCRETE_COLOR / COLUMN_ACCENT tints from `colors.ts` are the source of
// truth for the corridor's tonal palette. The texture only contributes
// normal-mapped pitting + spatial roughness variation.
//
// Gated by isMobile: desktop gets PBR, mobile keeps the flat path. The
// textures are ~1.2MB combined which is fine on desktop but worth saving
// on mobile data plans.

const NORMAL_PATH = '/textures/concrete/Concrete033_2K-JPG_NormalGL.jpg';
const ROUGHNESS_PATH = '/textures/concrete/Concrete033_2K-JPG_Roughness.jpg';

// Preload so toggling between scenes doesn't restart the download.
useTexture.preload([NORMAL_PATH, ROUGHNESS_PATH]);

function configure(t: Texture, u: number, v: number): Texture {
  t.wrapS = RepeatWrapping;
  t.wrapT = RepeatWrapping;
  t.repeat.set(u, v);
  t.needsUpdate = true;
  return t;
}

interface ConcreteSurfaceProps {
  /** Tile repeats in U direction (typically surface-width-in-meters / 2). */
  uRepeat: number;
  /** Tile repeats in V direction (typically surface-height-in-meters / 2). */
  vRepeat: number;
  /** Macro color — palette token, multiplied with the texture. */
  color: string;
  /** Base roughness multiplier on top of the roughness map. */
  roughness?: number;
  /** Base metalness — concrete is non-metallic so default near zero. */
  metalness?: number;
}

function ConcretePBR({
  uRepeat,
  vRepeat,
  color,
  roughness = 0.95,
  metalness = 0.02,
}: ConcreteSurfaceProps) {
  const base = useTexture({
    normalMap: NORMAL_PATH,
    roughnessMap: ROUGHNESS_PATH,
  });

  const { normalMap, roughnessMap } = useMemo(
    () => ({
      normalMap: configure(base.normalMap.clone(), uRepeat, vRepeat),
      roughnessMap: configure(base.roughnessMap.clone(), uRepeat, vRepeat),
    }),
    [base, uRepeat, vRepeat],
  );

  return (
    <meshStandardMaterial
      color={color}
      normalMap={normalMap}
      roughnessMap={roughnessMap}
      roughness={roughness}
      metalness={metalness}
      normalScale-x={0.7}
      normalScale-y={0.7}
    />
  );
}

function ConcreteFlat({
  color,
  roughness = 0.95,
  metalness = 0.02,
}: ConcreteSurfaceProps) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
    />
  );
}

export function ConcreteSurface(props: ConcreteSurfaceProps) {
  const isMobile = useSceneStore((s) => s.isMobile);
  return isMobile ? <ConcreteFlat {...props} /> : <ConcretePBR {...props} />;
}
