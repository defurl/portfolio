import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide, Color, type ShaderMaterial } from 'three';
import {
  BG_NIGHT,
  BG_VOID,
  LAMP_WARM,
  VOXEL_GLOW_SOFT,
} from '../../lib/style/colors';
import { useMarketStore } from '../../lib/stores/marketStore';
import { useSceneStore } from '../../lib/stores/sceneStore';
import type { MarketSession } from '../../lib/data/types';

// Sky dome — large inverted-normal sphere with a vertex-position-driven
// gradient between `uHorizon` (low) and `uTop` (high). The horizon color
// tracks `marketStore.session`; the top stays at BG_VOID.

const VERTEX = /* glsl */ `
varying vec3 vLocalPos;
void main() {
  vLocalPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uFog;
varying vec3 vLocalPos;
// linear → sRGB encode. ShaderMaterial outputs raw, so we encode here
// because the canvas treats fragment output as sRGB.
vec3 linearToSrgb(vec3 c) {
  vec3 lower = c * 12.92;
  vec3 higher = 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055;
  return mix(higher, lower, step(c, vec3(0.0031308)));
}
void main() {
  // Three bands: fog → glow-strip → top, peaking at h ≈ 0.1.
  // This matches the fog-darkened ground at the horizon line so there is
  // no hard edge between ground and sky.
  float h = normalize(vLocalPos).y;
  float toGlow = smoothstep(-0.05, 0.1, h);  // 0 at horizon, 1 at glow peak
  float toTop  = smoothstep(0.1, 0.7, h);    // 0 at glow peak, 1 at zenith
  vec3 lin = mix(uFog, uHorizon, toGlow);
  lin = mix(lin, uTop, toTop);
  gl_FragColor = vec4(linearToSrgb(lin), 1.0);
}
`;

const horizonFor = (s: MarketSession): Color => {
  switch (s) {
    case 'pre-market':
      return new Color(BG_VOID).lerp(new Color(LAMP_WARM), 0.06);
    case 'open':
      return new Color(VOXEL_GLOW_SOFT);
    case 'lunch':
      return new Color(BG_NIGHT);
    case 'close':
      return new Color(BG_NIGHT).lerp(new Color(LAMP_WARM), 0.18);
    case 'after-hours':
      return new Color(BG_VOID).lerp(new Color(VOXEL_GLOW_SOFT), 0.12);
    case 'closed':
    default:
      return new Color(BG_VOID);
  }
};

// 6s to ~95% of target. k=0.5/sec → lerp factor per frame = 1 - exp(-k*dt);
// we approximate with linear k*dt which is close enough at small dt.
const LERP_K = 0.5;
const targetHorizon = new Color();

export function SkyDome() {
  const matRef = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTop: { value: new Color(BG_VOID) },
      uHorizon: { value: new Color(BG_VOID) },
      uFog: { value: new Color(BG_NIGHT) },
    }),
    [],
  );

  useFrame((_, dt) => {
    const mat = matRef.current;
    if (!mat) return;
    const session = useMarketStore.getState().session;
    const reduced = useSceneStore.getState().prefersReducedMotion;
    targetHorizon.copy(horizonFor(session));
    const horizonUniform = mat.uniforms.uHorizon!.value as Color;
    if (reduced) horizonUniform.copy(targetHorizon);
    else horizonUniform.lerp(targetHorizon, Math.min(1, LERP_K * dt));
  });

  return (
    <mesh renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[200, 32, 16]} />
      <shaderMaterial
        ref={matRef}
        side={BackSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
      />
    </mesh>
  );
}
