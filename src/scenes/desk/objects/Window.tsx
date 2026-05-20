import { BG_NIGHT, BG_PANEL, BG_VOID, VOXEL_GLOW_SOFT } from '../../../lib/style/colors';

// Phase 1 revision — window mounted on the BACK wall, facing the camera.
// (Previously had rotation `[0, -PI/2, 0]` as if mounted on a right-side wall,
// but the scene only has a back wall, so the window was floating mid-air.)
//
// Glass is NOT a saturated cyan plane. It's a near-transparent
// `MeshPhysicalMaterial` with `color: BG_NIGHT` — the cool cast we see
// comes from the rim DirectionalLight passing through, not from the glass
// being tinted. The "city beyond" is a placeholder plane behind the window.

interface WindowProps {
  position: [number, number, number];
}

const W = 0.7;
const H = 1.0;
const FRAME_T = 0.04;
const FRAME_DEPTH = 0.06;
const GLASS_THICKNESS = 0.02;

export function Window({ position }: WindowProps) {
  return (
    <group position={position}>
      {/* Top frame */}
      <mesh castShadow position={[0, H / 2 - FRAME_T / 2, 0]}>
        <boxGeometry args={[W, FRAME_T, FRAME_DEPTH]} />
        <meshStandardMaterial color={BG_PANEL} roughness={0.7} metalness={0.15} />
      </mesh>
      {/* Bottom frame */}
      <mesh castShadow position={[0, -H / 2 + FRAME_T / 2, 0]}>
        <boxGeometry args={[W, FRAME_T, FRAME_DEPTH]} />
        <meshStandardMaterial color={BG_PANEL} roughness={0.7} metalness={0.15} />
      </mesh>
      {/* Left frame */}
      <mesh castShadow position={[-W / 2 + FRAME_T / 2, 0, 0]}>
        <boxGeometry args={[FRAME_T, H - FRAME_T * 2, FRAME_DEPTH]} />
        <meshStandardMaterial color={BG_PANEL} roughness={0.7} metalness={0.15} />
      </mesh>
      {/* Right frame */}
      <mesh castShadow position={[W / 2 - FRAME_T / 2, 0, 0]}>
        <boxGeometry args={[FRAME_T, H - FRAME_T * 2, FRAME_DEPTH]} />
        <meshStandardMaterial color={BG_PANEL} roughness={0.7} metalness={0.15} />
      </mesh>
      {/* Center horizontal mullion */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[W - FRAME_T * 2, FRAME_T * 0.4, FRAME_DEPTH * 0.6]} />
        <meshStandardMaterial color={BG_PANEL} roughness={0.7} metalness={0.15} />
      </mesh>

      {/* Glass — transmissive, near-untinted. */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[W - FRAME_T * 2, H - FRAME_T * 2, GLASS_THICKNESS]} />
        <meshPhysicalMaterial
          color={BG_NIGHT}
          transmission={0.3}
          roughness={0.05}
          metalness={0}
          ior={1.45}
          thickness={0.05}
        />
      </mesh>

      {/* City beyond — placeholder. Sits ~30cm behind the window glass.
          Sized just slightly larger than the opening (window + frame) so it
          fills the visible cutout without extending past the wall edges
          (which would show the city in the open space beyond the wall). */}
      <mesh position={[0, 0.05, -0.3]}>
        <planeGeometry args={[W * 0.95, H * 1.05]} />
        <meshStandardMaterial
          color={BG_VOID}
          emissive={VOXEL_GLOW_SOFT}
          emissiveIntensity={0.35}
          roughness={1}
          metalness={0}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
