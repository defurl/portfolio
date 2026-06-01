import { useMemo } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import { useCityStore } from '../../lib/stores/cityStore';
import { VOXEL_GLOW } from '../../lib/style/colors';

// Twinkling, glowing street waypoints for click-to-walk navigation.
//
// These rings are placed at key street intersections along our avenues (x = -7m / +7m)
// and cross-streets (z = -22.5m, 0m, 22.5m). They are only visible and interactive
// when navigationMode === 'street'.
//
// Tapping a ring sets `streetWalkTarget` in the store, and the CameraRig
// smoothly glides the camera there.

const WAYPOINTS: ReadonlyArray<[number, number, number]> = [
  [-7.0, 0.06, -38.0],
  [-7.0, 0.06, -22.5], // Intersections left
  [-7.0, 0.06, 0.0],
  [-7.0, 0.06, 22.5],
  [-7.0, 0.06, 38.0],

  [7.0, 0.06, -38.0],
  [7.0, 0.06, -22.5], // Intersections right
  [7.0, 0.06, 0.0],
  [7.0, 0.06, 22.5],
  [7.0, 0.06, 38.0],

  [0.0, 0.06, -22.5], // Bridges / cross street crossings
  [0.0, 0.06, 0.0],
  [0.0, 0.06, 22.5],
  [0.0, 0.06, 30.0], // Initial street intersection spawn
];

export function CityWaypoints() {
  const navigationMode = useCityStore((s) => s.navigationMode);
  const currentTarget = useCityStore((s) => s.streetWalkTarget);
  const setWalkTarget = useCityStore((s) => s.setStreetWalkTarget);

  const activePoints = useMemo(() => {
    return WAYPOINTS;
  }, []);

  if (navigationMode !== 'street') return null;

  return (
    <group>
      {activePoints.map((p, idx) => {
        const isTarget = currentTarget && currentTarget[0] === p[0] && currentTarget[2] === p[2];
        const onClick = (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          // Update the target coordinates in the store
          setWalkTarget(p);
        };

        return (
          <mesh
            key={`waypoint-${idx}`}
            position={p}
            rotation={[-Math.PI / 2, 0, 0]}
            onClick={onClick}
          >
            {/* Inner + outer rings */}
            <ringGeometry args={[0.4, 0.52, 24]} />
            <meshBasicMaterial
              color={VOXEL_GLOW}
              transparent
              opacity={isTarget ? 0.95 : 0.45}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
