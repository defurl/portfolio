import { useMemo } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import { VOXEL_GLOW_SOFT } from '../../lib/style/colors';
import { useSceneStore } from '../../lib/stores/sceneStore';
import {
  GAP_LENGTH,
  LAYER_COUNT,
  LAYER_LENGTH,
} from './nnLighting';
import { setNnWalkTarget } from './nnWalkTarget';

// Phase 4D §4.21 — mobile tap-to-walk waypoints.
//
// On mobile only. Renders a small faint ring on the corridor floor at each
// layer's mid-point. Tap glides the camera to that z over ~1s (handled by
// NnCameraControls reading nnWalkTarget). First-person joystick controls
// cause sim-sickness; discrete glide points avoid that.

const RING_RADIUS = 0.5;
const RING_TUBE = 0.05;
const RING_Y = 0.03;

function layerCenterZ(layerIndex: number): number {
  const start = -(layerIndex * (LAYER_LENGTH + GAP_LENGTH));
  return start - LAYER_LENGTH / 2;
}

export function NnWaypoints() {
  const isMobile = useSceneStore((s) => s.isMobile);

  const positions = useMemo(() => {
    const out: Array<[number, number, number]> = [];
    for (let i = 0; i < LAYER_COUNT; i++) {
      out.push([0, RING_Y, layerCenterZ(i)]);
    }
    return out;
  }, []);

  if (!isMobile) return null;

  return (
    <group>
      {positions.map((p, i) => {
        const onClick = (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          setNnWalkTarget(p[2]);
        };
        return (
          <mesh
            key={i}
            position={p}
            rotation={[-Math.PI / 2, 0, 0]}
            onClick={onClick}
          >
            <ringGeometry args={[RING_RADIUS - RING_TUBE, RING_RADIUS, 24]} />
            <meshBasicMaterial
              color={VOXEL_GLOW_SOFT}
              transparent
              opacity={0.55}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
